import { describe, expect, it } from 'vitest';
import questions from '../../../data/questions.json';
import axes from '../../../data/axes.json';
import { buildQuiz } from '..';
import type { Question } from '..';

const Q = questions as Question[];

describe('real data', () => {
  it('has 288 questions, 12 axes', () => {
    expect(Q).toHaveLength(288);
    expect(axes).toHaveLength(12);
  });
  it('buildQuiz counts', () => {
    expect(buildQuiz(Q, 'full', { seed: 1 }).items).toHaveLength(288);
    expect(buildQuiz(Q, 'quick', { seed: 1 }).items).toHaveLength(60);
    expect(buildQuiz(Q, 'mini', { seed: 1 }).items).toHaveLength(36);
  });
});
