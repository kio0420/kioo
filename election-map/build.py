"""Build index.html from template.html + map geometry + poll data.

Usage: python3 build.py
Reads data/senate.json, data/governor.json, data/house.json, data/districts.json (optional),
data/results.json (optional actual results; merged as "actual" on race docs and "results" in meta/summary)
and geo/states-paths.json + geo/districts-paths.json (optional),
writes index.html (self-contained) and seed/ (documents and write batches for the artifact db).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"


def load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


ACTUAL_FIELDS = ("status", "called", "calledBy", "dem", "rep", "other", "demPct", "repPct", "pctReporting", "note", "asOf")


def load_results():
    """data/results.json (optional). Missing file or bad JSON means every race is pending."""
    try:
        res = load("results.json")
    except (OSError, ValueError):
        return {"races": {}}
    return res if isinstance(res, dict) and isinstance(res.get("races"), dict) else {"races": {}}


def actual_of(results, key):
    """Normalised actual-result record for one race key; absent keys become pending. Empty fields are dropped to keep docs small."""
    raw = results["races"].get(key)
    raw = raw if isinstance(raw, dict) else {}
    a = {f: raw.get(f) for f in ACTUAL_FIELDS}
    if a["status"] not in ("pending", "counting", "called"):
        a["status"] = "called" if a["called"] in ("D", "R", "I") else "pending"
    if a["called"] not in ("D", "R", "I"):
        a["called"] = None
        if a["status"] == "called":
            a["status"] = "pending"
    return {f: v for f, v in a.items() if v not in (None, "") or f in ("status", "called")}


def result_totals(results, actuals):
    """Count called races per chamber (senate/house/governor) from the normalised actuals (the file's own totals are not trusted)."""
    tot = {c: {"D": 0, "R": 0, "I": 0, "called": 0} for c in ("senate", "house", "governor")}
    for key, a in actuals.items():
        chamber = {"senate": "senate", "gov": "governor", "house": "house"}[key.split("-")[0]]
        if a.get("called"):
            tot[chamber][a["called"]] += 1
            tot[chamber]["called"] += 1
    return tot


def snapshot():
    results = load_results()
    actuals = {}
    senate, gov, house = load("senate.json"), load("governor.json"), load("house.json")
    races = {}
    for r in senate["races"]:
        key = "senate-" + r["state"]
        # A state holding two races in one year keeps the second under its own key (counted, not mapped).
        if key in races:
            key += "-2"
        actuals[key] = actual_of(results, key)
        races[key] = {**r, "chamber": "senate", "updated": senate["updated"], "actual": actuals[key]}
    for r in gov["races"]:
        key = "gov-" + r["state"]
        actuals[key] = actual_of(results, key)
        races[key] = {**r, "chamber": "gov", "updated": gov["updated"], "actual": actuals[key]}
    districts = load("districts.json")["districts"] if (DATA / "districts.json").exists() else []
    by_state = {}
    for d in districts:
        by_state.setdefault(d["state"], []).append(d)
    cats = {"Safe D": "safeD", "Likely D": "likelyD", "Lean D": "leanD", "Toss-up": "tossup",
            "Lean R": "leanR", "Likely R": "likelyR", "Safe R": "safeR"}
    for s in house["states"]:
        rec = {**s, "chamber": "house", "updated": house["updated"]}
        ds = sorted(by_state.get(s["state"], []), key=lambda d: d["district"])
        if ds:
            rec["districts"] = ds
        # A complete district list is the source of truth for the state's category counts.
        if len(ds) == s["seats"] and all(d.get("rating") in cats for d in ds):
            for key in cats.values():
                rec[key] = 0
            for d in ds:
                rec[cats[d["rating"]]] += 1
            rec["tossupDistricts"] = [d["id"] for d in ds if d["rating"] == "Toss-up"]
        # Per-district actuals keyed by district number, e.g. {"1": {...}, "2": {...}}.
        act = {}
        for d in ds:
            k = f"house-{d['state']}-{d['district']}"
            actuals[k] = act[str(d["district"])] = actual_of(results, k)
        rec["actual"] = act
        races["house-" + s["state"]] = rec
    meta = {
        "updated": max(senate["updated"], gov["updated"], house["updated"]),
        "senate": {"currentSeats": senate.get("currentSeats"), "notUp": senate.get("notUp")},
        "gov": {"currentGovernors": gov.get("currentGovernors")},
        "house": {"current": house.get("current"), "ratingSource": house.get("ratingSource"), "ratingUrl": house.get("ratingUrl")},
        "national": house.get("national", {}),
        "results": {"updated": results.get("updated"), "asOf": results.get("asOf"), "source": results.get("source"),
                    "totals": result_totals(results, actuals)},
    }
    return {"meta": meta, "races": races}


def main():
    snap = snapshot()
    geo = (ROOT / "geo" / "states-paths.json").read_text(encoding="utf-8")
    dgeo_file = ROOT / "geo" / "districts-paths.json"
    dgeo = dgeo_file.read_text(encoding="utf-8") if dgeo_file.exists() else "{}"
    page = (ROOT / "template.html").read_text(encoding="utf-8")
    # Escape "</" so JSON can never close the <script> element early.
    as_script = lambda s: s.replace("</", "<\\/")
    page = page.replace("__GEO__", as_script(geo)).replace("__DGEO__", as_script(dgeo)).replace(
        "__SNAPSHOT__", as_script(json.dumps(snap, ensure_ascii=False, separators=(",", ":")))
    )
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    write_batches(snap)
    print(f"index.html: {len(page):,} bytes, {len(snap['races'])} race records")


def write_batches(snap):
    """Write one JSON file per db document plus ArtifactData batch manifests (<=50 writes each) to seed/.

    If seed/versions.json exists ({"races/senate-TX": 3, ...}), each write carries that if_version,
    which the artifact db requires when overwriting an existing document.
    """
    out = ROOT / "seed"
    out.mkdir(exist_ok=True)
    for old in out.glob("*.json"):
        if old.name != "versions.json":
            old.unlink()
    vfile = out / "versions.json"
    versions = json.loads(vfile.read_text()) if vfile.exists() else {}
    docs = [("races", k, v) for k, v in snap["races"].items()] + [("meta", "summary", snap["meta"])]
    writes = []
    for coll, doc_id, data in docs:
        path = out / f"{coll}-{doc_id}.json"
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        w = {"op": "set", "collection": coll, "doc_id": doc_id, "file_path": str(path)}
        if f"{coll}/{doc_id}" in versions:
            w["if_version"] = versions[f"{coll}/{doc_id}"]
        writes.append(w)
    for i in range(0, len(writes), 50):
        (out / f"batch{i // 50}.json").write_text(json.dumps(writes[i:i + 50], indent=1), encoding="utf-8")
    print(f"seed/: {len(writes)} documents in {(len(writes) + 49) // 50} batches ({len(versions)} with if_version)")


if __name__ == "__main__":
    main()
