"""美術館展覽風格投影片：AI＝像素馬賽克（朱紅），人類＝筆觸（墨藍）。"""
import os, sys
OUT, FONTCSS = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

INK, RED, TEXT, MUTED, BG, HAIR, CARD = "#1D2B44", "#C8452D", "#1F2328", "#6E6A63", "#FAF8F4", "#DCD6CC", "#FFFFFF"
N = 6
SERIF = "'Noto Serif TC', serif"
SANS = "'Noto Sans TC', 'WenQuanYi Zen Hei', sans-serif"
GRAIN = ("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>"
         "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/>"
         "<feColorMatrix values='0 0 0 0 0.3 0 0 0 0 0.25 0 0 0 0 0.2 0 0 0 .05 0'/></filter>"
         "<rect width='100%' height='100%' filter='url(%23n)'/></svg>")

CSS = f"""
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1920px;height:1080px;background:{BG} url("{GRAIN}");font-family:{SANS};color:{TEXT};position:relative;overflow:hidden}}
.kick{{position:absolute;left:110px;top:66px;font-family:{SANS};font-weight:700;font-size:22px;letter-spacing:6px;color:{RED}}}
.kick span{{color:{MUTED};letter-spacing:4px;font-weight:500;margin-left:14px}}
h1{{position:absolute;left:106px;top:100px;font-family:{SERIF};font-weight:900;font-size:66px;color:{INK};letter-spacing:1px;white-space:nowrap}}
.seal{{position:absolute;right:80px;top:66px;font-family:{SERIF};font-weight:900;font-size:26px;padding:10px 18px;border-radius:6px;transform:rotate(-3deg)}}
.s-f{{background:{RED};color:#fff;box-shadow:0 2px 0 rgba(0,0,0,.08)}}
.s-e{{border:3px solid {RED};color:{RED};background:rgba(255,255,255,.6)}}
.s-s{{border:3px dashed {MUTED};color:{MUTED};background:rgba(255,255,255,.6)}}
.foot{{position:absolute;left:110px;right:80px;bottom:30px;padding-top:14px;border-top:1px solid {HAIR};display:flex;justify-content:space-between;align-items:flex-end;gap:40px;font-size:21px;color:{MUTED};line-height:1.5}}
.foot b{{color:{RED};font-weight:700}}
.frame{{position:absolute;background:{CARD};border:2px solid {INK};padding:12px}}
.frame>.in{{border:1px solid {HAIR};width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}}
.card{{position:absolute;background:{CARD};border-radius:14px;box-shadow:0 1px 2px rgba(29,43,68,.08),0 8px 24px rgba(29,43,68,.07)}}
.serif{{font-family:{SERIF};font-weight:900}}
.muted{{color:{MUTED}}}
.ic{{font-size:22px;color:{MUTED};letter-spacing:1px}}
svg text{{font-family:{SANS}}}
"""
SEAL = {"f": '<div class="seal s-f">【論文發現】</div>',
        "e": '<div class="seal s-e">【作者解釋】</div>',
        "s": '<div class="seal s-s">【示意】</div>'}
ICON = {"f": "■ 論文發現", "e": "▲ 作者解釋", "s": "✎ 示意"}
RATIO = "依原數值繪製，比例僅供示意"
ROMAN = ["", "I", "II", "III", "IV", "V", "VI"]

# 共用 SVG 圖樣：像素填色（AI）
DEFS = f'''<svg width="0" height="0" style="position:absolute"><defs>
<pattern id="px" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="{RED}" opacity=".18"/><rect x="1" y="1" width="12" height="12" fill="{RED}"/></pattern>
<pattern id="pxi" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="{INK}" opacity=".2"/><rect x="1" y="1" width="12" height="12" fill="{INK}"/></pattern>
<marker id="ah" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="{INK}"/></marker>
<marker id="ar" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="{RED}"/></marker>
</defs></svg>'''

