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

RATIO = "依原數值繪製，比例僅供示意"
slides = []

# 1 研究問題
b = box(110, 250, 640, 300, f'<div style="font-size:30px;color:{MUTED}">TikTok 上的 AI 畫作</div><div style="font-size:50px;font-weight:bold;color:{NAVY};margin:14px 0">大量流傳</div><div style="font-size:34px">#aiart 累計 <b style="color:{ORANGE}">10.7B</b> 次觀看</div><div style="font-size:24px;color:{MUTED};margin-top:10px">（截至 2023/12/15，p.5）</div>')
b += f'<div style="position:absolute;left:770px;top:350px;width:380px;text-align:center;font-size:72px;color:{ORANGE};font-weight:bold">VS</div>'
b += f'<div style="position:absolute;left:770px;top:450px;width:380px;text-align:center;font-size:30px">大眾怎麼看？</div>'
b += box(1170, 250, 670, 300, f'<div style="font-size:30px;color:{MUTED}">2022 年 12 月 全球畫家</div><div style="font-size:50px;font-weight:bold;color:{ORANGE};margin:14px 0">反 AI 畫作抵制</div><div style="font-size:30px">“NO TO AI-GENERATED IMAGES”</div><div style="font-size:24px;color:{MUTED};margin-top:10px">起因：認為 AI 未經同意抄襲（p.1）</div>', border=ORANGE)
rq = [("RQ1", "觀眾與 AI 畫作互動多少？"), ("RQ2", "畫得美不美會影響互動？"), ("RQ3", "留言情緒與負面原因？")]
for i, (k, t) in enumerate(rq):
    b += box(110 + i * 590, 630, 550, 220, f'<div style="font-size:36px;font-weight:bold;color:{ORANGE}">{k}</div><div style="font-size:36px;margin-top:16px">{t}</div>')
slides.append(page(1, "研究問題：TikTok 上 AI 與人類畫作的反應比較", b, "p.1–2（摘要、引言）；p.5", "e"))

# 2 研究目的：假設模型
svg = f'''<svg style="position:absolute;left:110px;top:270px" width="1000" height="580" viewBox="0 0 1000 580">
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
<rect x="650" y="485" width="330" height="70" rx="14" fill="#fff" stroke="{MUTED}" stroke-width="2"/>
<text x="815" y="531" font-size="30" text-anchor="middle" fill="{INK}">留言情緒　H3</text>
</svg>'''
b = svg
b += f'<div style="position:absolute;left:1200px;top:260px;font-size:30px;color:{MUTED}">{ICON["e"]}：以人類畫作為比較基準</div>'
b += pts(["H1 人類畫作互動較多", "H2 美感會改變來源效果", "H3 AI 畫作留言較負面"], 1200, 360, 660, 56)
b += f'<div style="position:absolute;left:1200px;top:680px;width:640px;font-size:26px;line-height:1.5;color:{MUTED}">調節變項：會不會讓「來源 → 互動」<br>的差距變大或變小</div>'
slides.append(page(2, "研究目的：檢驗三個假設", b, "p.3（假設）；表 1（p.7）", "s",
                   ["<b>【註記】</b>H2 調節方向：p.3 與 p.8 不一致"]))

# 3 資料
steps = [("搜尋標籤爬取<br>（至 2023/11/15）", 2667, 1729),
         ("排除 <1 萬觀看、<5 則<br>留言、與畫作無關", 778, 935),
         ("同作者 ≤5 件；<br>平均美感分 4.5–6.5", 207, 210)]
