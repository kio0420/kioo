import type { Axis, Lang } from './types';

export function labelIndex(s: number): number {
  if (s > 90) return 0;
  if (s > 75) return 1;
  if (s > 60) return 2;
  if (s >= 40) return 3;
  if (s >= 25) return 4;
  if (s >= 10) return 5;
  return 6;
}

export function getLabel(axis: Axis, s: number, lang: Lang): string {
  const i = labelIndex(s);
  const en = axis.labels_en[i] ?? '';
  if (lang === 'en') return en;
  return axis.labels_zh[i] || en;
}