def pixel_icon(s=60, color=RED):
    """3x3 像素馬賽克（AI 符號）"""
    op = [1, .35, .75, .55, 1, .3, .85, .45, 1]
    c = s / 3
    r = "".join(f'<rect x="{(i%3)*c+1}" y="{(i//3)*c+1}" width="{c-2}" height="{c-2}" fill="{color}" opacity="{o}"/>' for i, o in enumerate(op))
    return f'<svg width="{s}" height="{s}" viewBox="0 0 {s} {s}">{r}</svg>'

def brush_icon(w=90, h=60, color=INK):
    """兩道筆觸（人類符號）"""
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 90 60">'
            f'<path d="M6 40 C 22 14, 44 12, 60 24 S 82 40, 86 18" fill="none" stroke="{color}" stroke-width="9" stroke-linecap="round"/>'
            f'<path d="M10 52 C 30 40, 52 44, 78 50" fill="none" stroke="{color}" stroke-width="4" stroke-linecap="round" opacity=".55"/></svg>')

def page(n, kicker, title, body, src, tag, notes=()):
    left = "<br>".join(notes)
    return f"""<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://{FONTCSS}"><style>{CSS}</style></head><body>{DEFS}
<div class="kick">EXHIBIT {ROMAN[n]}<span>{kicker}</span></div><h1>{title}</h1>{SEAL[tag]}{body}
<div class="foot"><div>{left}</div><div style="white-space:nowrap">來源｜{src}</div></div></body></html>"""

def abs_(x, y, html, w=None, extra=""):
    ws = f"width:{w}px;" if w else ""
    return f'<div style="position:absolute;left:{x}px;top:{y}px;{ws}{extra}">{html}</div>'

slides = []

# ── I 研究問題 ─────────────────────────────────────────────
b = f'<div class="frame" style="left:110px;top:240px;width:680px;height:340px"><div class="in">'
b += f'<div style="display:flex;align-items:center;gap:18px">{pixel_icon(54)}<span style="font-size:28px" class="muted">TikTok 上的 AI 畫作</span></div>'
b += f'<div class="serif" style="font-size:96px;color:{RED};line-height:1.1;margin-top:14px">10.7B</div>'
b += f'<div style="font-size:30px;margin-top:6px">#aiart 標籤累計觀看次數</div><div class="muted" style="font-size:22px;margin-top:8px">截至 2023/12/15（p.5）</div></div></div>'
b += abs_(790, 330, f'<div class="serif" style="font-size:80px;color:{INK};font-style:italic;text-align:center">vs</div><div style="font-size:30px;text-align:center;margin-top:4px">大眾怎麼看？</div>', 340)
b += f'<div class="frame" style="left:1130px;top:240px;width:710px;height:340px"><div class="in">'
b += f'<div style="display:flex;align-items:center;gap:18px">{brush_icon(80,54)}<span style="font-size:28px" class="muted">2022 年 12 月　全球畫家</span></div>'
b += f'<div class="serif" style="font-size:66px;color:{INK};line-height:1.2;margin-top:18px">反 AI 畫作抵制</div>'
b += f'<div style="font-size:26px;margin-top:12px;letter-spacing:1px">“NO TO AI-GENERATED IMAGES”</div><div class="muted" style="font-size:22px;margin-top:8px">起因：認為 AI 未經同意抄襲（p.1）</div></div></div>'
rq = [("RQ1", "觀眾與 AI 畫作<br>互動多少？"), ("RQ2", "畫得美不美<br>會影響互動？"), ("RQ3", "留言情緒如何？<br>負面原因為何？")]
for i, (k, t) in enumerate(rq):
    x = 110 + i * 590
    b += f'<div class="card" style="left:{x}px;top:650px;width:550px;height:260px;padding:34px 40px">'
    b += f'<div class="serif" style="font-size:52px;color:{RED}">{k}</div><div style="font-size:36px;line-height:1.4;margin-top:10px;font-weight:500">{t}</div></div>'
slides.append(page(1, "研究問題", "TikTok 上 AI 與人類畫作的反應比較", b, "p.1–2（摘要、引言）；p.5", "e"))

