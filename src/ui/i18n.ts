import type { Lang } from '../engine';
import { loadLang, saveLang } from './storage';

let current: Lang = loadLang();
export const getLang = (): Lang => current;
export function setLang(l: Lang): void {
  current = l;
  saveLang(l);
  document.documentElement.lang = l === 'zh' ? 'zh-TW' : 'en';
}
export const initLang = (): void => { document.documentElement.lang = current === 'zh' ? 'zh-TW' : 'en'; };

type Dict = Record<string, string>;

const zh: Dict = {
  siteName: '十二向度：政治光譜自省',
  siteSub: '12 軸政治觀點自我反思測驗',
  navHome: '首頁',
  navMethod: '計分方法',
  navCredits: '授權與來源',
  skip: '跳到主要內容',
  langToggle: 'English',
  footDisclaimer: '限制聲明',
  footCredits: '授權與來源',
  footLine: '本站為自我反思工具，結果不具診斷或預測意義。',
  heroTitle: '你的政治觀點，落在哪裡？',
  heroLead: '透過 12 個向度、最多 288 道陳述，檢視你對政府、外交、經濟與社會議題的看法，並與 38 種意識形態及歷史人物比較。',
  axesTitle: '12 個向度',
  axesLead: '每個向度有兩端，結果顯示你偏向哪一端的百分比。',
  modesTitle: '選擇測驗版本',
  modeFull: '完整版', modeQuick: '快速版', modeMini: '迷你版',
  modeFullDesc: '最完整、最穩定的結果。',
  modeQuickDesc: '每軸 5 題，適合想先看個大概。',
  modeMiniDesc: '每軸 3 題，最短的體驗，結果波動最大。',
  questions: '題',
  approx: '約',
  minutes: '分鐘',
  start: '開始',
  resumeTitle: '繼續上次的測驗',
  resumeBtn: '繼續上次的測驗',
  resumeInfo: '已作答',
  limitTitle: '限制聲明',
  limitBody: '這是自我反思工具，不是經過驗證的心理測量工具；題目由英文翻譯，原始脈絡為美國政治；快速版與迷你版結果波動較大。',
  limitMore: '詳見計分方法與限制',
  cat_government: '政府體制', cat_foreign: '外交與軍事', cat_economy: '經濟', cat_society: '社會與文化',
  qOf: '第',
  qProgress: '題',
  prev: '上一題',
  restart: '重新開始',
  restartConfirm: '確定要放棄目前進度並重新開始嗎？',
  keyHint: '可使用鍵盤 1–7 作答，← 回上一題。',
  answerGroup: '請選擇你對這項陳述的同意程度',
  progressLabel: '測驗進度',
  badMode: '找不到此測驗版本。',
  backHome: '回到首頁',
  resultError: '無法讀取結果：網址不完整或格式錯誤。',
  resultTitle: '你的結果',
  typeLabel: '你的類型',
  axesResult: '12 軸結果',
  definingTag: '定義性觀點',
  definingNote: '標示 ★ 者為你的定義性觀點（偏向某一端達 58% 以上）。',
  topIdeologies: '最接近的意識形態',
  topFigures: '最接近的人物',
  similarity: '相似度',
  wiki: '延伸閱讀（維基百科）',
  figNote: '人物座標為編輯估計值，僅供示意，並非當事人自評。',
  share: '分享結果',
  shareHint: '此網址本身即可完整重現你的結果（不含任何個人資料）。',
  copy: '複製連結', copied: '已複製', copyFail: '請手動複製上方網址',
  retake: '重新測驗',
  methodLink: '了解計分方法與限制',
  modeNote: '此結果來自 {m}（每軸 {n} 題），波動可能較大。',
  modeFullN: '完整版',
  modeQuickN: '快速版',
  modeMiniN: '迷你版',
  methodTitle: '計分方法與限制聲明',
  creditsTitle: '授權與來源',
};

const en: Dict = {
  siteName: 'Twelve Dimensions: A Political Self-Reflection Quiz',
  siteSub: 'A 12-axis quiz for reflecting on your political views',
  navHome: 'Home',
  navMethod: 'Method',
  navCredits: 'Credits',
  skip: 'Skip to main content',
  langToggle: '中文',
  footDisclaimer: 'Limitations',
  footCredits: 'License & credits',
  footLine: 'A self-reflection tool; results are not diagnostic or predictive.',
  heroTitle: 'Where do your political views fall?',
  heroLead: 'Up to 288 statements across 12 dimensions on government, foreign affairs, economy and society, compared with 38 ideologies and historical figures.',
  axesTitle: 'The 12 dimensions',
  axesLead: 'Each dimension has two poles; your result shows how much you lean toward each.',
  modesTitle: 'Choose a version',
  modeFull: 'Full', modeQuick: 'Quick', modeMini: 'Mini',
  modeFullDesc: 'The most complete and stable result.',
  modeQuickDesc: '5 questions per axis, for a rough picture.',
  modeMiniDesc: '3 questions per axis; shortest, most variable.',
  questions: 'questions',
  approx: '~',
  minutes: 'min',
  start: 'Start',
  resumeTitle: 'Resume your last quiz',
  resumeBtn: 'Resume your last quiz',
  resumeInfo: 'answered',
  limitTitle: 'Limitations',
  limitBody: 'This is a self-reflection tool, not a validated psychometric instrument. Questions are translated from English and rooted in US politics. Quick and Mini results vary more.',
  limitMore: 'See the method and limitations',
  cat_government: 'Government', cat_foreign: 'Foreign & military', cat_economy: 'Economy', cat_society: 'Society & culture',
  qOf: 'Question',
  qProgress: 'of',
  prev: 'Previous',
  restart: 'Restart',
  restartConfirm: 'Discard your progress and start over?',
  keyHint: 'Keys 1–7 answer; left arrow goes back.',
  answerGroup: 'How much do you agree with this statement?',
  progressLabel: 'Quiz progress',
  badMode: 'Unknown quiz version.',
  backHome: 'Back to home',
  resultError: 'Could not read the result: the URL is incomplete or malformed.',
  resultTitle: 'Your result',
  typeLabel: 'Your type',
  axesResult: 'Results on 12 axes',
  definingTag: 'Defining view',
  definingNote: 'Axes marked ★ are your defining views (58%+ toward one pole).',
  topIdeologies: 'Closest ideologies',
  topFigures: 'Closest figures',
  similarity: 'Similarity',
  wiki: 'Read more (Wikipedia)',
  figNote: 'Figure coordinates are editorial estimates, for illustration only.',
  share: 'Share',
  shareHint: 'This URL fully reproduces your result (no personal data).',
  copy: 'Copy link', copied: 'Copied', copyFail: 'Please copy the URL above manually',
  retake: 'Retake',
  methodLink: 'How scoring works, and limitations',
  modeNote: 'This result comes from the {m} version ({n} questions per axis) and may vary more.',
  modeFullN: 'Full',
  modeQuickN: 'Quick',
  modeMiniN: 'Mini',
  methodTitle: 'Method and limitations',
  creditsTitle: 'License and credits',
};

const dicts: Record<Lang, Dict> = { zh, en };

export function t(key: string, params?: Record<string, string | number>): string {
  let s = dicts[current][key] ?? dicts.en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export const pick = (zhText: string | undefined, enText: string | undefined): string =>
  current === 'zh' ? zhText || enText || '' : enText || '';
