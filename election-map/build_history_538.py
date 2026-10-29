"""Build history/<year>.json for 1976–2018 from FiveThirtyEight's election-results CSVs.

Usage: python3 build_history_538.py <csv dir>
The csv dir holds election_results_{presidential,senate,house,gubernatorial}.csv from
https://github.com/fivethirtyeight/election-results (raw.githubusercontent.com/fivethirtyeight/election-results/main/).
Output records have the same shape as build_history.py so the page treats every past year alike.
"""
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
YEARS = [str(y) for y in range(1976, 2019, 2)]
GOV_FROM = 1996  # first year with governor results in the dataset
STATES = set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split())
SOURCES = ["FiveThirtyEight election-results（彙整 FEC、眾議院書記官處與各州選務機關）", "MIT Election Data + Science Lab（1976–1996 總統）"]

# Electoral votes by census apportionment: 1990 census for 2000, 2000 census for 2004–2008, 2010 census for 2012–2020.
EV_1990 = dict(AL=9, AK=3, AZ=8, AR=6, CA=54, CO=8, CT=8, DE=3, DC=3, FL=25, GA=13, HI=4, ID=4, IL=22, IN=12, IA=7, KS=6, KY=8, LA=9, ME=4, MD=10, MA=12, MI=18, MN=10, MS=7, MO=11, MT=3, NE=5, NV=4, NH=4, NJ=15, NM=5, NY=33, NC=14, ND=3, OH=21, OK=8, OR=7, PA=23, RI=4, SC=8, SD=3, TN=11, TX=32, UT=5, VT=3, VA=13, WA=11, WV=5, WI=11, WY=3)
EV_2000 = dict(EV_1990, AZ=10, CA=55, CO=9, CT=7, FL=27, GA=15, IL=21, IN=11, MI=17, MS=6, NV=5, NY=31, NC=15, OH=20, OK=7, PA=21, TX=34, WI=10)
EV_2010 = dict(EV_2000, AZ=11, FL=29, GA=16, IL=20, IA=6, LA=8, MA=11, MI=16, MO=10, NV=6, NJ=14, NY=29, OH=18, PA=20, SC=9, TX=38, UT=6, WA=12)
EV_BY_YEAR = {"2000": EV_1990, "2004": EV_2000, "2008": EV_2000, "2012": EV_2010, "2016": EV_2010}
# Electoral votes split from the statewide winner by congressional district.
EV_SPLIT = {("2008", "NE"): {"R": 4, "D": 1}, ("2016", "ME"): {"D": 3, "R": 1}}
# Official electoral college totals (faithless electors and the 2000 DC abstention make these differ from pledged sums).
PRES_EV = {"2000": (266, 271), "2004": (251, 286), "2008": (365, 173), "2012": (332, 206), "2016": (227, 304)}
# Senate party breakdown when the new Congress convened (independents caucus with Democrats).
SENATE_COMP = {
    "1976": {"D": 61, "I": 1, "R": 38}, "1978": {"D": 58, "I": 1, "R": 41}, "1980": {"D": 46, "I": 1, "R": 53},
    "1982": {"D": 46, "I": 0, "R": 54}, "1984": {"D": 47, "I": 0, "R": 53}, "1986": {"D": 55, "I": 0, "R": 45},
    "1988": {"D": 55, "I": 0, "R": 45}, "1990": {"D": 56, "I": 0, "R": 44}, "1992": {"D": 57, "I": 0, "R": 43},
    "1994": {"D": 47, "I": 0, "R": 53}, "1996": {"D": 45, "I": 0, "R": 55}, "1998": {"D": 45, "I": 0, "R": 55},
    "2000": {"D": 50, "I": 0, "R": 50}, "2002": {"D": 48, "I": 1, "R": 51}, "2004": {"D": 44, "I": 1, "R": 55},
    "2006": {"D": 49, "I": 2, "R": 49}, "2008": {"D": 57, "I": 2, "R": 41}, "2010": {"D": 51, "I": 2, "R": 47},
    "2012": {"D": 53, "I": 2, "R": 45}, "2014": {"D": 44, "I": 2, "R": 54}, "2016": {"D": 46, "I": 2, "R": 52},
    "2018": {"D": 45, "I": 2, "R": 53},
}
# House flips compare the same district number, which is meaningless right after a census redraw.
NO_HOUSE_FLIPS = {"1982", "1992", "2002", "2012"}