# ── II 研究目的 ────────────────────────────────────────────
def node(x, y, w, h, title, sub, col):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#fff" stroke="{col}" stroke-width="2.5"/>'
            f'<rect x="{x+9}" y="{y+9}" width="{w-18}" height="{h-18}" fill="none" stroke="{HAIR}" stroke-width="1"/>'
            f'<text x="{x+w/2}" y="{y+h/2-6}" font-size="38" text-anchor="middle" font-weight="700" fill="{col}" style="font-family:{SERIF}">{title}</text>'
            f'<text x="{x+w/2}" y="{y+h/2+40}" font-size="27" text-anchor="middle" fill="{TEXT}">{sub}</text>')
def hseal(x, y, t, col=RED):
    return (f'<circle cx="{x}" cy="{y}" r="30" fill="{col}"/>'
            f'<text x="{x}" y="{y+11}" font-size="30" text-anchor="middle" fill="#fff" font-weight="900" style="font-family:{SERIF}">{t}</text>')
svg = f'<svg style="position:absolute;left:110px;top:250px" width="1020" height="640" viewBox="0 0 1020 640">'
svg += node(330, 10, 360, 160, "美感品質", "調節變項", RED)
svg += node(10, 290, 340, 180, "創作來源", "0 = AI　1 = 人類", INK)
svg += node(670, 290, 340, 180, "使用者互動度", "讚・留言・分享", INK)
svg += node(670, 520, 340, 110, "留言情緒", "", INK).replace('y="569.0"', 'y="588"')
svg += f'<line x1="355" y1="380" x2="660" y2="380" stroke="{INK}" stroke-width="5" marker-end="url(#ah)"/>'
svg += f'<line x1="510" y1="175" x2="510" y2="368" stroke="{RED}" stroke-width="5" stroke-dasharray="14 10" marker-end="url(#ar)"/>'
svg += hseal(430, 440, "H1", INK) + hseal(575, 270, "H2") + hseal(610, 575, "H3", INK)
svg += '</svg>'
b = svg
b += abs_(1210, 250, f'<div class="ic">{ICON["e"]}</div><div style="font-size:30px;margin-top:6px" class="muted">以人類畫作為比較基準</div>', 640)
hyp = [("H1", "人類畫作互動較多", INK), ("H2", "美感會改變來源效果", RED), ("H3", "AI 畫作留言較負面", INK)]
for i, (k, t, c) in enumerate(hyp):
    b += abs_(1210, 360 + i * 110, f'<div style="display:flex;align-items:center;gap:24px"><span class="serif" style="width:64px;height:64px;border-radius:50%;background:{c};color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px">{k}</span><span style="font-size:38px;font-weight:500">{t}</span></div>', 640)
b += f'<div class="card" style="left:1210px;top:710px;width:630px;padding:22px 28px;font-size:26px;line-height:1.55"><b style="color:{RED}">調節變項</b>：會不會讓「來源 → 互動」的差距變大或變小</div>'
slides.append(page(2, "研究目的", "檢驗三個假設", b, "p.3（假設）；表 1（p.7）", "s",
                   ["<b>【註記】</b>H2 調節方向：p.3 與 p.8 不一致"]))

# ── III 資料 ───────────────────────────────────────────────
steps = [("搜尋標籤爬取", "至 2023/11/15", 2667, 1729),
         ("排除低曝光與無關", "<1 萬觀看、<5 則留言", 778, 935),
         ("去重複與美感篩選", "同作者 ≤5 件；美感 4.5–6.5", 207, 210)]
