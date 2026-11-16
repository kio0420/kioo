import type { Axis, Lang, PoleInfo, Scores } from './types';

export const DEFINING_THRESHOLD = 8;

export type Intensity = 'strong' | 'clear' | 'lean';

export interface DefiningView {
  axis: Axis;
  pole: 'first' | 'second';
  poleInfo: PoleInfo;
  score: number;
  pct: number;
  strength: number;
}

export interface ResultSentence {
  text: string;
  parts: { view: DefiningView; intensity: Intensity }[];
}

const score = (s: Scores, a: Axis) => s[a.id] ?? 50;

export function intensityOf(pct: number): Intensity {
  return pct >= 80 ? 'strong' : pct >= 63 ? 'clear' : 'lean';
}

function view(a: Axis, s: number): DefiningView {
  const first = s >= 50;
  return {
    axis: a,
    pole: first ? 'first' : 'second',
    poleInfo: first ? a.first : a.second,
    score: s,
    pct: Math.max(s, 100 - s),
    strength: Math.abs(s - 50),
  };
}

export function definingViews(scores: Scores, axes: readonly Axis[]): DefiningView[] {
  return axes
    .map((a) => view(a, score(scores, a)))
    .filter((v) => v.strength >= DEFINING_THRESHOLD)
    .sort((x, y) => y.strength - x.strength || x.axis.index - y.axis.index);
}

const poleName = (p: PoleInfo, lang: Lang) => (lang === 'zh' ? p.name_zh || p.name_en : p.name_en);
const adj = (p: PoleInfo, lang: Lang) =>
  lang === 'zh' ? p.adj_zh || p.name_zh || p.name_en : p.adj_en || p.name_en;
const noun = (p: PoleInfo, lang: Lang) =>
  lang === 'zh' ? p.noun_zh || p.name_zh || p.name_en : p.noun_en || p.name_en;

const ADV = {
  zh: { strong: '強烈', clear: '明確', lean: '略為' },
  en: { strong: 'strongly', clear: 'clearly', lean: 'slightly' },
} as const;

export function resultSentence(scores: Scores, axes: readonly Axis[], lang: Lang): ResultSentence {
  const top = definingViews(scores, axes).slice(0, 3);
  if (top.length === 0) {
    return {
      text: lang === 'zh' ? '你的觀點整體居中，沒有特別突出的傾向。' : 'Your views are broadly centrist, with no strongly defining leaning.',
      parts: [],
    };
  }
  const parts = top.map((v) => ({ view: v, intensity: intensityOf(v.pct) }));
  const bits = parts.map((p) => `${ADV[lang][p.intensity]}${lang === 'zh' ? '偏向' : ' towards '}${poleName(p.view.poleInfo, lang)}`);
  let text: string;
  if (lang === 'zh') {
    const body = bits.length === 1 ? bits[0] : bits.slice(0, -1).join('、') + '，並' + bits[bits.length - 1];
    text = `你的觀點${body}。`;
  } else {
    const list = bits.length === 1 ? bits[0] : bits.slice(0, -1).join(', ') + ', and ' + bits[bits.length - 1];
    text = `Your views lean ${list}.`;
  }
  return { text, parts };
}

export function typeName(scores: Scores, axes: readonly Axis[], lang: Lang): string {
  const d = definingViews(scores, axes);
  if (d.length === 0) return lang === 'zh' ? '中間派' : 'Centrist';
  const n = noun(d[0].poleInfo, lang);
  if (d.length === 1) return n;
  const a = adj(d[1].poleInfo, lang);
  return lang === 'zh' ? a + n : `${a} ${n}`;
}
