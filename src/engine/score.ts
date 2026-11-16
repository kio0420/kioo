import type { Answers, Axis, Question, Scores } from './types';

export function answerValue(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= -2 && v <= 2 && (v * 2) % 1 === 0;
}

/**
 * First-pole % per axis, rounded to 0.1 (the precision stored in result URLs, so a decoded
 * result reproduces labels, type, sentence and matches exactly). Unanswered items are ignored; n=0 -> 50.
 */
export function scoreAxes(
  items: readonly Question[],
  answers: Answers,
  axisIds?: readonly string[],
): Scores {
  const sum: Record<string, number> = {};
  const n: Record<string, number> = {};
  for (const id of axisIds ?? []) { sum[id] = 0; n[id] = 0; }
  for (const q of items) {
    const v = answers[q.id];
    if (v === undefined || !answerValue(v)) continue;
    sum[q.axis] = (sum[q.axis] ?? 0) + (q.pole === 'first' ? v : -v);
    n[q.axis] = (n[q.axis] ?? 0) + 1;
  }
  const out: Scores = {};
  const ids = new Set<string>([...(axisIds ?? []), ...items.map((q) => q.axis)]);
  for (const id of ids) {
    const c = n[id] ?? 0;
    const s = c === 0 ? 50 : 50 + (50 * (sum[id] ?? 0)) / (2 * c);
    out[id] = Math.round(Math.min(100, Math.max(0, s)) * 10) / 10;
  }
  return out;
}

export function scoreAxesFor(items: readonly Question[], answers: Answers, axes: readonly Axis[]): Scores {
  return scoreAxes(items, answers, axes.map((a) => a.id));
}