MW = 480
svg = f'<svg style="position:absolute;left:110px;top:240px" width="1730" height="500" viewBox="0 0 1730 500">'
svg += f'<g transform="translate(470,0)">{pixel_icon(40)}</g>'.replace('<svg', '<svg x="0" y="4"')
svg += f'<text x="524" y="36" font-size="30" font-weight="700" fill="{RED}">AI 畫作影片（支）</text>'
svg += f'<g>{brush_icon(56,38)}</g>'.replace('<svg', '<svg x="1220" y="6"')
svg += f'<text x="1286" y="36" font-size="30" font-weight="700" fill="{INK}">人類畫作影片（支）</text>'
for i, (lab, sub, a, h) in enumerate(steps):
    y = 80 + i * 140
    wa, wh = a / 2667 * MW, h / 2667 * MW
    svg += f'<text x="0" y="{y+34}" font-size="30" font-weight="700" fill="{TEXT}">{lab}</text>'
    svg += f'<text x="0" y="{y+74}" font-size="23" fill="{MUTED}">{sub}</text>'
    svg += f'<rect x="470" y="{y}" width="{wa:.0f}" height="86" fill="url(#px)"/>'
    svg += f'<text x="{480+wa:.0f}" y="{y+58}" font-size="46" font-weight="900" fill="{RED}" style="font-family:{SERIF}">{a:,}</text>'
    svg += f'<rect x="1220" y="{y}" width="{wh:.0f}" height="86" rx="12" fill="{INK}"/>'
    svg += f'<text x="{1232+wh:.0f}" y="{y+58}" font-size="46" font-weight="900" fill="{INK}" style="font-family:{SERIF}">{h:,}</text>'
    if i < 2:
        svg += f'<text x="440" y="{y+122}" font-size="26" fill="{HAIR}">▼</text>'
svg += '</svg>'
b = svg
b += f'<div class="card" style="left:110px;top:770px;width:820px;height:150px;padding:26px 34px"><div class="muted" style="font-size:24px">影片格式</div><div style="font-size:36px;font-weight:700;margin-top:6px">只取圖文影片：只有圖與字</div></div>'
b += f'<div class="card" style="left:960px;top:770px;width:880px;height:150px;padding:26px 34px"><div class="muted" style="font-size:24px">有效留言（則）</div><div style="font-size:36px;font-weight:700;margin-top:6px">AI <span class="serif" style="color:{RED}">42,199</span>　／　人類 <span class="serif" style="color:{INK}">29,763</span></div></div>'
slides.append(page(3, "設計與資料", "資料：AI 畫作 207 支、人類畫作 210 支影片", b, "p.5–8；圖 2、圖 5", "f",
                   [RATIO, "<b>【註記】</b>人類組有效留言數：p.4（39,763）與 p.8、圖 5（29,763）不一致"]))

# ── IV 方法 ────────────────────────────────────────────────
ic_eng = (f'<svg width="150" height="90" viewBox="0 0 150 90">'
          f'<path d="M25 30 a12 12 0 0 1 20 -8 a12 12 0 0 1 20 8 c0 14 -20 26 -20 26 s-20 -12 -20 -26z" fill="{RED}"/>'
          f'<rect x="72" y="16" width="44" height="32" rx="8" fill="{INK}"/><path d="M82 48 l-4 12 l14 -12z" fill="{INK}"/>'
          f'<path d="M122 60 l18 -14 l-18 -14 v8 c-14 0 -22 8 -24 20 c6 -6 12 -8 24 -8z" fill="{INK}" opacity=".55"/></svg>')
ic_aes = (f'<svg width="150" height="90" viewBox="0 0 150 90"><rect x="20" y="10" width="110" height="70" fill="#fff" stroke="{INK}" stroke-width="4"/>'
          f'<path d="M30 70 l26 -30 l18 18 l14 -12 l32 24z" fill="{INK}" opacity=".7"/><circle cx="100" cy="30" r="8" fill="{RED}"/></svg>')
ic_sen = (f'<svg width="170" height="90" viewBox="0 0 170 90">' + "".join(
          f'<circle cx="{30+i*55}" cy="45" r="24" fill="none" stroke="{c}" stroke-width="4"/><circle cx="{22+i*55}" cy="39" r="3" fill="{c}"/><circle cx="{38+i*55}" cy="39" r="3" fill="{c}"/><path d="{m}" fill="none" stroke="{c}" stroke-width="4" stroke-linecap="round"/>'
          for i, (c, m) in enumerate([(INK, "M20 52 q10 10 20 0"), (MUTED, "M75 55 h20"), (RED, "M130 58 q10 -10 20 0")])) + '</svg>')
