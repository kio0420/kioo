// Project per-state congressional district GeoJSON into SVG path data.
// Usage: node districts2svg.mjs <dir with ST.geojson files> <out.json>
// Output: {"TX": {"w": 600, "h": 560, "d": {"1": "M...", ...}, "c": {"1": [x, y], ...}}, ...}
import fs from "node:fs";
import path from "node:path";
import { geoAlbersUsa, geoConicEqualArea, geoPath } from "d3-geo";
import { topology } from "topojson-server";
import { presimplify, quantile, simplify } from "topojson-simplify";
import { feature } from "topojson-client";

const [, , dir, out] = process.argv;
const W = 600, PAD = 12;
const result = {};

for (const file of fs.readdirSync(dir).filter((f) => /^[A-Z]{2}\.geojson$/.test(f)).sort()) {
  const st = file.slice(0, 2);
  const fc = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  // Simplify on a shared topology so neighbouring districts keep common borders.
  let topo = presimplify(topology({ d: fc }, 1e5));
  topo = simplify(topo, quantile(topo, 0.12));
  const simple = feature(topo, topo.objects.d);
  simple.features = simple.features.filter((f) => f.geometry);

  // Alaska crosses the antimeridian and Hawaii is far out; AlbersUsa handles both, a state-centred conic suits the rest.
  const proj = st === "AK" || st === "HI" ? geoAlbersUsa() : geoConicEqualArea().parallels([29.5, 45.5]).rotate([-centerLon(fc), 0]);
  proj.fitWidth(W - PAD * 2, simple);
  const gp = geoPath(proj);
  const [[x0, y0], [x1, y1]] = gp.bounds(simple);
  const tx = PAD - x0, ty = PAD - y0;
  const h = Math.ceil(y1 - y0 + PAD * 2);
  const round = (s) => s.replace(/-?\d+\.\d+/g, (n) => (+n).toFixed(1));
  const entry = { w: W, h, d: {}, c: {} };
  for (const f of simple.features) {
    const n = String(f.properties.district);
    const d = gp(f);
    if (!d) continue;
    entry.d[n] = round(d.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (_, x, y) => `${+x + tx},${+y + ty}`));
    const [cx, cy] = gp.centroid(f);
    entry.c[n] = [+(cx + tx).toFixed(1), +(cy + ty).toFixed(1)];
  }
  result[st] = entry;
}

function centerLon(fc) {
  let min = 180, max = -180;
  const walk = (c) => (typeof c[0] === "number" ? ((min = Math.min(min, c[0])), (max = Math.max(max, c[0]))) : c.forEach(walk));
  fc.features.forEach((f) => f.geometry && walk(f.geometry.coordinates));
  return (min + max) / 2;
}

fs.writeFileSync(out, JSON.stringify(result));
const size = fs.statSync(out).size;
console.log(`${Object.keys(result).length} states, ${Object.values(result).reduce((a, s) => a + Object.keys(s.d).length, 0)} districts, ${(size / 1024).toFixed(0)} KB`);
