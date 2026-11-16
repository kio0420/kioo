import type { Axis, Figure, Ideology, Scores } from './types';

export const IDEOLOGY_AXES = [
  'equality-markets',
  'security-freedom',
  'internationalist-nationalist',
  'progressive-traditional',
] as const;
export const MISSING_DIFF = 28;
export const MIN_FIGURE_COORDS = 6;

export function matchIdeologies(scores: Scores, ideologies: readonly Ideology[], k = 3) {
  return ideologies
    .map((ideology) => {
      let sq = 0;
      for (const id of IDEOLOGY_AXES) {
        const d = (scores[id] ?? 50) - (ideology.coords[id] ?? 50);
        sq += d * d;
      }
      return { ideology, similarity: 100 - Math.sqrt(sq / IDEOLOGY_AXES.length) };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

export function matchFigures(
  scores: Scores,
  figures: readonly Figure[],
  k = 3,
  axes?: readonly Axis[] | readonly string[],
) {
  const ids = axes ? axes.map((a) => (typeof a === 'string' ? a : a.id)) : Object.keys(scores);
  return figures
    .filter((f) => ids.filter((id) => typeof f.coords[id] === 'number').length >= MIN_FIGURE_COORDS)
    .map((figure) => {
      let sq = 0;
      for (const id of ids) {
        const c = figure.coords[id];
        const d = typeof c === 'number' ? (scores[id] ?? 50) - c : MISSING_DIFF;
        sq += d * d;
      }
      return { figure, similarity: Math.max(0, 100 - Math.sqrt(sq / ids.length)) };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}