cols = [("①", "互動度", "每次觀看帶來多少互動", ic_eng, "（讚＋留言＋分享）<br>÷ 觀看 × 100%", "t 檢定比較兩組"),
        ("②", "美感品質", "AI 模型替每張畫打分", ic_aes, "LAION-Aesthetics V2<br>放入迴歸模型", "看是否改變來源差距"),
        ("③", "留言情緒", "每則留言判為正中負", ic_sen, "正 1／中 0／負 −1<br>再取平均", "Wilcoxon 檢定比較")]
b = ""
for i, (num, h, plain, ic, how, test) in enumerate(cols):
    x = 110 + i * 590
    b += f'<div class="card" style="left:{x}px;top:240px;width:550px;height:580px;padding:36px 40px;display:flex;flex-direction:column">'
    b += f'<div style="display:flex;justify-content:space-between;align-items:flex-start"><span class="serif" style="font-size:64px;color:{RED};line-height:1">{num}</span>{ic}</div>'
    b += f'<div class="serif" style="font-size:44px;color:{INK};margin-top:18px">{h}</div>'
    b += f'<div style="font-size:28px;color:{MUTED};margin-top:6px">{plain}</div>'
    b += f'<div style="margin-top:28px;padding:22px 0;border-top:1px solid {HAIR};border-bottom:1px solid {HAIR};font-size:30px;line-height:1.55">{how}</div>'
    b += f'<div style="margin-top:auto;font-size:30px;font-weight:700;color:{RED}">→ {test}</div></div>'
b += abs_(110, 860, f'<div style="font-size:30px">另將 <b class="serif" style="color:{RED}">19,071</b> 則 AI 畫作負面留言，以 NMF 歸納為 <b class="serif" style="color:{RED}">14</b> 個主題 → EXHIBIT VI</div>', 1730)
slides.append(page(4, "方法", "互動度、美感、情緒三條流程", b, "p.6–8；圖 3、圖 5、圖 6", "s"))

# ── V 結果 ─────────────────────────────────────────────────
def pair(x, title, sub, a, h, vmax, fmt, stat):
    H, base = 215, 400
    ha, hh = a / vmax * H, h / vmax * H
    s = f'<div class="card" style="left:{x}px;top:240px;width:560px;height:600px"></div>'
    s += f'<svg style="position:absolute;left:{x}px;top:240px" width="560" height="600" viewBox="0 0 560 600">'
    s += f'<text x="44" y="70" font-size="38" font-weight="900" fill="{INK}" style="font-family:{SERIF}">{title}</text>'
    s += f'<text x="44" y="110" font-size="24" fill="{MUTED}">{sub}</text>'
    s += f'<line x1="44" y1="{base}" x2="516" y2="{base}" stroke="{HAIR}" stroke-width="2"/>'
    s += f'<rect x="110" y="{base-ha:.0f}" width="140" height="{ha:.0f}" fill="url(#px)"/>'
    s += f'<rect x="310" y="{base-hh:.0f}" width="140" height="{hh:.0f}" fill="{INK}"/>'
    s += f'<text x="180" y="{base-ha-16:.0f}" font-size="50" text-anchor="middle" font-weight="900" fill="{RED}" style="font-family:{SERIF}">{fmt(a)}</text>'
    s += f'<text x="380" y="{base-hh-16:.0f}" font-size="50" text-anchor="middle" font-weight="900" fill="{INK}" style="font-family:{SERIF}">{fmt(h)}</text>'
    s += f'<text x="180" y="{base+44}" font-size="30" text-anchor="middle" fill="{TEXT}">AI</text>'
    s += f'<text x="380" y="{base+44}" font-size="30" text-anchor="middle" fill="{TEXT}">人類</text>'
    s += f'<text x="280" y="{base+120}" font-size="27" text-anchor="middle" fill="{MUTED}">{stat}</text></svg>'
    return s
