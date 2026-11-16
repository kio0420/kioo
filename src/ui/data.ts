import type { Axis, Figure, Ideology, PoleInfo, Question } from '../engine';
import questionsJson from '../../data/questions.json';
import axesJson from '../../data/axes.json';
import ideologiesJson from '../../data/ideologies.json';
import figuresJson from '../../data/figures.json';
import { pick } from './i18n';

export const questions = questionsJson as unknown as Question[];
export const axes = axesJson as unknown as Axis[];
export const ideologies = ideologiesJson as unknown as Ideology[];
const fj = figuresJson as unknown as { disclaimer?: string | { zh?: string; en?: string }; figures: Figure[] };
export const figures: Figure[] = fj.figures;

export const CATEGORIES = ['government', 'foreign', 'economy', 'society'] as const;

export const qText = (q: Question) => pick(q.text_zh, q.text_en);
export const poleName = (p: PoleInfo) => pick(p.name_zh, p.name_en);
export const ideoName = (i: Ideology) => pick(i.name_zh, i.name_en);
export const ideoDesc = (i: Ideology) => pick(i.desc_zh, i.desc_en);
export const figName = (f: Figure) => pick(f.name_zh, f.name_en);

export function figureDisclaimer(): { zh: string; en: string } {
  const d = fj.disclaimer;
  if (!d) return { zh: '', en: '' };
  if (typeof d === 'object') return { zh: d.zh ?? '', en: d.en ?? '' };
  const i = d.indexOf(' / ');
  return i < 0 ? { zh: d, en: d } : { zh: d.slice(0, i), en: d.slice(i + 3) };
}
