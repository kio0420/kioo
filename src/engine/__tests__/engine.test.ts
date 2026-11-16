import { describe, expect, it } from 'vitest';
import {
  buildQuiz, scoreAxes, labelIndex, getLabel, definingViews, resultSentence, typeName,
  matchIdeologies, matchFigures, encodeResult, decodeResult, answerValue, intensityOf,
} from '..';
import type { Figure, Ideology, Question } from '..';
import { AXIS_IDS, axes, mkQuestions, neutral } from './fixtures';

const Q = mkQuestions();
const q = (id: string, axis: string, pole: 'first' | 'second'): Question =>
  ({ id, axis, level: 1, pole, text_en: '', text_zh: '' });

describe('score', () => {
  it('spec example: 70/30', () => {
    const items = [
      q('a', 'equality-markets', 'first'), q('b', 'equality-markets', 'first'), q('c', 'equality-markets', 'first'),
      q('d', 'equality-markets', 'second'), q('e', 'equality-markets', 'second'),
    ];
    const ans = { a: 1, b: 1, c: 1, d: -0.5, e: -0.5 };
    const s = scoreAxes(items, ans);
    expect(s['equality-markets']).toBeCloseTo(70);
    expect(100 - s['equality-markets']).toBeCloseTo(30);
  });
  it('extremes, balanced, unanswered', () => {
    const f = [q('a', 'x', 'first'), q('b', 'x', 'first')];
    const sc = [q('c', 'x', 'second'), q('d', 'x', 'second')];
    expect(scoreAxes(f, { a: 2, b: 2 }).x).toBe(100);
    expect(scoreAxes(sc, { c: 2, d: 2 }).x).toBe(0);
    expect(scoreAxes([f[0], sc[0]], { a: 1, c: 1 }).x).toBe(50);
    expect(scoreAxes(f, {}, ['x', 'y']).x).toBe(50);
    expect(scoreAxes(f, {}, ['x', 'y']).y).toBe(50);
  });
  it('validates answers', () => {
    expect(answerValue(0.5)).toBe(true);
    expect(answerValue(3)).toBe(false);
    expect(answerValue(0.3)).toBe(false);
    expect(answerValue('1')).toBe(false);
  });
});

describe('buildQuiz', () => {
  const perAxis = (items: Question[]) => AXIS_IDS.map((a) => items.filter((i) => i.axis === a));
  it('quick', () => {
    const z = buildQuiz(Q, 'quick', { seed: 1 });
    expect(z.items).toHaveLength(60);
    expect(z.mirroredAxes).toHaveLength(6);
    perAxis(z.items).forEach((list, i) => {
      expect(list).toHaveLength(5);
      const mirrored = z.mirroredAxes.includes(AXIS_IDS[i]);
      const want = [2, 3, 4, 6, 8].map((l) => (mirrored ? 9 - l : l)).sort();
      expect(list.map((x) => x.level).sort()).toEqual(want);
    });
  });
  it('mini', () => {
    const z = buildQuiz(Q, 'mini', { seed: 2 });
    expect(z.items).toHaveLength(36);
    perAxis(z.items).forEach((l) => expect(l).toHaveLength(3));
    expect(z.mirroredAxes).toHaveLength(6);
  });
  it('full', () => {
    const z = buildQuiz(Q, 'full', { seed: 3 });
    expect(z.items).toHaveLength(288);
    expect(new Set(z.items.map((i) => i.id)).size).toBe(288);
    expect(z.mirroredAxes).toHaveLength(0);
  });
  it('seeds', () => {
    const ids = (s: number) => buildQuiz(Q, 'quick', { seed: s }).items.map((i) => i.id);
    expect(ids(5)).toEqual(ids(5));
    expect(ids(5)).not.toEqual(ids(6));
  });
  it('overrides', () => {
    const z = buildQuiz(Q, 'quick', { seed: 1, levelSets: [1, 8], mirrorFraction: 0 });
    expect(z.items).toHaveLength(24);
    expect(z.mirroredAxes).toHaveLength(0);
  });
});

