import { ANSWER_OPTIONS, DEFINING_THRESHOLD, IDEOLOGY_AXES, MIN_FIGURE_COORDS, MISSING_DIFF, MODE_CONFIG } from '../../engine';
import { axes, figures, ideologies, poleName } from '../data';
import { h, staticHtml } from '../dom';
import { getLang, t } from '../i18n';
import { mountPage } from '../layout';

const lv = (m: 'full' | 'quick' | 'mini') => MODE_CONFIG[m].levels;
const lvText = (m: 'quick' | 'mini') => lv(m)!.join('、');
const mirrorText = (m: 'quick' | 'mini') => lv(m)!.map((l) => 9 - l).sort((a, b) => a - b).join('、');
const perAxis = (m: 'quick' | 'mini') => lv(m)!.length;
const axName = (id: string) => {
  const a = axes.find((x) => x.id === id)!;
  return `${poleName(a.first)} / ${poleName(a.second)}`;
};

function zhHtml(): string {
  const thr = DEFINING_THRESHOLD;
  const rows = ANSWER_OPTIONS.map((o) => `<tr><td>${o.zh}</td><td>${o.value > 0 ? '+' : ''}${o.value}</td></tr>`).join('');
  const labelRows = [
    ['第一端 &gt; 90%', '第 1 級（最強偏第一端）'], ['&gt; 75% 至 90%', '第 2 級'], ['&gt; 60% 至 75%', '第 3 級'],
    ['40% 至 60%', '第 4 級（中間）'], ['25% 至 &lt; 40%', '第 5 級'], ['10% 至 &lt; 25%', '第 6 級'], ['&lt; 10%', '第 7 級（最強偏第二端）'],
  ].map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
  return `
<h2 id="structure">題庫結構</h2>
<p>題庫共 12 軸 × 8 級 × 每級 3 題 ＝ 288 題。每一軸有兩端（第一端與第二端）；等級 1–4 的題目偏向第一端（1 為最強烈、4 為溫和），等級 5–8 偏向第二端（5 為溫和、8 為最強烈）。每題是一句陳述，你以七級量表表達同意程度。</p>

<h2 id="modes">三種版本</h2>
<ul>
<li><b>完整版</b>：全部 288 題，隨機排序，每軸 24 題。</li>
<li><b>快速版</b>：每軸從等級 ${lvText('quick')} 各抽 1 題（每軸 ${perAxis('quick')} 題，共 ${perAxis('quick') * 12} 題）。這組等級源自原版 12axes 快速版的抽題方式（索引 1、2、3、5、7，即等級 2、3、4、6、8）。</li>
<li><b>迷你版</b>：每軸從等級 ${lvText('mini')} 各抽 1 題（每軸 ${perAxis('mini')} 題，共 ${perAxis('mini') * 12} 題）。它是快速版的子集：同一端的強烈＋溫和題、另一端中等題，兼顧兩端與強弱。</li>
</ul>
<h3 id="mirror">鏡像</h3>
<p>快速版與迷你版會隨機挑 6 軸（一半），把等級 <i>l</i> 換成 9−<i>l</i>。例如在被鏡像的軸上，快速版改抽等級 ${mirrorText('quick')}，迷你版改抽等級 ${mirrorText('mini')}。原因是題組本身並不對稱（例如快速版的等級 2、3、4 都偏第一端，只有 6、8 偏第二端），若每軸都用同一組，抽中的題目會系統性偏向同一端；鏡像讓不對稱隨機分散到不同軸上。抽題與鏡像都由隨機種子決定，因此重新整理頁面可還原同一份題目。</p>

<h2 id="answers">作答值與反向計分</h2>
<table><thead><tr><th>選項</th><th>作答值</th></tr></thead><tbody>${rows}</tbody></table>
<p>偏向第一端的題目，作答值直接計入；偏向第二端的題目，作答值反向（乘以 −1）後計入，使「同意」永遠代表傾向該題所屬的那一端。</p>

<h2 id="formula">公式</h2>
<p class="formula">第一端 ＝ 50% ＋ 50% × 總和 ÷ (2 × 題數)</p>
<p>其中總和為該軸所有已作答題目（反向後）作答值之和，題數為該軸已作答題數；第二端 ＝ 100% − 第一端。全部「非常同意」第一端題則為 100%，全部中立為 50%。</p>
<h3>範例：70% / 30%</h3>
<p>某軸共 5 題：3 題平等題你都回答「同意」（各 +1，共 +3）；2 題市場題你回答「有點不同意」（各 −0.5）。市場題屬第二端，反向後各為 +0.5，共 +1。總和 ＝ 3 + 1 ＝ 4，題數 ＝ 5，因此第一端（平等）＝ 50% + 50% × 4 ÷ 10 ＝ <b>70%</b>，第二端（市場）＝ 30%。</p>

<h2 id="labels">七級標籤</h2>
<p>每軸依第一端百分比對應七個描述性標籤（由第一端至第二端）：</p>
<table><thead><tr><th>第一端百分比</th><th>標籤</th></tr></thead><tbody>${labelRows}</tbody></table>

<h2 id="defining">定義性觀點</h2>
<p>某軸偏離 50% 達 ${thr} 個百分點以上（即偏向某一端 ≥ ${50 + thr}%），就算作一項「定義性觀點」，並依偏離程度排序。結果頁以 ★ 標示。</p>
<h3>結果句</h3>
<p>取最強的三項定義性觀點，依其傾向程度加上副詞：≥ 80% 為「強烈」、≥ 63% 為「明確」，其餘為「略為」。若沒有任何定義性觀點，則說明你整體居中。</p>
<h3>類型命名</h3>
<p>取兩條最強的定義性觀點：<b>第二強的形容詞 ＋ 最強的名詞</b>（形容詞與名詞取自各端的命名）。只有一條時只用其名詞；沒有定義性觀點時稱為「中間派」。</p>

<h2 id="ideologies">意識形態配對</h2>
<p>本站收錄 ${ideologies.length} 種意識形態，每種在 4 個軸上有座標：${IDEOLOGY_AXES.map(axName).join('；')}。相似度 ＝ 100 − RMS（你與該意識形態在這 4 軸差距的均方根），取最高的三項。</p>
<p>與原版的差異：原版 12axes 把意識形態的外交座標拿去跟<b>貿易軸</b>（保護主義／全球化）比較，但這個座標的語意其實是「國際主義程度」，因此本站改為與<b>國際主義 vs 民族主義</b>軸比較。</p>

<h2 id="figures">人物配對</h2>
<p>本站收錄 ${figures.length} 位人物，座標涵蓋 12 軸，皆為編輯群依公開文獻所做的<b>估計值</b>，並非當事人自評。配對時使用全部 12 軸：人物在某軸沒有明確立場（空白）時，該軸差距一律記為 ${MISSING_DIFF} 分；人物至少要有 ${MIN_FIGURE_COORDS} 軸有座標才會參與配對。相似度 ＝ 100 − RMS（12 軸差距的均方根），取最高的三位。</p>

<h2 id="url">結果網址編碼</h2>
<p>結果頁網址格式為 <code>result.html?m=版本&amp;r=…</code>，其中 <code>r</code> 是 12 個軸（固定順序）的第一端百分比 ×10，各以 2 位 36 進位字元編碼（共 24 字元）。網址本身即包含完整結果，網站沒有伺服器，不會上傳你的答案；進行中的作答只存在你瀏覽器的 localStorage，完成後即清除。</p>

<h2 id="limits">限制聲明</h2>
<ul>
<li>這是<b>自我反思工具</b>，不是經過驗證的心理測量工具，沒有信度、效度研究，不應用於診斷、篩選或評價任何人。</li>
<li>題目由英文<b>翻譯</b>而來，原始脈絡為<b>美國政治</b>；部分議題與用語在臺灣或其他社會的意義不同，作答時請以你理解的原意為準。</li>
<li>快速版（每軸 ${perAxis('quick')} 題）與迷你版（每軸 ${perAxis('mini')} 題）題數少，結果<b>波動較大</b>，同一個人重做可能得到不同結果；若想要較穩定的結果請使用完整版。</li>
<li>軸的兩端並非價值判斷上的「好」與「壞」；百分比表示傾向，不代表你「是」某種人。</li>
<li>意識形態與人物配對只是座標上的相近程度；人物座標為編輯估計值，可能有誤，且人物立場會隨時間改變。</li>
</ul>`;
}

