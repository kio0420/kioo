"""Build history/<year>.json (past election results + that year's district shapes) for the year selector.

Usage: python3 build_history.py
Reads data/history/{president,senate,governor,house-<year>}.json and geo/districts-<year>.json,
writes history/2020.json, history/2022.json, history/2024.json.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "history"
YEARS = ["2020", "2022", "2024"]
SOURCES = ["FiveThirtyEight election-results（彙整 FEC 與各州選務機關）", "美國眾議院書記官處 2024 選舉統計"]


def load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def rating(winner, d, r, uncontested=False):
    """Map a result onto the forecast rating scale: margin ≥15 → Safe, 5–15 → Likely, <5 → Lean.

    Independents who won (King, Sanders) caucus with Democrats and take the Democratic side.
    """
    side = "R" if winner == "R" else "D"
    margin = 100 if uncontested else abs((d or 0) - (r or 0))
    tier = "Safe" if margin >= 15 else "Likely" if margin >= 5 else "Lean"
    return f"{tier} {side}"


def race_record(r, **extra):
    return {
        "state": r["state"], "winner": r["winner"], "rating": rating(r["winner"], r.get("dPct"), r.get("rPct")),
        "dem": r.get("dem"), "rep": r.get("rep"), "demPct": r.get("dPct"), "repPct": r.get("rPct"),
        "dPct": r.get("dPct"), "rPct": r.get("rPct"),
        "flip": bool(r.get("flip")), "special": bool(r.get("special")), "note": r.get("note"), **extra,
    }


def build(year, pres, senate, gov):
    races, comp = {}, {}
    if year in pres:
        p = pres[year]
        comp["pres"] = p["national"]
        names = p["national"]
        for st, s in p["states"].items():
            races["pres-" + st] = {
                "state": st, "winner": s["winner"], "rating": rating(s["winner"], s["dPct"], s["rPct"]),
                "dem": names["D"]["name"], "rep": names["R"]["name"], "demPct": s["dPct"], "repPct": s["rPct"],
                "dPct": s["dPct"], "rPct": s["rPct"], "ev": s["ev"], "evSplit": s.get("evSplit"),
            }
    sen = senate[year]
    comp["senate"] = sen["composition"]
    for r in sen["races"]:
        key = "senate-" + r["state"]
        if key in races:  # two races in one state (e.g. Georgia 2020): counted, only the first is mapped
            key += "-2"
        races[key] = race_record(r)
    # A governor "cycle" includes the following odd year (VA/NJ 2021 and 2025, KY/LA/MS 2023).
    odd = str(int(year) + 1)
    comp["gov"] = (gov.get(odd) or gov[year])["composition"]
    for y in (year, odd):
        for r in gov.get(y, {}).get("races", []):
            races["gov-" + r["state"]] = race_record(r, **({"oddYear": y} if y == odd else {}))
    house = load(f"house-{year}.json")
    comp["house"] = house["composition"]
    by_state = {}
    for d in house["districts"]:
        by_state.setdefault(d["state"], []).append(d)
    cats = {"Safe D": "safeD", "Likely D": "likelyD", "Lean D": "leanD", "Lean R": "leanR", "Likely R": "likelyR", "Safe R": "safeR"}
    for st, ds in by_state.items():
        rec = {"seats": len(ds), "tossup": 0, **{v: 0 for v in cats.values()}, "districts": []}
        for d in sorted(ds, key=lambda x: x["district"]):
            rt = rating(d["winner"], d.get("dPct"), d.get("rPct"), d.get("uncontested"))
            rec[cats[rt]] += 1
            rec["districts"].append({
                "id": d["id"], "district": d["district"], "rating": rt, "incumbent": d.get("name"),
                "incumbentParty": d["winner"], "dPct": d.get("dPct"), "rPct": d.get("rPct"),
                "uncontested": bool(d.get("uncontested")),
                # 2022 flips were matched by district number across the post-census redraw, which is not meaningful.
                "flip": bool(d.get("flip")) and year != "2022",
                "note": d.get("note"),
            })
        races["house-" + st] = rec
    geo_file = ROOT / "geo" / f"districts-{year}.json"
    dgeo = json.loads(geo_file.read_text(encoding="utf-8")) if geo_file.exists() else {}
    return {"year": year, "races": races, "comp": comp, "dgeo": dgeo, "sources": SOURCES}


def main():
    pres, senate, gov = load("president.json"), load("senate.json"), load("governor.json")
    out = ROOT / "history"
    out.mkdir(exist_ok=True)
    for year in YEARS:
        data = build(year, pres, senate, gov)
        path = out / f"{year}.json"
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"{path.name}: {path.stat().st_size // 1024} KB, {len(data['races'])} records, {len(data['dgeo'])} district maps")


if __name__ == "__main__":
    main()
