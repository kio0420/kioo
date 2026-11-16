import type { Mode } from './types';

export const ANSWER_OPTIONS = [
  { value: 2, zh: '非常同意', en: 'Strongly agree' },
  { value: 1, zh: '同意', en: 'Agree' },
  { value: 0.5, zh: '有點同意', en: 'Somewhat agree' },
  { value: 0, zh: '中立', en: 'Neutral' },
  { value: -0.5, zh: '有點不同意', en: 'Somewhat disagree' },
  { value: -1, zh: '不同意', en: 'Disagree' },
  { value: -2, zh: '非常不同意', en: 'Strongly disagree' },
] as const;

export interface ModeConfig {
  /** Levels (1..8) asked per axis; null = all levels, no mirroring. */
  levels: number[] | null;
  /** Fraction of axes whose level set is mirrored (l -> 9 - l). */
  mirrorFraction: number;
}

// quick set derived from the original 12axes short quiz (indices 1,2,3,5,7);
// mini is a subset of quick: strong+mild on one side, moderate on the other.
export const MODE_CONFIG: Record<Mode, ModeConfig> = {
  full: { levels: null, mirrorFraction: 0 },
  quick: { levels: [2, 3, 4, 6, 8], mirrorFraction: 0.5 },
  mini: { levels: [2, 4, 6], mirrorFraction: 0.5 },
};

export const ALL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];
export const mirrorLevel = (l: number): number => 9 - l;
