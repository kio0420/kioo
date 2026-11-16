"""Thin projected SVG paths: drop points closer than TOL px to the last kept point.

Usage: python3 thinpaths.py in.json out.json
"""
import json
import re
import sys

TOL = 1.4


def thin(d):
    out = []
    for sub in re.findall(r"M[^M]*", d):
        closed = sub.rstrip().endswith("Z")
        pts = [tuple(map(float, p.split(","))) for p in re.findall(r"-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?", sub)]
        kept = []
        for x, y in pts:
            if not kept or abs(x - kept[-1][0]) + abs(y - kept[-1][1]) >= TOL:
                kept.append((x, y))
        if len(kept) < 3:
            continue
        out.append("M" + "L".join(f"{x:g},{y:g}" for x, y in kept) + ("Z" if closed else ""))
    return "".join(out)


data = json.load(open(sys.argv[1]))
for st in data.values():
    st["d"] = {n: thin(d) for n, d in st["d"].items()}
json.dump(data, open(sys.argv[2], "w"), separators=(",", ":"))
print(f"{sum(len(p) for s in data.values() for p in s['d'].values()) / 1024:.0f} KB of path data")