# Louisiana decides most races in a November "jungle primary"; a runoff, when held, decides the seat.
STAGE_RANK = {"jungle primary": 0, "general": 1, "runoff": 2, "recall": 3}
# Governors who changed party in office: (state, year of the switch, new party).
GOV_SWITCHES = [("WV", 2017, "R")]


def party_of(row):
    p = (row.get("party") or row.get("ballot_party") or "").upper()
    return "D" if p in ("DEM", "DFL", "D") else "R" if p in ("REP", "R") else "I"


def read(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return list(csv.DictReader(f))


def races_from(rows, keep_district=False):
    """Collapse CSV rows into one result per seat and cycle.

    Returns {(cycle, state, seat, special): {"cands": [(name, party, pct)], "winner": party, ...}}.
    A runoff replaces the general election for the same seat; ranked-choice races keep the last round.
    """
    groups = defaultdict(list)
    for r in rows:
        if r["state_abbrev"] not in STATES or r["stage"] not in STAGE_RANK:
            continue
        groups[r["race_id"]].append(r)
    seats = {}
    for rid, rs in groups.items():
        rounds = [int(r["ranked_choice_round"]) for r in rs if r["ranked_choice_round"]]
        if rounds:
            rs = [r for r in rs if not r["ranked_choice_round"] or int(r["ranked_choice_round"]) == max(rounds)]
        total = sum(float(r["votes"] or 0) for r in rs)
        cands = defaultdict(lambda: {"votes": 0.0, "parties": set(), "winner": False, "unopposed": False})
        for r in rs:
            if not r["candidate_name"]:
                continue
            c = cands[r["candidate_name"]]
            c["votes"] += float(r["votes"] or 0)
            c["parties"].add(party_of(r))
            c["winner"] |= r["winner"] == "true"
            c["unopposed"] |= r["unopposed"] == "true"
        if not cands:
            continue
        lst = []
        for name, c in cands.items():
            party = "D" if "D" in c["parties"] else "R" if "R" in c["parties"] else "I"
            pct = round(100 * c["votes"] / total, 1) if total else None
            lst.append({"name": name, "party": party, "pct": pct, "winner": c["winner"], "unopposed": c["unopposed"], "votes": c["votes"]})
        lst.sort(key=lambda c: (not c["winner"], -c["votes"]))
        r0 = rs[0]
        # A recall replaces the governor elected at the last regular election; key it like a regular race.
        key = (r0["cycle"], r0["state_abbrev"], r0["office_seat_name"] if keep_district else (r0["office_seat_name"] or ""), r0["special"] == "true" and r0["stage"] != "recall")
        stage_rank = STAGE_RANK[r0["stage"]]
        if key in seats and seats[key]["stage_rank"] > stage_rank:
            continue
        seats[key] = {"cands": lst, "stage_rank": stage_rank, "runoff": r0["stage"] == "runoff", "jungle": r0["stage"] == "jungle primary", "recall": r0["stage"] == "recall"}
    return seats


def margin_rating(winner_party, margin, uncontested=False):
    side = "R" if winner_party == "R" else "D"
    m = 100 if uncontested else margin
    return ("Safe" if m >= 15 else "Likely" if m >= 5 else "Lean") + " " + side


def record(state, seat, prev_party=None):
    """Turn a collapsed seat into the page's race record (winner, both main candidates, margin rating)."""
    c = seat["cands"]
    w = c[0]
    runner = c[1] if len(c) > 1 else None
    uncontested = runner is None or w["unopposed"] or (w["pct"] or 0) >= 99.5
    margin = (w["pct"] or 0) - ((runner or {}).get("pct") or 0)
    label = lambda x, want: x["name"] + ("" if x["party"] == want else f" ({x['party']})")
    if w["party"] == "R":
        rep, dem = w, runner
    else:
        dem, rep = w, runner
    rec = {
        "state": state, "winner": w["party"], "rating": margin_rating(w["party"], margin, uncontested),
        "dem": label(dem, "D") if dem else None, "rep": label(rep, "R") if rep else None,
        "demPct": dem["pct"] if dem else None, "repPct": rep["pct"] if rep else None,
        "dPct": dem["pct"] if dem else None, "rPct": rep["pct"] if rep else None,
        "uncontested": uncontested, "flip": prev_party is not None and prev_party != w["party"],
    }
    notes = []
    if seat.get("runoff"):
        notes.append("以決選結果為準")
    if seat.get("recall"):
        notes.append("罷免選舉")
    if seat.get("jungle"):
        notes.append("路易斯安那州全黨派初選直接勝出")
    if dem and dem["party"] != "D" or rep and rep["party"] != "R":
        notes.append("主要對手非兩大黨或同黨對決，括號內為政黨")
    if notes:
        rec["note"] = "；".join(notes)
    return rec


def main():
    src = Path(sys.argv[1])
    # Presidential results before 2000 are not in the FiveThirtyEight data; they come from a separate
    # state-level file (MIT Election Data + Science Lab) converted to data/history/president-1976-1996.json.
    old_pres_file = ROOT / "data" / "history" / "president-1976-1996.json"
    old_pres = json.loads(old_pres_file.read_text(encoding="utf-8")) if old_pres_file.exists() else {}
    pres_rows = read(src / "election_results_presidential.csv")
    sen = races_from(read(src / "election_results_senate.csv"))
    gov = races_from(read(src / "election_results_gubernatorial.csv"))
    house = races_from(read(src / "election_results_house.csv"), keep_district=True)

    # Last winner per Senate seat (state + class) and per governorship, walking forward in time.
    def walk(seats, seat_key):
        prev, out = {}, {}
        for key in sorted(seats, key=lambda k: (int(k[0]), k[3])):
            s = seats[key]
            sk = seat_key(key)
            out[key] = prev.get(sk)
            prev[sk] = s["cands"][0]["party"]
        return out

    sen_prev = walk(sen, lambda k: (k[1], k[2]))
    gov_prev = walk(gov, lambda k: k[1])

    out_dir = ROOT / "history"
    out_dir.mkdir(exist_ok=True)
    for year in YEARS:
        races, comp = {}, {}
        # President
        if year in EV_BY_YEAR:
            ev = EV_BY_YEAR[year]
            assert sum(ev.values()) == 538, (year, sum(ev.values()))
            by_state = defaultdict(list)
            for r in pres_rows:
                if r["cycle"] == year and r["stage"] == "general" and not r["office_seat_name"] and r["state_abbrev"] in STATES | {"DC"}:
                    by_state[r["state_abbrev"]].append(r)
            nat = {"D": [0, ""], "R": [0, ""]}
            total_votes = 0
            for st, rs in by_state.items():
                tot = sum(float(r["votes"] or 0) for r in rs)
                total_votes += tot
                # Count every ballot line of the two nominees (New York fusion lines carry them as WFP, CON, ...).
                nominee = {party_of(r): r["candidate_name"] for r in rs if party_of(r) in ("D", "R") and r["candidate_name"]}
                best = {p: [name, 0.0] for p, name in nominee.items()}
                for r in rs:
                    for p, name in nominee.items():
                        if r["candidate_name"] == name:
                            best[p][1] += float(r["votes"] or 0)
                d, rr = best.get("D", ["", 0]), best.get("R", ["", 0])
                for p, v in (("D", d), ("R", rr)):
                    nat[p][0] += v[1]
                    nat[p][1] = nat[p][1] or v[0]
                dp, rp = round(100 * d[1] / tot, 1), round(100 * rr[1] / tot, 1)
                w = "D" if d[1] > rr[1] else "R"
                races["pres-" + st] = {
                    "state": st, "winner": w, "rating": margin_rating(w, abs(dp - rp)),
                    "dem": d[0], "rep": rr[0], "demPct": dp, "repPct": rp, "dPct": dp, "rPct": rp,
                    "ev": ev[st], "evSplit": EV_SPLIT.get((year, st)),
                }
            assert len(races) == 51, (year, len(races))
            dev, rev = PRES_EV[year]
            comp["pres"] = {
                "D": {"name": nat["D"][1], "ev": dev, "pct": round(100 * nat["D"][0] / total_votes, 1)},
                "R": {"name": nat["R"][1], "ev": rev, "pct": round(100 * nat["R"][0] / total_votes, 1)},
            }
        if year in old_pres:
            p = old_pres[year]
            comp["pres"] = p["national"]
            for st, x in p["states"].items():
                races["pres-" + st] = {
                    "state": st, "winner": x["winner"], "rating": margin_rating(x["winner"], abs(x["dPct"] - x["rPct"])),
                    "dem": p["national"]["D"]["name"], "rep": p["national"]["R"]["name"],
                    "demPct": x["dPct"], "repPct": x["rPct"], "dPct": x["dPct"], "rPct": x["rPct"],
                    "ev": x["ev"], "evSplit": x.get("evSplit"),
                }
        # Senate
        comp["senate"] = SENATE_COMP[year]
        for key in sorted(k for k in sen if k[0] == year):
            rid = "senate-" + key[1]
            if rid in races:
                rid += "-2"
            rec = record(key[1], sen[key], sen_prev[key])
            rec["special"] = key[3]
            races[rid] = rec
        # Governors: this year plus the following odd year (VA/NJ, KY/LA/MS).
        odd = str(int(year) + 1)
        for y in ((year, odd) if int(year) >= GOV_FROM else ()):
            for key in sorted(k for k in gov if k[0] == y):
                rec = record(key[1], gov[key], gov_prev[key])
                if y == odd:
                    rec["oddYear"] = y
                races["gov-" + key[1]] = rec
        last = {}
        for key in sorted(gov, key=lambda k: int(k[0])):
            if int(key[0]) <= int(odd):
                last[key[1]] = gov[key]["cands"][0]["party"]
        for st, when, new in GOV_SWITCHES:
            if int(odd) >= when and st in last:
                last[st] = new
        # Totals need every state's last election; 4-year terms make that complete from the 1998 cycle on.
        if int(year) >= GOV_FROM + 2:
            comp["gov"] = {p: sum(1 for v in last.values() if v == p) for p in ("D", "R", "I")}
        if "gov" in comp:
            comp["gov"]["note"] = "依選舉結果推算（含罷免與換黨），不含任期中的繼任"
        # House: per-district results grouped by state.
        hprev = {k[1:3]: house[k]["cands"][0]["party"] for k in house if k[0] == str(int(year) - 2) and not k[3]}
        by_state = defaultdict(list)
        # Regular races, plus special elections for districts without one (e.g. Texas 2006 after a court redraw).
        regular = {k[1:3] for k in house if k[0] == year and not k[3]}
        for key in house:
            if key[0] != year or (key[3] and key[1:3] in regular):
                continue
            m = re.search(r"(\d+)", key[2] or "")
            n = int(m.group(1)) if m else 1
            rec = record(key[1], house[key], None if year in NO_HOUSE_FLIPS else hprev.get(key[1:3]))
            w = house[key]["cands"][0]
            by_state[key[1]].append({
                "id": f"{key[1]}-{n}", "district": n, "rating": rec["rating"], "incumbent": w["name"],
                "incumbentParty": w["party"], "dPct": rec["dPct"], "rPct": rec["rPct"],
                "uncontested": rec["uncontested"], "flip": rec["flip"], "note": rec.get("note"),
            })
        cats = {"Safe D": "safeD", "Likely D": "likelyD", "Lean D": "leanD", "Lean R": "leanR", "Likely R": "likelyR", "Safe R": "safeR"}
        hD = hR = hI = 0
        for st, ds in by_state.items():
            ds.sort(key=lambda d: d["district"])
            rec = {"seats": len(ds), "tossup": 0, **{v: 0 for v in cats.values()}, "districts": ds}
            for d in ds:
                rec[cats[d["rating"]]] += 1
                hD += d["incumbentParty"] == "D"; hR += d["incumbentParty"] == "R"; hI += d["incumbentParty"] == "I"
            races["house-" + st] = rec
        if hD + hR + hI:  # the dataset has no House results for 1982–1996
            comp["house"] = {"D": hD, "R": hR, **({"I": hI} if hI else {})}
        data = {"year": year, "races": races, "comp": comp, "dgeo": {}, "sources": SOURCES}
        path = out_dir / f"{year}.json"
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        seats = sum(r["seats"] for k, r in races.items() if k.startswith("house-"))
        print(f"{year}: house {hD}D/{hR}R{f'/{hI}I' if hI else ''} ({seats} seats), senate races {sum(1 for k in races if k.startswith('senate-'))}, "
              f"gov {comp.get('gov', '-')}, pres {comp.get('pres', {}).get('D', {}).get('name', '-')} vs {comp.get('pres', {}).get('R', {}).get('name', '-')}, {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
