import os, sys
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

NAVY, ORANGE, INK, MUTED, BG, LINE = "#1F3A5F", "#E07A2E", "#1E2430", "#6B7280", "#F8F7F3", "#D9DCE1"

CSS = f"""
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1920px;height:1080px;background:{BG};font-family:'WenQuanYi Zen Hei',sans-serif;color:{INK};position:relative;overflow:hidden}}
.bar{{position:absolute;left:0;top:0;width:1920px;height:14px;background:{NAVY}}}
.no{{position:absolute;left:110px;top:70px;font-size:30px;color:{ORANGE};font-weight:bold;letter-spacing:2px}}
h1{{position:absolute;left:110px;top:112px;font-size:70px;color:{NAVY};font-weight:bold}}
.src{{position:absolute;right:80px;bottom:40px;font-size:22px;color:{MUTED}}}
.foot{{position:absolute;left:110px;bottom:40px;font-size:22px;color:{MUTED}}}
.legend{{position:absolute;right:80px;top:82px;display:flex;gap:14px}}
.tag{{display:inline-block;font-size:22px;padding:5px 14px;border-radius:6px;font-weight:bold;white-space:nowrap}}
.t-f{{background:{NAVY};color:#fff}}
.t-e{{background:#fff;color:{NAVY};border:2px solid {NAVY}}}
.t-s{{background:#fff;color:{MUTED};border:2px dashed {MUTED}}}
.pt{{font-size:40px;line-height:1.3;display:flex;align-items:center;gap:22px}}
.dot{{width:18px;height:18px;border-radius:50%;background:{ORANGE};flex:none}}
svg text{{font-family:'WenQuanYi Zen Hei',sans-serif}}
"""
TAG = {"f": '<span class="tag t-f">【論文發現】</span>',
       "e": '<span class="tag t-e">【作者解釋】</span>',
       "s": '<span class="tag t-s">【示意】</span>'}

