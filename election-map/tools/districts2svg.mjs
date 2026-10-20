// Project per-state congressional district GeoJSON into SVG path data.
// Usage: node districts2svg.mjs <dir with ST.geojson files> <out.json>, then python3 thinpaths.py <out.json> <final.json>
// Output: {"TX": {"w": 600, "h": 560, "d": {"1": "M...", ...}, "c": {"1": [x, y], ...}}, ...}
import fs from "node:fs";
import path from "node:path";
import { geoAlbersUsa, geoConicEqualArea, geoPath } from "d3-geo";

const [, , dir, out] = process.argv;
const W = 600, PAD = 12;
const result = {};

for (const file of fs.readdirSync(dir).filter((f) => /^[A-Z]{2}\.geojson$/.test(f)).sort()) {
  const st = file.slice(0, 2);
  const fc = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  // Alaska crosses the antimeridian and Hawaii is far out; AlbersUsa handles both, a state-centred conic suits the rest.
  const proj = st === "AK" || st === "HI" ? geoAlbersUsa() : geoConicEqualArea().parallels([29.5, 45.5]).rotate([-centerLon(fc), 0]);
  // Project to the plane at a fixed scale, then rescale from the planar bounds. d3's fitWidth and
  // spherical path code treat rings wound the "wrong" way as whole-globe polygons, which some
  // source files contain; planar coordinates make winding irrelevant.
  const raw = fc.features.map((f) => ({ ...f, geometry: projectGeom(f.geometry, proj) }));
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  const scan = (c) => (typeof c[0] === "number" ? ((bx0 = Math.min(bx0, c[0])), (by0 = Math.min(by0, c[1])), (bx1 = Math.max(bx1, c[0])), (by1 = Math.max(by1, c[1]))) : c.forEach(scan));
  raw.forEach((f) => scan(f.geometry.coordinates));
  const k = (W - PAD * 2) / (bx1 - bx0);
  const fit = (c) => (typeof c[0] === "number" ? [(c[0] - bx0) * k, (c[1] - by0) * k] : c.map(fit));
  const planar = { type: "FeatureCollection", features: raw.map((f) => ({ ...f, geometry: { ...f.geometry, coordinates: fit(f.geometry.coordinates) } })) };
  // Point thinning happens afterwards in thinpaths.py.
  const simple = planar;
  const gp = geoPath(null);
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

function projectGeom(g, proj) {
  const ring = (r) => r.map((c) => proj(c)).filter(Boolean);
  if (g.type === "Polygon") return { type: "Polygon", coordinates: g.coordinates.map(ring).filter((r) => r.length > 3) };
  return { type: "MultiPolygon", coordinates: g.coordinates.map((p) => p.map(ring).filter((r) => r.length > 3)).filter((p) => p.length) };
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
