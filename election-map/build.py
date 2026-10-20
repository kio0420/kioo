"""Build index.html from template.html + map geometry + poll data.

Usage: python3 build.py
Reads data/senate.json, data/governor.json, data/house.json and geo/states-paths.json,
writes index.html (self-contained) and seed/ (documents and write batches for the artifact db).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"


def load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def snapshot():
    senate, gov, house = load("senate.json"), load("governor.json"), load("house.json")
    races = {}
    for r in senate["races"]:
        key = "senate-" + r["state"]
        # A state holding two races in one year keeps the second under its own key (counted, not mapped).
        if key in races:
            key += "-2"
        races[key] = {**r, "chamber": "senate", "updated": senate["updated"]}
    for r in gov["races"]:
        races["gov-" + r["state"]] = {**r, "chamber": "gov", "updated": gov["updated"]}
    for s in house["states"]:
        races["house-" + s["state"]] = {**s, "chamber": "house", "updated": house["updated"]}
    meta = {
        "updated": max(senate["updated"], gov["updated"], house["updated"]),
        "senate": {"currentSeats": senate.get("currentSeats"), "notUp": senate.get("notUp")},
        "gov": {"currentGovernors": gov.get("currentGovernors")},
        "house": {"current": house.get("current"), "ratingSource": house.get("ratingSource"), "ratingUrl": house.get("ratingUrl")},
        "national": house.get("national", {}),
    }
    return {"meta": meta, "races": races}


def main():
    snap = snapshot()
    geo = (ROOT / "geo" / "states-paths.json").read_text(encoding="utf-8")
    page = (ROOT / "template.html").read_text(encoding="utf-8")
    # Escape "</" so JSON can never close the <script> element early.
    as_script = lambda s: s.replace("</", "<\\/")
    page = page.replace("__GEO__", as_script(geo)).replace(
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