b = f'<div style="position:absolute;left:560px;top:250px;font-size:32px;font-weight:bold;color:{ORANGE}">AI 畫作影片（支）</div>'
b += f'<div style="position:absolute;left:1260px;top:250px;font-size:32px;font-weight:bold;color:{NAVY}">人類畫作影片（支）</div>'
for i, (lab, a, h) in enumerate(steps):
    y = 310 + i * 140
    wa, wh = round(a / 2667 * 560), round(h / 2667 * 560)
    b += f'<div style="position:absolute;left:110px;top:{y+6}px;width:430px;font-size:28px;line-height:1.35">{lab}</div>'
    b += f'<div style="position:absolute;left:560px;top:{y}px;width:{wa}px;height:84px;background:{ORANGE};border-radius:8px"></div>'
    b += f'<div style="position:absolute;left:{572+wa}px;top:{y+18}px;font-size:40px;font-weight:bold;color:{ORANGE}">{a:,}</div>'
    b += f'<div style="position:absolute;left:1260px;top:{y}px;width:{wh}px;height:84px;background:{NAVY};border-radius:8px"></div>'
    b += f'<div style="position:absolute;left:{1272+wh}px;top:{y+18}px;font-size:40px;font-weight:bold;color:{NAVY}">{h:,}</div>'
b += f'<div style="position:absolute;left:110px;top:760px;width:1730px;height:2px;background:{LINE}"></div>'
b += pts(["只取圖文影片：只有圖與字", "有效留言：AI 42,199／人類 29,763 則"], 110, 790, 1700, 22)
slides.append(page(3, "資料：AI 畫作 207 支、人類畫作 210 支影片", b,
                   "p.5–8；圖 2、圖 5", "f",
                   [RATIO, "<b>【註記】</b>人類組有效留言數：p.4（39,763）與 p.8、圖 5（29,763）不一致"]))

# 4 方法（白話）
cols = [("① 互動度", "每次觀看帶來多少互動", "（讚＋留言＋分享）<br>÷ 觀看 × 100%", "比較：t 檢定"),
        ("② 美感品質", "AI 模型替每張畫打分", "LAION-Aesthetics V2<br>放入迴歸模型", "看：是否改變來源差距"),
        ("③ 留言情緒", "每則留言判正中負", "正 1／中 0／負 −1<br>再取平均", "比較：Wilcoxon 檢定")]
b = ""
for i, (h, plain, how, test) in enumerate(cols):
    x = 110 + i * 590
    b += box(x, 250, 550, 150, f'<div style="font-size:40px;font-weight:bold;color:#fff">{h}</div><div style="font-size:28px;color:#fff;margin-top:10px">{plain}</div>', bg=NAVY)
    b += f'<div style="position:absolute;left:{x+258}px;top:405px;font-size:40px;color:{MUTED}">▼</div>'
    b += box(x, 460, 550, 170, f'<div style="font-size:32px;line-height:1.5">{how}</div>')
    b += f'<div style="position:absolute;left:{x+258}px;top:635px;font-size:40px;color:{MUTED}">▼</div>'
    b += box(x, 690, 550, 100, f'<div style="font-size:32px;font-weight:bold;color:{ORANGE}">{test}</div>', border=ORANGE)
b += f'<div style="position:absolute;left:110px;top:840px;font-size:32px">另將 <b style="color:{ORANGE}">19,071</b> 則 AI 畫作負面留言，以 NMF 歸納為 <b style="color:{ORANGE}">14</b> 個主題 → 第 6 張</div>'
slides.append(page(4, "方法：互動度、美感、情緒三條流程", b, "p.6–8；圖 3、圖 5、圖 6", "s"))