describe('labels', () => {
  it('boundaries', () => {
    const cases: [number, number][] = [[90.1, 0], [90, 1], [75.1, 1], [75, 2], [60.1, 2], [60, 3], [40, 3], [39.9, 4], [25, 4], [24.9, 5], [10, 5], [9.9, 6]];
    for (const [s, i] of cases) expect(labelIndex(s)).toBe(i);
  });
  it('getLabel fallback', () => {
    expect(getLabel(axes[0], 95, 'zh')).toBe('零');
    expect(getLabel(axes[0], 95, 'en')).toBe('L0');
    expect(getLabel({ ...axes[0], labels_zh: ['', '', '', '', '', '', ''] }, 95, 'zh')).toBe('L0');
  });
});

describe('summary', () => {
  const sc = (o: Record<string, number>) => ({ ...neutral(), ...o });
  it('defining threshold', () => {
    expect(definingViews(sc({ 'federal-unitary': 58 }), axes)).toHaveLength(1);
    expect(definingViews(sc({ 'federal-unitary': 57.9 }), axes)).toHaveLength(0);
    expect(definingViews(sc({ 'federal-unitary': 42 }), axes)).toHaveLength(1);
  });
  it('sorting with tie-break', () => {
    const d = definingViews(sc({ 'militarist-pacifist': 70, 'federal-unitary': 30, 'security-freedom': 90 }), axes);
    expect(d.map((v) => v.axis.id)).toEqual(['security-freedom', 'federal-unitary', 'militarist-pacifist']);
  });
  it('intensity', () => {
    expect(intensityOf(80)).toBe('strong');
    expect(intensityOf(79.9)).toBe('clear');
    expect(intensityOf(63)).toBe('clear');
    expect(intensityOf(62.9)).toBe('lean');
  });
  it('sentence', () => {
    const s = sc({ 'federal-unitary': 90, 'democratic-autocratic': 25, 'militarist-pacifist': 60 });
    const r = resultSentence(s, axes, 'zh');
    expect(r.text).toBe('你的觀點強烈偏向甲0、明確偏向乙1，並略為偏向甲3。');
    expect(r.parts).toHaveLength(3);
    expect(resultSentence(s, axes, 'en').text).toBe('Your views lean strongly towards F0, clearly towards S1, and slightly towards F3.');
    expect(resultSentence(neutral(), axes, 'zh').parts).toHaveLength(0);
  });
  it('type name', () => {
    expect(typeName(neutral(), axes, 'zh')).toBe('中間派');
    expect(typeName(neutral(), axes, 'en')).toBe('Centrist');
    const one = sc({ 'federal-unitary': 80 });
    expect(typeName(one, axes, 'zh')).toBe('甲0派');
    expect(typeName(one, axes, 'en')).toBe('F0Noun');
    const two = sc({ 'federal-unitary': 80, 'democratic-autocratic': 30 });
    expect(typeName(two, axes, 'zh')).toBe('乙1式甲0派');
    expect(typeName(two, axes, 'en')).toBe('S1Adj F0Noun');
  });
});

