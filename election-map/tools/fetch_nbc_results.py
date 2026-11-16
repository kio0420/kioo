#!/usr/bin/env python3
"""Fetch actual results from NBC News public results pages and update data/results.json in place.

Usage: python3 tools/fetch_nbc_results.py [--dir DIR]
  --dir DIR   read previously downloaded senate.html / governor.html / house.html from DIR instead of fetching

Pages (plain requests only; if a page does not return its embedded __NEXT_DATA__ it is skipped, nothing is bypassed):
  https://www.nbcnews.com/politics/2026-elections/{senate,governor,house}-results
Parsing is defensive: missing keys skip the race. A winner is set only when NBC marks one explicitly
(mapData.<key>.winner / candidate.isWinner). A called race is never downgraded.
"""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
BASE = "https://www.nbcnews.com/politics/2026-elections/{}-results"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
FIELDS = ("status", "called", "calledBy", "dem", "rep", "other", "demPct", "repPct", "pctReporting", "note")
LABEL = {"D": "民主黨", "R": "共和黨", "I": "獨立/其他"}


def fetch(office, local_dir):
    if local_dir:
        try:
            return (Path(local_dir) / f"{office}.html").read_text(encoding="utf-8")
        except OSError:
            return None
    try:
        r = subprocess.run(["curl", "-sS", "-L", "--max-time", "60", "-A", UA, BASE.format(office)],
                           capture_output=True, text=True, check=True)
        return r.stdout
    except Exception as e:  # noqa: BLE001
        print(f"fetch {office} failed: {e}", file=sys.stderr)
        return None


def page_props(html):
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html or "", re.S)
    if not m:
        return None
    try:
        pp = json.loads(m.group(1))["props"]["pageProps"]
    except (ValueError, KeyError, TypeError):
        return None
    return pp if isinstance(pp, dict) else None


def side(party):
    p = (party or "").strip().lower()
    return "D" if p == "dem" else "R" if p == "rep" else "I"


def num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def parse_entry(entry):
    """One mapData entry -> record fields, or None when it holds no candidates."""
    tip = entry.get("tooltip") if isinstance(entry, dict) else None
    cands = tip.get("candidates") if isinstance(tip, dict) else None
    if not cands:
        return None
    cands = [c for c in cands if isinstance(c, dict)]
    best = {}
    for c in cands:
        s = side(c.get("party"))
        v = num(c.get("votes", c.get("vote"))) or 0
        if s not in best or v > (num(best[s].get("votes", best[s].get("vote"))) or 0):
            best[s] = c
    total = sum(num(c.get("votes", c.get("vote"))) or 0 for c in cands)
    total = num(tip.get("totalVote")) or total
    votes = lambda s: (num(best[s].get("votes", best[s].get("vote"))) if s in best else None)  # noqa: E731
    pct = lambda s: (num(best[s].get("percentVote")) if s in best else None)  # noqa: E731
    dem, rep = votes("D"), votes("R")
    other = max(total - (dem or 0) - (rep or 0), 0) if total else None
    called = None
    win = entry.get("winner") if isinstance(entry.get("winner"), dict) else None
    if win and win.get("isWinner", True):
        called = side(win.get("party"))
    else:
        for c in cands:
            if c.get("isWinner") is True:
                called = side(c.get("party"))
    leader = max(cands, key=lambda c: num(c.get("votes", c.get("vote"))) or 0) if total else None
    rec = {"called": called, "dem": dem, "rep": rep, "other": other, "demPct": pct("D"), "repPct": pct("R"),
           "pctReporting": num(tip.get("percentIn")), "total": total,
           "leader": side(leader.get("party")) if leader else None,
           "winnerName": (win or {}).get("name")}
    return rec