# 5 結果
def pair_svg(x, title, sub, a, h, vmax, fmt, stat):
    H, base = 260, 450
    ha, hh = a / vmax * H, h / vmax * H
    return f'''<svg style="position:absolute;left:{x}px;top:240px" width="560" height="620" viewBox="0 0 560 620">
<text x="280" y="44" font-size="38" text-anchor="middle" font-weight="bold" fill="{NAVY}">{title}</text>
<text x="280" y="88" font-size="26" text-anchor="middle" fill="{MUTED}">{sub}</text>
<line x1="70" y1="{base}" x2="490" y2="{base}" stroke="{MUTED}" stroke-width="2"/>
<rect x="120" y="{base-ha}" width="130" height="{ha}" fill="{ORANGE}" rx="4"/>
<rect x="310" y="{base-hh}" width="130" height="{hh}" fill="{NAVY}" rx="4"/>
<text x="185" y="{base-ha-14}" font-size="44" text-anchor="middle" font-weight="bold" fill="{ORANGE}">{fmt(a)}</text>
<text x="375" y="{base-hh-14}" font-size="44" text-anchor="middle" font-weight="bold" fill="{NAVY}">{fmt(h)}</text>
<text x="185" y="{base+42}" font-size="32" text-anchor="middle" fill="{INK}">AI</text>
<text x="375" y="{base+42}" font-size="32" text-anchor="middle" fill="{INK}">人類</text>
<text x="280" y="{base+100}" font-size="28" text-anchor="middle" fill="{MUTED}">{stat}</text></svg>'''
b = pair_svg(110, "互動度（平均）", "每次觀看的互動比例", 0.104, 0.198, 0.22, lambda v: f"{v:.3f}", "t = −15.064，p &lt; .001")
b += pair_svg(690, "留言情緒分（平均）", "−1 最負面 ～ 1 最正面", 0.30, 0.53, 0.60, lambda v: f"{v:.2f}", "W = −36.725，p &lt; .001")
b += box(1280, 300, 560, 420, f'<div style="font-size:36px;font-weight:bold;color:{NAVY}">美感的調節效果</div><div style="font-size:26px;color:{MUTED};margin-top:10px">來源 × 美感 交互項</div><div style="font-size:42px;font-weight:bold;margin-top:30px">β = −0.007</div><div style="font-size:42px;font-weight:bold">p = 0.620</div><div style="font-size:44px;font-weight:bold;color:{ORANGE};margin-top:24px">不顯著</div>', border=MUTED, dashed=True)
b += f'<div style="position:absolute;left:110px;top:890px;width:1730px;display:flex;justify-content:space-between;font-size:34px;font-weight:bold"><span>● 互動度：人類組較高</span><span>● 情緒分：人類組較高</span><span>● 美感調節：未達顯著</span></div>'
slides.append(page(5, "人類畫作影片的互動度與留言情緒分較高", b,
                   "p.8–9；表 2、表 3、表 4", "f",
                   [RATIO, "<b>【註記】</b>H3 結論：p.9 文字與表 3（p.8）數值不一致"]))

# 6 負面主題 + 限制
topics = [("超寫實品質", 12.82), ("矛盾反應：先讚後轉負", 12.72), ("否定 AI 是藝術", 11.43),
          ("不符期待", 8.99), ("詭異恐怖", 8.53), ("被視為竊取藝術", 7.65), ("驚駭 AI 超越人類", 6.50)]
b = f'<div style="position:absolute;left:110px;top:222px;font-size:28px;color:{MUTED}">19,071 則 AI 畫作負面留言 → NMF 14 主題，占比前 7</div>'
for i, (t, p) in enumerate(topics):
    y = 275 + i * 64
    w = round(p / 12.82 * 900)
    col = ORANGE if i < 3 else NAVY
    b += f'<div style="position:absolute;left:110px;top:{y+6}px;width:500px;font-size:30px;text-align:right">{t}</div>'
    b += f'<div style="position:absolute;left:640px;top:{y}px;width:{w}px;height:48px;background:{col};border-radius:6px"></div>'
    b += f'<div style="position:absolute;left:{655+w}px;top:{y+4}px;font-size:32px;font-weight:bold;color:{col}">{p:.2f}%</div>'
b += f'''<div style="position:absolute;left:110px;top:760px;width:1730px;height:150px;background:#fff;border:2px solid {LINE};border-radius:16px;padding:22px 34px">
<div style="font-size:26px;color:{MUTED};margin-bottom:14px">{ICON["e"]}｜研究限制（作者自述，p.14）</div>
<div style="display:flex;gap:70px;font-size:34px"><span>● 僅 TikTok，用戶偏年輕</span><span>● 推薦演算法可能偏誤</span><span>● 未探討畫作內容</span></div></div>'''
slides.append(page(6, "AI 畫作負面留言前 7 主題與研究限制", b, "p.8、p.10–11、p.14；表 6、圖 6", "f",
                   [RATIO + "｜占比為各主題在 14 個主題中的比例"]))

for i, s in enumerate(slides, 1):
    open(os.path.join(OUT, f"s{i}.html"), "w").write(s)
print(len(slides))