def page(n, title, body, src, foot="", tags="fes"):
    legend = "".join(TAG[t] for t in tags)
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="bar"></div><div class="no">{n:02d} / 07</div><h1>{title}</h1>
<div class="legend">{legend}</div>{body}
<div class="foot">{foot}</div><div class="src">來源：{src}</div></body></html>"""

def pts(items, x, y, w, gap=36):
    rows = "".join(f'<div class="pt" style="margin-bottom:{gap}px"><span class="dot"></span><span>{t}</span></div>' for t in items)
    return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px">{rows}</div>'

def box(x, y, w, h, inner, border=NAVY, bg="#fff", dashed=False, extra=""):
    st = "dashed" if dashed else "solid"
    return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:{bg};border:3px {st} {border};border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;{extra}">{inner}</div>'

slides = []

# 1 研究問題
b = box(110, 270, 640, 300, f'<div style="font-size:30px;color:{MUTED}">TikTok 上的 AI 畫作</div><div style="font-size:50px;font-weight:bold;color:{NAVY};margin:14px 0">爆紅</div><div style="font-size:34px">#aiart 標籤 <b style="color:{ORANGE}">107 億</b> 次觀看</div><div style="font-size:24px;color:{MUTED};margin-top:10px">（截至 2023/12/15）</div>')
b += f'<div style="position:absolute;left:770px;top:370px;width:380px;text-align:center;font-size:72px;color:{ORANGE};font-weight:bold">VS</div>'
b += f'<div style="position:absolute;left:790px;top:470px;width:340px;text-align:center;font-size:30px;color:{INK}">大眾觀感被忽略？</div>'
b += box(1170, 270, 640, 300, f'<div style="font-size:30px;color:{MUTED}">2022 年 12 月 全球畫家</div><div style="font-size:50px;font-weight:bold;color:{ORANGE};margin:14px 0">反 AI 抵制</div><div style="font-size:30px">“NO TO AI-GENERATED IMAGES”</div><div style="font-size:24px;color:{MUTED};margin-top:10px">起因：認為 AI 未經同意抄襲</div>', border=ORANGE)
b += f'<div style="position:absolute;left:110px;top:220px">{TAG["e"]}</div>'
rq = [("RQ1", "大眾與 AI 畫作的互動程度？"), ("RQ2", "美感品質是否影響互動？"), ("RQ3", "留言情緒？負面原因為何？")]
for i, (k, t) in enumerate(rq):
    b += box(110 + i * 580, 650, 540, 220, f'<div style="font-size:36px;font-weight:bold;color:{ORANGE}">{k}</div><div style="font-size:36px;margin-top:16px">{t}</div>', bg="#fff")
slides.append(page(1, "研究問題：AI 畫作受歡迎，還是被排斥？", b, "p.1–2（摘要、引言）；p.5", tags="e"))

# 2 目的與假設
svg = f'''<svg style="position:absolute;left:110px;top:250px" width="1000" height="620" viewBox="0 0 1000 620">
<defs><marker id="a" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="{NAVY}"/></marker>
<marker id="b" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="{ORANGE}"/></marker></defs>
<rect x="10" y="330" width="330" height="170" rx="18" fill="#fff" stroke="{NAVY}" stroke-width="3"/>
<text x="175" y="400" font-size="38" text-anchor="middle" font-weight="bold" fill="{NAVY}">創作來源</text>
<text x="175" y="455" font-size="28" text-anchor="middle" fill="{INK}">0 = AI　1 = 人類</text>
<rect x="650" y="330" width="330" height="170" rx="18" fill="#fff" stroke="{NAVY}" stroke-width="3"/>
<text x="815" y="400" font-size="38" text-anchor="middle" font-weight="bold" fill="{NAVY}">使用者互動度</text>
<text x="815" y="455" font-size="28" text-anchor="middle" fill="{INK}">讚・留言・分享</text>
<line x1="345" y1="415" x2="640" y2="415" stroke="{NAVY}" stroke-width="5" marker-end="url(#a)"/>
<text x="420" y="470" font-size="30" text-anchor="middle" fill="{NAVY}">H1</text>
<rect x="330" y="60" width="330" height="150" rx="18" fill="#fff" stroke="{ORANGE}" stroke-width="3"/>
<text x="495" y="125" font-size="38" text-anchor="middle" font-weight="bold" fill="{ORANGE}">美感品質 IAQ</text>
<text x="495" y="175" font-size="28" text-anchor="middle" fill="{INK}">調節變項</text>
<line x1="495" y1="215" x2="495" y2="405" stroke="{ORANGE}" stroke-width="5" stroke-dasharray="14 10" marker-end="url(#b)"/>
<text x="520" y="310" font-size="30" fill="{ORANGE}">H2</text>
<rect x="650" y="540" width="330" height="70" rx="14" fill="#fff" stroke="{MUTED}" stroke-width="2"/>
<text x="815" y="586" font-size="30" text-anchor="middle" fill="{INK}">留言情緒　H3</text>
</svg>'''
b = svg + f'<div style="position:absolute;left:110px;top:225px">{TAG["s"]}</div>'
b += f'<div style="position:absolute;left:1180px;top:225px">{TAG["e"]}</div>'
b += f'<div style="position:absolute;left:1180px;top:290px;font-size:32px;color:{MUTED}">以人類畫作為基準比較</div>'
b += pts(["H1 人類畫作互動較多", "H2 美感會調節來源效果", "H3 AI 畫作留言較負面"], 1180, 380, 700, 56)
slides.append(page(2, "研究目的與三個假設", b, "p.2–3（假設）；表 1（p.7）", tags="es"))

# 3 設計與資料：比例漏斗
MAXW = 560
steps = [("搜尋標籤爬取（至 2023/11/15）", 2667, 1729),
         ("排除 <1 萬觀看、<5 則留言、非畫作", 778, 935),
         ("同作者 ≤5 件；美感分 4.5–6.5", 207, 210)]
b = f'<div style="position:absolute;left:110px;top:225px">{TAG["f"]}</div>'
b += f'<div style="position:absolute;left:560px;top:240px;width:{MAXW}px;font-size:32px;font-weight:bold;color:{ORANGE}">AI 畫作影片</div>'
b += f'<div style="position:absolute;left:1260px;top:240px;width:{MAXW}px;font-size:32px;font-weight:bold;color:{NAVY}">人類畫作影片</div>'
for i, (lab, a, h) in enumerate(steps):
    y = 300 + i * 140
    wa, wh = round(a / 2667 * 560), round(h / 2667 * 560)
    b += f'<div style="position:absolute;left:110px;top:{y+14}px;width:420px;font-size:28px;line-height:1.3;color:{INK}">{lab}</div>'
    b += f'<div style="position:absolute;left:560px;top:{y}px;width:{wa}px;height:84px;background:{ORANGE};border-radius:8px"></div>'
    b += f'<div style="position:absolute;left:{570+wa}px;top:{y+18}px;font-size:40px;font-weight:bold;color:{ORANGE}">{a:,}</div>'
    b += f'<div style="position:absolute;left:1260px;top:{y}px;width:{wh}px;height:84px;background:{NAVY};border-radius:8px"></div>'
    b += f'<div style="position:absolute;left:{1270+wh}px;top:{y+18}px;font-size:40px;font-weight:bold;color:{NAVY}">{h:,}</div>'
b += f'<div style="position:absolute;left:110px;top:750px;width:1700px;height:2px;background:{LINE}"></div>'
b += pts(["平台：TikTok 圖文影片（排除旁白干擾）", "有效留言：AI 42,199／人類 29,763 則"], 110, 790, 1700, 26)
slides.append(page(3, "研究設計與資料：層層篩選", b, "p.5–8；圖 2、圖 5",
                   foot="長條長度依原數值等比例｜人類組留言數依 p.8 與圖 5（p.4 誤植為 39,763）", tags="f"))

# 4 核心方法
cols = [("RQ1　互動度", ["（讚＋留言＋分享）", "÷ 觀看 × 100%"], "獨立樣本 t 檢定"),
        ("RQ2　美感品質", ["LAION-Aesthetics V2", "為每張畫評分"], "OLS 迴歸（含交互項）"),
        ("RQ3　留言情緒", ["情緒模型分類", "正 1／中 0／負 −1"], "Wilcoxon 檢定"),]
b = f'<div style="position:absolute;left:110px;top:225px">{TAG["s"]}</div>'
for i, (h, mid, test) in enumerate(cols):
    x = 110 + i * 580
    b += box(x, 290, 540, 110, f'<div style="font-size:38px;font-weight:bold;color:#fff">{h}</div>', bg=NAVY)
    b += f'<div style="position:absolute;left:{x+255}px;top:405px;font-size:44px;color:{MUTED}">▼</div>'
    b += box(x, 465, 540, 170, "".join(f'<div style="font-size:34px;margin:4px 0">{m}</div>' for m in mid))
    b += f'<div style="position:absolute;left:{x+255}px;top:640px;font-size:44px;color:{MUTED}">▼</div>'
    b += box(x, 700, 540, 110, f'<div style="font-size:36px;font-weight:bold;color:{ORANGE}">{test}</div>', border=ORANGE)
b += f'<div style="position:absolute;left:110px;top:850px;font-size:32px;color:{INK}">另將 <b style="color:{ORANGE}">19,071</b> 則 AI 畫作負面留言以 NMF 歸納為 <b style="color:{ORANGE}">14</b> 個主題 → 見第 6 張</div>'
slides.append(page(4, "核心方法：三條分析流程", b, "p.6–8；圖 3、圖 5、圖 6", tags="s"))

# 5 最重要發現
def pair_svg(x, title, a, h, vmax, fmt, stat):
    H = 300
    ha, hh = a / vmax * H, h / vmax * H
    base = 470
    return f'''<svg style="position:absolute;left:{x}px;top:270px" width="540" height="600" viewBox="0 0 540 600">
<text x="270" y="50" font-size="38" text-anchor="middle" font-weight="bold" fill="{NAVY}">{title}</text>
<line x1="60" y1="{base}" x2="480" y2="{base}" stroke="{MUTED}" stroke-width="2"/>
<rect x="110" y="{base-ha}" width="130" height="{ha}" fill="{ORANGE}" rx="4"/>
<rect x="300" y="{base-hh}" width="130" height="{hh}" fill="{NAVY}" rx="4"/>
<text x="175" y="{base-ha-14}" font-size="40" text-anchor="middle" font-weight="bold" fill="{ORANGE}">{fmt(a)}</text>
<text x="365" y="{base-hh-14}" font-size="40" text-anchor="middle" font-weight="bold" fill="{NAVY}">{fmt(h)}</text>
<text x="175" y="{base+42}" font-size="32" text-anchor="middle" fill="{INK}">AI</text>
<text x="365" y="{base+42}" font-size="32" text-anchor="middle" fill="{INK}">人類</text>
<text x="270" y="{base+100}" font-size="28" text-anchor="middle" fill="{MUTED}">{stat}</text></svg>'''
b = f'<div style="position:absolute;left:110px;top:225px">{TAG["f"]}</div>'
b += pair_svg(110, "互動度（平均）", 0.104, 0.198, 0.22, lambda v: f"{v:.3f}", "t = −15.064，p &lt; .001")
b += pair_svg(690, "留言情緒分（平均）", 0.30, 0.53, 0.60, lambda v: f"{v:.2f}", "W = −36.725，p &lt; .001")
b += box(1270, 300, 540, 410, f'<div style="font-size:38px;font-weight:bold;color:{NAVY}">美感的調節效果</div><div style="font-size:30px;margin-top:30px">來源 × 美感</div><div style="font-size:40px;font-weight:bold;margin-top:12px">β = −0.007</div><div style="font-size:40px;font-weight:bold">p = 0.620</div><div style="font-size:44px;font-weight:bold;color:{ORANGE};margin-top:26px">不顯著</div>', border=MUTED, dashed=True)
b += f'<div style="position:absolute;left:110px;top:900px;width:1700px;display:flex;justify-content:space-between;font-size:34px;font-weight:bold;color:{INK}"><span>✔ H1 成立：人類畫作互動較高</span><span>✔ AI 畫作留言較負面</span><span>✘ H2 不成立</span></div>'
slides.append(page(5, "最重要發現：大眾偏好人類畫作", b, "p.8–9；表 2、表 3、表 4",
                   foot="長條高度依原數值等比例｜H3：數據支持，但原文 p.9 寫「拒絕」，疑為筆誤", tags="f"))

# 6 七個負面原因
topics = [("超寫實品質", 12.82), ("矛盾反應：先讚後轉負", 12.72), ("否定 AI 是藝術", 11.43),
          ("不符期待", 8.99), ("詭異恐怖", 8.53), ("被視為竊取藝術", 7.65), ("驚駭 AI 超越人類", 6.50)]
b = f'<div style="position:absolute;left:110px;top:225px">{TAG["f"]}</div>'
b += f'<div style="position:absolute;left:330px;top:228px;font-size:30px;color:{MUTED}">19,071 則 AI 畫作負面留言 → NMF 14 主題，取占比前 7</div>'
for i, (t, p) in enumerate(topics):
    y = 300 + i * 92
    w = round(p / 12.82 * 980)
    col = ORANGE if i < 3 else NAVY
    b += f'<div style="position:absolute;left:110px;top:{y+12}px;width:500px;font-size:34px;text-align:right">{t}</div>'
    b += f'<div style="position:absolute;left:640px;top:{y}px;width:{w}px;height:66px;background:{col};border-radius:6px"></div>'
    b += f'<div style="position:absolute;left:{655+w}px;top:{y+10}px;font-size:36px;font-weight:bold;color:{col}">{p:.2f}%</div>'
slides.append(page(6, "為何負面？七個主要原因", b, "p.8、p.10–11；表 6、圖 6",
                   foot="占比為各主題在 14 個主題中的比例｜長條長度依原數值等比例", tags="f"))

# 7 限制與啟示
b = box(110, 260, 820, 560, f'<div style="font-size:44px;font-weight:bold;color:{NAVY};margin-bottom:46px">研究限制</div><div style="font-size:38px;margin:16px 0">僅 TikTok，用戶偏年輕</div><div style="font-size:38px;margin:16px 0">推薦演算法可能偏誤</div>')
b += box(990, 260, 820, 560, f'<div style="font-size:44px;font-weight:bold;color:{ORANGE};margin-bottom:46px">實務啟示</div><div style="font-size:38px;margin:16px 0">少推 AI 畫作，鼓勵畫家上傳</div><div style="font-size:28px;color:{MUTED};margin-top:30px">（並留意 AI 影片的負面留言）</div>', border=ORANGE)
b += f'<div style="position:absolute;left:130px;top:240px">{TAG["e"]}</div><div style="position:absolute;left:1010px;top:240px">{TAG["e"]}</div>'
b += f'<div style="position:absolute;left:110px;top:870px;font-size:30px;color:{INK}">未來：擴及 Twitter、Facebook、Reddit，並加入問卷與訪談</div>'
slides.append(page(7, "限制與實務啟示", b, "p.13–14（設計意涵、限制）", tags="e"))

for i, s in enumerate(slides, 1):
    open(os.path.join(OUT, f"s{i}.html"), "w").write(s)
print(len(slides))