def make_record(p):
    if p["called"]:
        status, note = "called", ("獨立/其他候選人當選：" + (p["winnerName"] or "") if p["called"] == "I" else "")
    elif p["total"]:
        status = "counting"
        note = "計票中" + (LABEL[p["leader"]] + "領先" if p["leader"] else "")
    else:
        status, note = "pending", ""
    return {"status": status, "called": p["called"], "calledBy": "NBC News" if p["called"] else None,
            "dem": p["dem"], "rep": p["rep"], "other": p["other"], "demPct": p["demPct"], "repPct": p["repPct"],
            "pctReporting": p["pctReporting"], "note": note}


def collect(office, pp):
    """-> {our key: parsed}, plus list of unmapped NBC race names."""
    out, unmapped = {}, []
    md = pp.get("mapData")
    if not isinstance(md, dict):
        return out, unmapped
    for k, entry in md.items():
        p = parse_entry(entry)
        if p is None or "~" in str(k) or k == "US":
            continue
        st = entry.get("stateCode") or k
        if office == "house":
            if not (isinstance(k, str) and k.isdigit() and len(k) >= 3):
                unmapped.append(k)
                continue
            out[f"house-{st}-{int(k[-2:])}"] = p
        else:
            out[("senate-" if office == "senate" else "gov-") + str(k)] = p
    return out, unmapped


def main():
    local = sys.argv[sys.argv.index("--dir") + 1] if "--dir" in sys.argv else None
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    path = DATA / "results.json"
    res = json.loads(path.read_text(encoding="utf-8"))
    races = res.setdefault("races", {})
    changed = 0
    summary, unmapped_all = {}, []
    for office in ("senate", "governor", "house"):
        pp = page_props(fetch(office, local))
        if pp is None:
            print(f"{office}: no usable page data, skipped", file=sys.stderr)
            continue
        parsed, unm = collect(office, pp)
        unmapped_all += [f"{office}:{u}" for u in unm]
        for key, p in parsed.items():
            if key not in races:
                unmapped_all.append(f"{office}:{key}")
                continue
            new = make_record(p)
            old = races[key]
            if old.get("status") == "called" and new["status"] != "called":
                continue  # never downgrade
            if all(old.get(f) == new[f] for f in FIELDS):
                continue
            races[key] = {**new, "asOf": now}
            changed += 1
    if changed or "NBC" not in str(res.get("source", "")):
        res["updated"], res["asOf"], res["source"] = now, now, "NBC News results pages"
    tot = {c: {"D": 0, "R": 0, "I": 0, "called": 0} for c in ("senate", "house", "governor")}
    cnt = {c: {"called": 0, "counting": 0, "pending": 0} for c in tot}
    for key, r in races.items():
        c = {"senate": "senate", "gov": "governor", "house": "house"}[key.split("-")[0]]
        cnt[c][r.get("status") if r.get("status") in ("called", "counting") else "pending"] += 1
        if r.get("called") in ("D", "R", "I"):
            tot[c][r["called"]] += 1
            tot[c]["called"] += 1
    res["totals"] = tot
    head = {k: v for k, v in res.items() if k != "races"}
    lines = ",\n".join(f' {json.dumps(k)}:{json.dumps(v, ensure_ascii=False, separators=(",", ":"))}' for k, v in races.items())
    parts = [json.dumps(head[k], ensure_ascii=False, separators=(",", ":")) for k in ("updated", "source", "asOf")]
    text = (f'{{"updated":{parts[0]},"source":{parts[1]},"asOf":{parts[2]},"races":{{\n{lines}\n}},'
            f'"totals":{json.dumps(tot, separators=(",", ":"))}}}\n')
    path.write_text(text, encoding="utf-8")
    print(f"updated races: {changed}")
    for c in cnt:
        print(f"{c}: called {cnt[c]['called']} (D {tot[c]['D']} / R {tot[c]['R']} / I {tot[c]['I']}), "
              f"counting {cnt[c]['counting']}, pending {cnt[c]['pending']}")
    print("unmapped NBC races:", unmapped_all or "none")


if __name__ == "__main__":
    main()
