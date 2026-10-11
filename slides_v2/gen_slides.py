import os, sys
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

NAVY, ORANGE, INK, MUTED, BG, LINE = "#1F3A5F", "#E07A2E", "#1E2430", "#6B7280", "#F8F7F3", "#D9DCE1"
N = 6

CSS = f"""
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1920px;height:1080px;background:{BG};font-family:'WenQuanYi Zen Hei',sans-serif;color:{INK};position:relative;overflow:hidden}}
.no{{position:absolute;left:110px;top:70px;font-size:30px;color:{ORANGE};font-weight:bold;letter-spacing:2px}}
h1{{position:absolute;left:110px;top:112px;font-size:64px;color:{NAVY};font-weight:bold;white-space:nowrap}}
.tag{{position:absolute;right:80px;top:76px;font-size:26px;padding:7px 18px;border-radius:8px;font-weight:bold}}
.t-f{{background:{NAVY};color:#fff}}
.t-e{{background:#fff;color:{NAVY};border:2px solid {NAVY}}}
.t-s{{background:#fff;color:{MUTED};border:2px dashed {MUTED}}}
.bottom{{position:absolute;left:110px;right:80px;bottom:36px;display:flex;justify-content:space-between;align-items:flex-end;gap:40px;font-size:22px;color:{MUTED};line-height:1.45}}
.note b{{color:{ORANGE}}}
.pt{{font-size:40px;line-height:1.3;display:flex;align-items:center;gap:22px}}
.dot{{width:18px;height:18px;border-radius:50%;background:{ORANGE};flex:none}}
.ic{{font-size:24px;color:{MUTED};margin-bottom:10px}}
svg text{{font-family:'WenQuanYi Zen Hei',sans-serif}}
"""
TAG = {"f": '<div class="tag t-f">【論文發現】</div>',
       "e": '<div class="tag t-e">【作者解釋】</div>',
       "s": '<div class="tag t-s">【示意】</div>'}
# 同頁混合內容時，段落前的小圖示
ICON = {"f": "■ 論文發現", "e": "▲ 作者解釋", "s": "✎ 示意"}