describe('match', () => {
  const ide = (id: string, c: number[]): Ideology => ({
    id, name_en: id, name_zh: id,
    coords: { 'equality-markets': c[0], 'security-freedom': c[1], 'internationalist-nationalist': c[2], 'progressive-traditional': c[3] },
  });
  it('ideology RMS by hand', () => {
    const s = { ...neutral(), 'equality-markets': 60, 'security-freedom': 40, 'internationalist-nationalist': 80, 'progressive-traditional': 20, 'planned-laissezfaire': 0 };
    // diffs vs (50,50,50,50): 10,10,30,30 -> sq 100+100+900+900=2000 /4 = 500 -> sqrt 22.3607
    const r = matchIdeologies(s, [ide('far', [0, 0, 0, 0]), ide('mid', [50, 50, 50, 50])], 2);
    expect(r[0].ideology.id).toBe('mid');
    expect(r[0].similarity).toBeCloseTo(100 - Math.sqrt(500), 6);
    expect(r).toHaveLength(2);
  });
  it('figures: null penalty and exclusion', () => {
    const coords = (n: number, val: number | null) =>
      Object.fromEntries(AXIS_IDS.map((id, i) => [id, i < n ? val : null]));
    const figs: Figure[] = [
      { id: 'full', name_en: 'full', name_zh: 'full', coords: coords(12, 50) },
      { id: 'six', name_en: 'six', name_zh: 'six', coords: coords(6, 50) },
      { id: 'five', name_en: 'five', name_zh: 'five', coords: coords(5, 50) },
    ];
    const r = matchFigures(neutral(), figs, 5);
    expect(r.map((x) => x.figure.id)).toEqual(['full', 'six']);
    expect(r[0].similarity).toBe(100);
    // six: 6 nulls diff 28 -> rms = sqrt(6*784/12)=sqrt(392)
    expect(r[1].similarity).toBeCloseTo(100 - Math.sqrt(392), 6);
  });
});

describe('encode', () => {
  const scores = Object.fromEntries(AXIS_IDS.map((id, i) => [id, Math.round(i * 83.3 * 10) / 10 % 100.1]));
  it('round trip', () => {
    scores['federal-unitary'] = 0; scores['democratic-autocratic'] = 100; scores['militarist-pacifist'] = 33.3;
    const enc = encodeResult({ scores, mode: 'quick' });
    expect(enc).toMatch(/^m=quick&r=[0-9a-z]{24}$/);
    const d = decodeResult(enc)!;
    expect(d.mode).toBe('quick');
    for (const id of AXIS_IDS) expect(d.scores[id]).toBeCloseTo(Math.round(scores[id] * 10) / 10, 6);
    expect(typeName(d.scores, axes, 'zh')).toBe(typeName(scores, axes, 'zh'));
    expect(decodeResult('?' + enc)).not.toBeNull();
  });
  it('invalid', () => {
    expect(decodeResult('')).toBeNull();
    expect(decodeResult('m=quick&r=abc')).toBeNull();
    expect(decodeResult('m=bad&r=' + '00'.repeat(12))).toBeNull();
    expect(decodeResult('m=full&r=' + '!!'.repeat(12))).toBeNull();
    expect(decodeResult('m=full&r=' + 'zz'.repeat(12))).toBeNull();
  });
});

describe('round trip with ties (regression)', () => {
  it('decoded scores reproduce type, sentence and matches exactly', async () => {
    const { buildQuiz, scoreAxesFor, encodeResult, decodeResult, typeName, resultSentence, matchIdeologies, matchFigures, mulberry32 } = await import('../index');
    const questions = (await import('../../../data/questions.json')).default as any[];
    const axes = (await import('../../../data/axes.json')).default as any[];
    const ideologies = (await import('../../../data/ideologies.json')).default as any[];
    const figures = ((await import('../../../data/figures.json')).default as any).figures;
    const vals = [2, 1, 0.5, 0, -0.5, -1, -2];
    for (const mode of ['full', 'quick', 'mini'] as const) {
      for (let seed = 1; seed <= 150; seed++) {
        const quiz = buildQuiz(questions, mode, { seed });
        const r = mulberry32(seed * 7 + 3);
        const answers: Record<string, number> = {};
        for (const q of quiz.items) answers[q.id] = vals[Math.floor(r() * 7)];
        const s1 = scoreAxesFor(quiz.items, answers, axes);
        const d = decodeResult(encodeResult({ scores: s1, mode }))!;
        const sig = (s: any) => JSON.stringify([
          typeName(s, axes, 'zh'), resultSentence(s, axes, 'zh').text,
          matchIdeologies(s, ideologies).map((m: any) => m.ideology.id),
          matchFigures(s, figures).map((m: any) => m.figure.id),
        ]);
        expect(sig(d.scores)).toBe(sig(s1));
      }
    }
  });
});
