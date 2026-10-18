import { describe, it, expect } from 'vitest';
import { GRAMMAR_DRILLS } from '../constants/grammarDrills';

describe('grammarDrills - Curriculum Validation', () => {
  it('contains valid drill items with options and explanations', () => {
    expect(GRAMMAR_DRILLS.length).toBeGreaterThanOrEqual(10);

    GRAMMAR_DRILLS.forEach(drill => {
      expect(drill.id).toBeDefined();
      expect(drill.wordOrSentence).toContain('___');
      expect(drill.options.length).toBeGreaterThanOrEqual(2);
      expect(drill.options).toContain(drill.correctAnswer);
      expect(drill.explanation.length).toBeGreaterThan(5);
    });
  });

  it('contains both article and case/preposition drill types', () => {
    const articleDrills = GRAMMAR_DRILLS.filter(d => d.type === 'article');
    const caseDrills = GRAMMAR_DRILLS.filter(d => d.type === 'case_preposition');

    expect(articleDrills.length).toBeGreaterThan(0);
    expect(caseDrills.length).toBeGreaterThan(0);
  });
});
