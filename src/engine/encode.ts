import type { Mode, Scores } from './types';

export const AXIS_ORDER = [
  'federal-unitary',
  'democratic-autocratic',
  'internationalist-nationalist',
  'militarist-pacifist',
  'security-freedom',
  'equality-markets',
  'secular-religious',
  'progressive-traditional',
  'assimilationist-multiculturalist',
  'planned-laissezfaire',
  'protectionist-globalist',
  'acceleration-bioconservative',
] as const;

const MODES: readonly Mode[] = ['full', 'quick', 'mini'];

export function encodeResult(r: { scores: Scores; mode: Mode }): string {
  const r24 = AXIS_ORDER.map((id) => {
    const v = Math.min(1000, Math.max(0, Math.round((r.scores[id] ?? 50) * 10)));
    return v.toString(36).padStart(2, '0');
  }).join('');
  return `m=${r.mode}&r=${r24}`;
}

export function decodeResult(search: string): { scores: Scores; mode: Mode } | null {
  const p = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const m = p.get('m');
  const r = p.get('r');
  if (!m || !r || !MODES.includes(m as Mode)) return null;
  if (r.length !== AXIS_ORDER.length * 2 || !/^[0-9a-z]+$/.test(r)) return null;
  const scores: Scores = {};
  for (let i = 0; i < AXIS_ORDER.length; i++) {
    const v = parseInt(r.slice(i * 2, i * 2 + 2), 36);
    if (!(v >= 0 && v <= 1000)) return null;
    scores[AXIS_ORDER[i]] = v / 10;
  }
  return { scores, mode: m as Mode };
}