def page(n, title, body, src, tag, notes=()):
    left = "<br>".join(notes)
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="no">{n:02d} / {N:02d}</div><h1>{title}</h1>{TAG[tag]}{body}
<div class="bottom"><div class="note">{left}</div><div style="white-space:nowrap">來源：{src}</div></div></body></html>"""

def pts(items, x, y, w, gap=36):
    rows = "".join(f'<div class="pt" style="margin-bottom:{gap}px"><span class="dot"></span><span>{t}</span></div>' for t in items)
    return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px">{rows}</div>'

def box(x, y, w, h, inner, border=NAVY, bg="#fff", dashed=False):
    st = "dashed" if dashed else "solid"
    return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:{bg};border:3px {st} {border};border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">{inner}</div>'

def icon(k, x, y):
    return f'<div class="ic" style="position:absolute;left:{x}px;top:{y}px">{ICON[k]}</div>'

RATIO = "長條依原數值等比例"
slides = []

# 1 研究問題與假設
svg = f'''<svg style="position:absolute;left:110px;top:300px" width="1000" height="560" viewBox="0 0 1000 560">
<defs><marker id="a" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="{NAVY}"/></marker>
<marker id="b" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="{ORANGE}"/></marker></defs>
<rect x="10" y="270" width="330" height="170" rx="18" fill="#fff" stroke="{NAVY}" stroke-width="3"/>
<text x="175" y="340" font-size="38" text-anchor="middle" font-weight="bold" fill="{NAVY}">創作來源</text>
<text x="175" y="395" font-size="28" text-anchor="middle" fill="{INK}">0 = AI　1 = 人類</text>
<rect x="650" y="270" width="330" height="170" rx="18" fill="#fff" stroke="{NAVY}" stroke-width="3"/>
<text x="815" y="340" font-size="38" text-anchor="middle" font-weight="bold" fill="{NAVY}">使用者互動度</text>
<text x="815" y="395" font-size="28" text-anchor="middle" fill="{INK}">讚・留言・分享</text>
<line x1="345" y1="355" x2="640" y2="355" stroke="{NAVY}" stroke-width="5" marker-end="url(#a)"/>
<text x="420" y="410" font-size="30" text-anchor="middle" fill="{NAVY}">H1</text>
<rect x="330" y="10" width="330" height="150" rx="18" fill="#fff" stroke="{ORANGE}" stroke-width="3"/>
<text x="495" y="75" font-size="38" text-anchor="middle" font-weight="bold" fill="{ORANGE}">美感品質 IAQ</text>
<text x="495" y="125" font-size="28" text-anchor="middle" fill="{INK}">調節變項</text>
<line x1="495" y1="165" x2="495" y2="345" stroke="{ORANGE}" stroke-width="5" stroke-dasharray="14 10" marker-end="url(#b)"/>
<text x="520" y="260" font-size="30" fill="{ORANGE}">H2</text>
<rect x="650" y="475" width="330" height="70" rx="14" fill="#fff" stroke="{MUTED}" stroke-width="2"/>
<text x="815" y="521" font-size="30" text-anchor="middle" fill="{INK}">留言情緒　H3</text>
</svg>'''
b = icon("s", 110, 250) + svg
b += f'<div style="position:absolute;left:1200px;top:250px;font-size:30px;color:{MUTED}">以人類畫作為基準比較</div>'
b += pts(["RQ1 AI 畫作的互動程度？", "RQ2 美感品質是否影響互動？", "RQ3 留言情緒與負面原因？"], 1200, 340, 660, 56)
b += f'<div style="position:absolute;left:1200px;top:640px;width:610px;font-size:28px;line-height:1.5;color:{INK};background:#fff;border:2px solid {LINE};border-radius:14px;padding:18px 24px">背景：2022 年 12 月畫家<br>發起反 AI 畫作抵制（p.1）</div>'
slides.append(page(1, "研究問題：AI 與人類畫作的互動及留言比較", b,
                   "p.1–3（引言、假設）；表 1（p.7）", "e",
                   ["<b>【註記】</b>H2 調節方向：p.3（負向）與 p.8（正向）不一致"]))

# 2 資料
steps = [("搜尋標籤爬取<br>（至 2023/11/15）", 2667, 1729),
         ("排除 <1 萬觀看、<5 則<br>留言、與畫作無關", 778, 935),
         ("同作者 ≤5 件；<br>美感分 4.5–6.5", 207, 210)]
b = f'<div style="position:absolute;left:560px;top:250px;font-size:32px;font-weight:bold;color:{ORANGE}">AI 畫作影片</div>'
b += f'<div style="position:absolute;left:1260px;top:250px;font-size:32px;font-weight:bold;color:{NAVY}">人類畫作影片</div>'
for i, (lab, a, h) in enumerate(steps):
    y = 310 + i * 140
    wa, wh = round(a / 2667 * 560), round(h / 2667 * 560)
    b += f'<div style="position:absolute;left:110px;top:{y+6}px;width:430px;font-size:28px;line-height:1.35">{lab}</div>'
    b += f'<div style="position:absolute;left:560px;top:{y}px;width:{wa}px;height:84px;background:{ORANGE};border-radius:8px"></div>'
    b += f'<div style="position:absolute;left:{572+wa}px;top:{y+18}px;font-size:40px;font-weight:bold;color:{ORANGE}">{a:,}</div>'
    b += f'<div style="position:absolute;left:1260px;top:{y}px;width:{wh}px;height:84px;background:{NAVY};border-radius:8px"></div>'
    b += f'<div style="position:absolute;left:{1272+wh}px;top:{y+18}px;font-size:40px;font-weight:bold;color:{NAVY}">{h:,}</div>'
b += f'<div style="position:absolute;left:110px;top:760px;width:1730px;height:2px;background:{LINE}"></div>'
b += pts(["平台：TikTok 圖文影片", "有效留言：AI 42,199／人類 29,763 則"], 110, 790, 1700, 22)
slides.append(page(2, "資料：AI 畫作 207 支、人類畫作 210 支影片", b,
                   "p.5–8；圖 2、圖 5", "f",
                   [RATIO, "<b>【註記】</b>人類組留言數：p.8 與圖 5 為 29,763，p.4 為 39,763，兩處不一致"]))

# 3 方法
cols = [("RQ1　互動度", ["（讚＋留言＋分享）", "÷ 觀看 × 100%"], "獨立樣本 t 檢定"),
        ("RQ2　美感品質", ["LAION-Aesthetics V2", "為每張畫評分"], "OLS 迴歸（含交互項）"),
        ("RQ3　留言情緒", ["情緒模型分類", "正 1／中 0／負 −1"], "Wilcoxon 檢定")]
b = ""
for i, (h, mid, test) in enumerate(cols):
    x = 110 + i * 580
    b += box(x, 260, 540, 110, f'<div style="font-size:38px;font-weight:bold;color:#fff">{h}</div>', bg=NAVY)
    b += f'<div style="position:absolute;left:{x+255}px;top:375px;font-size:44px;color:{MUTED}">▼</div>'
    b += box(x, 435, 540, 170, "".join(f'<div style="font-size:34px;margin:4px 0">{m}</div>' for m in mid))
    b += f'<div style="position:absolute;left:{x+255}px;top:610px;font-size:44px;color:{MUTED}">▼</div>'
    b += box(x, 670, 540, 110, f'<div style="font-size:36px;font-weight:bold;color:{ORANGE}">{test}</div>', border=ORANGE)
b += f'<div style="position:absolute;left:110px;top:830px;font-size:32px">另將 <b style="color:{ORANGE}">19,071</b> 則 AI 畫作負面留言以 NMF 歸納為 <b style="color:{ORANGE}">14</b> 個主題 → 見第 5 張</div>'
slides.append(page(3, "方法：三條分析流程", b, "p.6–8；圖 3、圖 5、圖 6", "s"))

# 4 量化結果
def pair_svg(x, title, a, h, vmax, fmt, stat):
    H, base = 300, 470
    ha, hh = a / vmax * H, h / vmax * H
    return f'''<svg style="position:absolute;left:{x}px;top:250px" width="540" height="600" viewBox="0 0 540 600">
<text x="270" y="50" font-size="38" text-anchor="middle" font-weight="bold" fill="{NAVY}">{title}</text>
<line x1="60" y1="{base}" x2="480" y2="{base}" stroke="{MUTED}" stroke-width="2"/>
<rect x="110" y="{base-ha}" width="130" height="{ha}" fill="{ORANGE}" rx="4"/>
<rect x="300" y="{base-hh}" width="130" height="{hh}" fill="{NAVY}" rx="4"/>
<text x="175" y="{base-ha-14}" font-size="40" text-anchor="middle" font-weight="bold" fill="{ORANGE}">{fmt(a)}</text>
<text x="365" y="{base-hh-14}" font-size="40" text-anchor="middle" font-weight="bold" fill="{NAVY}">{fmt(h)}</text>
<text x="175" y="{base+42}" font-size="32" text-anchor="middle" fill="{INK}">AI</text>
<text x="365" y="{base+42}" font-size="32" text-anchor="middle" fill="{INK}">人類</text>
<text x="270" y="{base+100}" font-size="28" text-anchor="middle" fill="{MUTED}">{stat}</text></svg>'''
b = pair_svg(110, "互動度（平均）", 0.104, 0.198, 0.22, lambda v: f"{v:.3f}", "t = −15.064，p &lt; .001")
b += pair_svg(690, "留言情緒分（平均）", 0.30, 0.53, 0.60, lambda v: f"{v:.2f}", "W = −36.725，p &lt; .001")
b += box(1270, 300, 570, 410, f'<div style="font-size:38px;font-weight:bold;color:{NAVY}">來源 × 美感 交互項</div><div style="font-size:40px;font-weight:bold;margin-top:36px">β = −0.007</div><div style="font-size:40px;font-weight:bold">p = 0.620</div><div style="font-size:44px;font-weight:bold;color:{ORANGE};margin-top:26px">不顯著</div>', border=MUTED, dashed=True)
b += f'<div style="position:absolute;left:110px;top:885px;width:1730px;display:flex;justify-content:space-between;font-size:34px;font-weight:bold"><span>● 互動度：人類組較高</span><span>● 情緒分：人類組較高</span><span>● 美感調節：未達顯著</span></div>'
slides.append(page(4, "人類畫作影片的互動度與留言情緒分較高", b,
                   "p.8–9；表 2、表 3、表 4", "f",
                   [RATIO, "<b>【註記】</b>H3 結論：p.9 文字（拒絕 H3）與表 3 數值方向不一致"]))

# 5 七個主題
topics = [("超寫實品質", 12.82), ("矛盾反應：先讚後轉負", 12.72), ("否定 AI 是藝術", 11.43),
          ("不符期待", 8.99), ("詭異恐怖", 8.53), ("被視為竊取藝術", 7.65), ("驚駭 AI 超越人類", 6.50)]
b = f'<div style="position:absolute;left:110px;top:225px;font-size:30px;color:{MUTED}">19,071 則 AI 畫作負面留言 → NMF 14 主題，取占比前 7</div>'
for i, (t, p) in enumerate(topics):
    y = 290 + i * 90
    w = round(p / 12.82 * 980)
    col = ORANGE if i < 3 else NAVY
    b += f'<div style="position:absolute;left:110px;top:{y+12}px;width:500px;font-size:34px;text-align:right">{t}</div>'
    b += f'<div style="position:absolute;left:640px;top:{y}px;width:{w}px;height:64px;background:{col};border-radius:6px"></div>'
    b += f'<div style="position:absolute;left:{655+w}px;top:{y+10}px;font-size:36px;font-weight:bold;color:{col}">{p:.2f}%</div>'
slides.append(page(5, "AI 畫作負面留言的 7 個主要主題", b, "p.8、p.10–11；表 6、圖 6", "f",
                   [RATIO + "｜占比為各主題在 14 個主題中的比例"]))

# 6 限制與啟示
b = box(110, 260, 830, 560, f'<div style="font-size:44px;font-weight:bold;color:{NAVY};margin-bottom:46px">研究限制（作者自述）</div><div style="font-size:38px;margin:16px 0">僅 TikTok，用戶偏年輕</div><div style="font-size:38px;margin:16px 0">推薦演算法可能偏誤</div><div style="font-size:26px;color:{MUTED};margin-top:24px">p.14</div>')
b += box(1010, 260, 830, 560, f'<div style="font-size:44px;font-weight:bold;color:{ORANGE};margin-bottom:46px">實務啟示（作者建議）</div><div style="font-size:38px;margin:16px 0">少推 AI 畫作，鼓勵畫家上傳</div><div style="font-size:26px;color:{MUTED};margin-top:24px">p.13</div>', border=ORANGE)
slides.append(page(6, "研究限制與實務啟示", b, "p.13–14（設計意涵、限制）", "e"))

for i, s in enumerate(slides, 1):
    open(os.path.join(OUT, f"s{i}.html"), "w").write(s)
print(len(slides))
