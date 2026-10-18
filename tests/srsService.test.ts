import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateNextReview,
  SRSReviewRating,
  extractCardsFromTranscript,
  addGrammarCorrectionsFromSession,
  getFlashcards,
  getDueCards,
  saveFlashcard,
  Flashcard,
} from '../services/srsService';
import { TranscriptionItem } from '../types';

describe('srsService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const baseCard: Flashcard = {
    id: 'test-1',
    front: 'Ich habe gegangen',
    back: 'Ich bin gegangen',
    explanation: 'Perfekt mit sein',
    category: 'Grammar Correction',
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: Date.now(),
    createdAt: Date.now(),
  };

  it('calculates next review for AGAIN (resets interval)', () => {
    const cardWithReps: Flashcard = { ...baseCard, interval: 6, repetition: 3, easeFactor: 2.5 };
    const updated = calculateNextReview(cardWithReps, SRSReviewRating.AGAIN, 100000);

    expect(updated.interval).toBe(1);
    expect(updated.repetition).toBe(0);
    expect(updated.easeFactor).toBe(2.3);
    expect(updated.dueDate).toBe(100000 + 1 * 24 * 60 * 60 * 1000);
  });

  it('calculates next review for GOOD (advances interval)', () => {
    // 1st good review
    const r1 = calculateNextReview(baseCard, SRSReviewRating.GOOD, 100000);
    expect(r1.interval).toBe(1);
    expect(r1.repetition).toBe(1);

    // 2nd good review
    const r2 = calculateNextReview(r1, SRSReviewRating.GOOD, 200000);
    expect(r2.interval).toBe(3);
    expect(r2.repetition).toBe(2);

    // 3rd good review
    const r3 = calculateNextReview(r2, SRSReviewRating.GOOD, 300000);
    expect(r3.interval).toBe(Math.round(3 * 2.5));
    expect(r3.repetition).toBe(3);
  });

  it('calculates next review for EASY (bonus interval and ease)', () => {
    const updated = calculateNextReview(baseCard, SRSReviewRating.EASY, 100000);
    expect(updated.interval).toBe(3);
    expect(updated.repetition).toBe(1);
    expect(updated.easeFactor).toBe(2.65);
  });

  it('extracts grammar correction cards from conversation transcripts', () => {
    const transcripts: TranscriptionItem[] = [
      {
        speaker: 'user',
        text: 'Ich habe nach Hause gegangen.',
        isComplete: true,
        timestamp: 1000,
      },
      {
        speaker: 'ai',
        text: "[Korrektur: 'Ich habe gegangen' -> 'Ich bin gegangen' | Perfekt mit sein bilden!] Sehr schön, und was hast du dort gemacht?",
        isComplete: true,
        timestamp: 2000,
      },
    ];

    const cards = extractCardsFromTranscript(transcripts);
    expect(cards.length).toBe(1);
    expect(cards[0].front).toBe('Ich habe gegangen');
    expect(cards[0].back).toBe('Ich bin gegangen');
    expect(cards[0].explanation).toBe('Perfekt mit sein bilden!');
  });

  it('adds corrections from session without creating duplicates', () => {
    const transcripts: TranscriptionItem[] = [
      {
        speaker: 'ai',
        text: "[Korrektur: 'der Mädchen' -> 'das Mädchen' | Neutrum!] Genau.",
        isComplete: true,
        timestamp: 1000,
      },
    ];

    const added1 = addGrammarCorrectionsFromSession(transcripts);
    expect(added1).toBe(1);
    expect(getFlashcards().length).toBe(1);

    // Run again with identical transcript
    const added2 = addGrammarCorrectionsFromSession(transcripts);
    expect(added2).toBe(0);
    expect(getFlashcards().length).toBe(1);
  });

  it('retrieves due cards correctly', () => {
    const now = 500000;
    const cardPast: Flashcard = { ...baseCard, id: 'past', dueDate: now - 1000 };
    const cardFuture: Flashcard = { ...baseCard, id: 'future', dueDate: now + 50000 };

    saveFlashcard(cardPast);
    saveFlashcard(cardFuture);

    const due = getDueCards(now);
    expect(due.length).toBe(1);
    expect(due[0].id).toBe('past');
  });
});