function enHtml(): string {
  const rows = ANSWER_OPTIONS.map((o) => `<tr><td>${o.en}</td><td>${o.value > 0 ? '+' : ''}${o.value}</td></tr>`).join('');
  return `
<p><i>The full explanation is written in Traditional Chinese; this is a condensed English version.</i></p>
<h2 id="structure">Question bank</h2>
<p>12 axes × 8 levels × 3 questions = 288 statements. Levels 1–4 lean toward the first pole (1 strongest), levels 5–8 toward the second pole (8 strongest).</p>
<h2 id="modes">Modes</h2>
<ul>
<li><b>Full</b>: all 288 questions (24 per axis).</li>
<li><b>Quick</b>: one random question from each of levels ${lvText('quick')} per axis (${perAxis('quick')} per axis, 60 total), derived from the original 12axes short quiz.</li>
<li><b>Mini</b>: one question from each of levels ${lvText('mini')} per axis (${perAxis('mini')} per axis, 36 total), a subset of Quick.</li>
</ul>
<p><b>Mirroring</b>: in Quick and Mini, a random half of the axes (6) swap level <i>l</i> for 9−<i>l</i>, so that the asymmetric question sets do not systematically favour one pole. Selection is seeded, so reloading restores the same quiz.</p>
<h2 id="answers">Answer values</h2>
<table><thead><tr><th>Option</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>
<p>Second-pole statements are reverse-scored (value × −1).</p>
<h2 id="formula">Formula</h2>
<p class="formula">First pole = 50% + 50% × sum ÷ (2 × number of questions)</p>
<p>Example: 3 equality questions answered "Agree" (+1 each) and 2 market questions answered "Somewhat disagree" (−0.5, reversed to +0.5): sum 4, 5 questions → 50 + 50 × 4 ÷ 10 = 70% / 30%.</p>
<h2 id="labels">Labels, defining views, type name</h2>
<p>Seven labels use thresholds on the first-pole %: &gt;90, &gt;75, &gt;60, 40–60, ≥25, ≥10, &lt;10. A defining view is an axis at least ${DEFINING_THRESHOLD} points from 50 (≥ ${50 + DEFINING_THRESHOLD}%). The result sentence uses the top three, with "strongly" (≥80%), "clearly" (≥63%) or "slightly". The type name is the second-strongest view's adjective plus the strongest view's noun; with none, "Centrist".</p>
<h2 id="ideologies">Ideology matching</h2>
<p>${ideologies.length} ideologies are compared on 4 axes (${IDEOLOGY_AXES.map(axName).join('; ')}); similarity = 100 − RMS difference. Unlike the original, which compared the ideologies' diplomatic coordinate with the trade axis, this site compares it with Internationalist vs Nationalist, which is what the coordinate actually measures.</p>
<h2 id="figures">Figure matching</h2>
<p>${figures.length} figures with editorial estimates on 12 axes. Missing axes count as a ${MISSING_DIFF}-point gap; at least ${MIN_FIGURE_COORDS} axes are required; similarity = 100 − RMS.</p>
<h2 id="url">Result URL</h2>
<p><code>result.html?m=mode&amp;r=…</code> where <code>r</code> holds 12 scores ×10 in base 36 (2 chars each). Nothing is sent to a server.</p>
<h2 id="limits">Limitations</h2>
<ul>
<li>A self-reflection tool, not a validated psychometric instrument.</li>
<li>Questions are translated from English and rooted in US politics.</li>
<li>Quick (${perAxis('quick')}/axis) and Mini (${perAxis('mini')}/axis) results vary more.</li>
<li>Figure coordinates are editorial estimates and may be wrong.</li>
</ul>`;
}

export function render(): void {
  mountPage({
    nav: 'method',
    title: () => t('methodTitle'),
    render(main) {
      const wrap = h('div', { class: 'wrap prose' }, h('h1', null, t('methodTitle')));
      wrap.append(staticHtml('div', 'prose-body', getLang() === 'zh' ? zhHtml() : enHtml()));
      main.append(wrap);
      if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    },
  });
}
