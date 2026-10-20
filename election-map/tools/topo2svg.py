import json, sys
src, out = sys.argv[1], sys.argv[2]
t = json.load(open(src))
sx, sy = t['transform']['scale']; tx, ty = t['transform']['translate']
arcs = []
for a in t['arcs']:
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy
        pts.append((x*sx+tx, y*sy+ty))
    arcs.append(pts)
def arc(i):
    return arcs[i] if i >= 0 else arcs[~i][::-1]
def ring(r):
    pts = []
    for i in r:
        p = arc(i)
        pts.extend(p if not pts else p[1:])
    return pts
FIPS = {'01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY'}
res = {}
for g in t['objects']['states']['geometries']:
    polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
    d = []; best = (0, None)
    for poly in polys:
        for k, r in enumerate(poly):
            pts = ring(r)
            d.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z')
            if k == 0:
                a = cx = cy = 0
                for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
                    c = x0*y1 - x1*y0; a += c; cx += (x0+x1)*c; cy += (y0+y1)*c
                if abs(a) > abs(best[0]): best = (a, (cx/(3*a), cy/(3*a)))
    ab = FIPS[g['id']]
    res[ab] = {'name': g['properties']['name'], 'd': ''.join(d), 'cx': round(best[1][0], 1), 'cy': round(best[1][1], 1)}
json.dump(res, open(out, 'w'), separators=(',', ':'))
print(len(res), sum(len(v['d']) for v in res.values()))