b = pair(110, "互動度（平均）", "每次觀看的互動比例", 0.104, 0.198, 0.21, lambda v: f"{v:.3f}", "t = −15.064，p &lt; .001")
b += pair(700, "留言情緒分（平均）", "−1 最負面 ～ 1 最正面", 0.30, 0.53, 0.56, lambda v: f"{v:.2f}", "W = −36.725，p &lt; .001")
b += f'''<div class="frame" style="left:1290px;top:240px;width:550px;height:600px"><div class="in" style="padding:20px">
<div class="serif" style="font-size:38px;color:{INK}">美感的調節效果</div>
<div class="muted" style="font-size:24px;margin-top:8px">來源 × 美感　交互項</div>
<div class="serif" style="font-size:110px;color:{MUTED};line-height:1.1;margin-top:24px">≈ 0</div>
<div style="font-size:36px;font-weight:700;margin-top:10px">β = −0.007　p = 0.620</div>
<div class="serif" style="font-size:44px;color:{RED};margin-top:22px">不顯著</div></div></div>'''
b += abs_(110, 875, f'<div style="display:flex;justify-content:space-between;font-size:32px;font-weight:700"><span>■ 互動度：人類組較高</span><span>■ 情緒分：人類組較高</span><span>■ 美感調節：未達顯著</span></div>', 1730)
slides.append(page(5, "主要發現", "人類畫作影片的互動度與留言情緒分較高", b, "p.8–9；表 2、表 3、表 4", "f",
                   [RATIO, "<b>【註記】</b>H3 結論：p.9 文字與表 3（p.8）數值不一致"]))

# ── VI 負面主題＋限制 ──────────────────────────────────────
topics = [("超寫實品質", 12.82), ("矛盾反應：先讚後轉負", 12.72), ("否定 AI 是藝術", 11.43),
          ("不符期待", 8.99), ("詭異恐怖", 8.53), ("被視為竊取藝術", 7.65), ("驚駭 AI 超越人類", 6.50)]
svg = f'<svg style="position:absolute;left:110px;top:226px" width="1730" height="510" viewBox="0 0 1730 510">'
svg += f'<text x="0" y="28" font-size="27" fill="{MUTED}">19,071 則 AI 畫作負面留言 → NMF 14 主題，占比前 7</text>'
for i, (t, p) in enumerate(topics):
    y = 56 + i * 64
    w = p / 12.82 * 960
    fill = "url(#px)" if i < 3 else "url(#pxi)"
    col = RED if i < 3 else INK
    svg += f'<text x="500" y="{y+36}" font-size="31" text-anchor="end" font-weight="{700 if i<3 else 500}" fill="{TEXT}">{t}</text>'
    svg += f'<rect x="530" y="{y}" width="{w:.0f}" height="48" fill="{fill}"/>'
    svg += f'<text x="{546+w:.0f}" y="{y+38}" font-size="36" font-weight="900" fill="{col}" style="font-family:{SERIF}">{p:.2f}%</text>'
svg += '</svg>'
b = svg
b += f'''<div class="card" style="left:110px;top:770px;width:1730px;height:150px;padding:22px 36px">
<div class="ic">{ICON["e"]}｜研究限制（作者自述，p.14）</div>
<div style="display:flex;gap:80px;font-size:34px;font-weight:500;margin-top:12px"><span>① 僅 TikTok，用戶偏年輕</span><span>② 推薦演算法可能偏誤</span><span>③ 未探討畫作內容</span></div></div>'''
slides.append(page(6, "主要發現・限制", "AI 畫作負面留言前 7 主題與研究限制", b, "p.8、p.10–11、p.14；表 6、圖 6", "f",
                   [RATIO + "｜占比為各主題在 14 個主題中的比例"]))

for i, s in enumerate(slides, 1):
    open(os.path.join(OUT, f"s{i}.html"), "w").write(s)
print(len(slides))
