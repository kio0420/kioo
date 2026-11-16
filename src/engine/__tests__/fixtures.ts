import type { Axis, Question } from '../types';

export const AXIS_IDS = [
  'federal-unitary','democratic-autocratic','internationalist-nationalist','militarist-pacifist',
  'security-freedom','equality-markets','secular-religious','progressive-traditional',
  'assimilationist-multiculturalist','planned-laissezfaire','protectionist-globalist','acceleration-bioconservative',
];

export function mkAxis(id: string, index: number, first = `F${index}`, second = `S${index}`): Axis {
  return {
    id, index, category: 'x',
    first: { id: `${id}-f`, name_en: first, name_zh: `甲${index}`, adj_en: `${first}Adj`, noun_en: `${first}Noun`, adj_zh: `甲${index}式`, noun_zh: `甲${index}派` },
    second: { id: `${id}-s`, name_en: second, name_zh: `乙${index}`, adj_en: `${second}Adj`, noun_en: `${second}Noun`, adj_zh: `乙${index}式`, noun_zh: `乙${index}派` },
    labels_en: ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'],
    labels_zh: ['零', '一', '二', '三', '四', '五', '六'],
  };
}

export const axes: Axis[] = AXIS_IDS.map((id, i) => mkAxis(id, i));

export function mkQuestions(ids = AXIS_IDS): Question[] {
  const out: Question[] = [];
  ids.forEach((axis, a) => {
    for (let level = 1; level <= 8; level++) {
      for (let k = 1; k <= 3; k++) {
        out.push({ id: `A${a}-L${level}-Q${k}`, axis, level, pole: level <= 4 ? 'first' : 'second', text_en: 'e', text_zh: 'z' });
      }
    }
  });
  return out;
}

export const neutral = () => Object.fromEntries(AXIS_IDS.map((i) => [i, 50]));
