import { describe, expect, it } from 'vitest';
import { quizzes } from '../lib/demo/quizzes';

describe('Skill Arena interview question bank', () => {
  it('provides 100 questions across 10 interview domains', () => {
    expect(Object.keys(quizzes)).toHaveLength(10);
    expect(Object.values(quizzes).flat()).toHaveLength(100);
    expect(Object.values(quizzes).every((questions) => questions.length === 10)).toBe(true);
  });

  it('has a valid answer and explanation for every question', () => {
    for (const questions of Object.values(quizzes)) {
      for (const question of questions) {
        expect(question.options).toHaveLength(4);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
        expect(question.why.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
