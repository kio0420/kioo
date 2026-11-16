export type Lang = 'zh' | 'en';
export type Mode = 'full' | 'quick' | 'mini';
export type Pole = 'first' | 'second';

export interface PoleInfo {
  id: string;
  name_en: string;
  name_zh: string;
  adj_en?: string;
  noun_en?: string;
  adj_zh?: string;
  noun_zh?: string;
}

export interface Axis {
  id: string;
  index: number;
  category: string;
  first: PoleInfo;
  second: PoleInfo;
  labels_en: string[];
  labels_zh: string[];
}

export interface Question {
  id: string;
  axis: string;
  level: number;
  pole: Pole;
  text_en: string;
  text_zh: string;
}

export interface Ideology {
  id: string;
  name_en: string;
  name_zh: string;
  link?: string;
  desc_en?: string;
  desc_zh?: string;
  coords: Record<string, number>;
}

export interface Figure {
  id: string;
  name_en: string;
  name_zh: string;
  country?: string;
  lean?: string;
  coords: Record<string, number | null | undefined>;
  sources?: Record<string, string>;
}

export type Scores = Record<string, number>;
export type Answers = Record<string, number>;

export interface BuildOptions {
  seed: number;
  levelSets?: number[];
  mirrorFraction?: number;
}

export interface Quiz {
  items: Question[];
  mirroredAxes: string[];
  seed: number;
}
