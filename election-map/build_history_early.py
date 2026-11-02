"""Build history/<year>.json for 1960–1972 (President only; no Senate/House data for those years).

Usage: python3 build_history_early.py
Reads data/history/president-1960-1972.json (state results compiled in the eigentaylor/margin-matters repo).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# Electors not won by either major party (official electoral college totals).
OTHER_EV = {"1960": ("Harry F. Byrd", 15), "1968": ("George Wallace", 46), "1972": ("John Hospers", 1)}
SOURCES = ["eigentaylor/margin-matters 彙整的各州得票（原始資料轉錄自 Wikipedia，非官方原始數字）"]


def rating(winner, margin):
    if winner == "O":
        return "Other"
    return ("Safe" if margin >= 15 else "Likely" if margin >= 5 else "Lean") + " " + winner


def main():
    data = json.loads((ROOT / "data" / "history" / "president-1960-1972.json").read_text(encoding="utf-8"))
    for year in ("1960", "1964", "1968", "1972"):
        p = data[year]
        nat = dict(p["national"])
        if year in OTHER_EV:
            nat["O"] = {"name": OTHER_EV[year][0], "ev": OTHER_EV[year][1]}
        races = {}
        for st, x in p["states"].items():
            top = max(x["dPct"], x["rPct"], (x.get("other") or {}).get("pct", 0))
            second = sorted([x["dPct"], x["rPct"], (x.get("other") or {}).get("pct", 0)])[-2]
            races["pres-" + st] = {
                "state": st, "winner": x["winner"], "rating": rating(x["winner"], top - second),
                "dem": nat["D"]["name"], "rep": nat["R"]["name"], "demPct": x["dPct"], "repPct": x["rPct"],
                "dPct": x["dPct"], "rPct": x["rPct"], "ev": x["ev"], "other": x.get("other"), "note": x.get("note"),
            }
        out = {"year": year, "races": races, "comp": {"pres": nat}, "dgeo": {}, "sources": SOURCES}
        path = ROOT / "history" / f"{year}.json"
        path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(path.name, len(races), "states", nat["D"]["ev"], nat["R"]["ev"], nat.get("O"))


if __name__ == "__main__":
    main()
