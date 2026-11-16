import { MODE_CONFIG, mirrorLevel } from './config';
import { mulberry32, seededShuffle } from './rng';
import type { BuildOptions, Mode, Question, Quiz } from './types';

export function buildQuiz(questions: readonly Question[], mode: Mode, opts: BuildOptions): Quiz {
  const rand = mulberry32(opts.seed);
  const cfg = MODE_CONFIG[mode];
  const levels = opts.levelSets ?? cfg.levels;
  if (!levels) {
    return { items: seededShuffle(questions, rand), mirroredAxes: [], seed: opts.seed };
  }
  const frac = opts.mirrorFraction ?? cfg.mirrorFraction;
  const axisIds: string[] = [];
  for (const q of questions) if (!axisIds.includes(q.axis)) axisIds.push(q.axis);

  const nMirror = Math.round(axisIds.length * frac);
  const mirrored = new Set(seededShuffle(axisIds, rand).slice(0, nMirror));

  const picked: Question[] = [];
  for (const axis of axisIds) {
    const lv = mirrored.has(axis) ? levels.map(mirrorLevel) : levels;
    for (const l of lv) {
      const pool = questions.filter((q) => q.axis === axis && q.level === l);
      if (pool.length) picked.push(pool[Math.floor(rand() * pool.length)]);
    }
  }
  return {
    items: seededShuffle(picked, rand),
    mirroredAxes: axisIds.filter((a) => mirrored.has(a)),
    seed: opts.seed,
  };
}
