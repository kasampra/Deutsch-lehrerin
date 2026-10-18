import { TranscriptionItem } from '../types';
import { EVERYDAY_SENTENCES } from '../constants';

export enum SRSReviewRating {
  AGAIN = 1, // Complete blackout / major error
  HARD = 2,  // Correct response with significant hesitation or partial error
  GOOD = 3,  // Correct response with normal recall
  EASY = 4,  // Perfect, instantaneous recall
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  category: 'Everyday' | 'Grammar Correction' | 'Scenario' | 'Custom';
  interval: number; // in days
  repetition: number;
  easeFactor: number;
  dueDate: number; // timestamp in ms
  lastReviewed?: number; // timestamp in ms
  createdAt: number;
}

const STORAGE_KEY_SRS = 'deutsch_lehrerin_srs_cards';
const CORRECTION_REGEX = /\[Korrektur:\s*['"`]?(.*?)['"`]?\s*->\s*['"`]?(.*?)['"`]?\s*\|\s*(.*?)\]/i;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * SM-2 / FSRS adaptation for calculating next review interval
 */
export function calculateNextReview(
  card: Flashcard,
  rating: SRSReviewRating,
  now: number = Date.now()
): Flashcard {
  let interval = card.interval;
  let repetition = card.repetition;
  let easeFactor = card.easeFactor;

  switch (rating) {
    case SRSReviewRating.AGAIN:
      repetition = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;

    case SRSReviewRating.HARD:
      repetition += 1;
      interval = Math.max(1, Math.round(interval * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;

    case SRSReviewRating.GOOD:
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition += 1;
      break;

    case SRSReviewRating.EASY:
      if (repetition === 0) {
        interval = 3;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor * 1.3);
      }
      easeFactor += 0.15;
      repetition += 1;
      break;
  }

  return {
    ...card,
    interval,
    repetition,
    easeFactor: Number(easeFactor.toFixed(2)),
    dueDate: now + interval * DAY_IN_MS,
    lastReviewed: now,
  };
}

/**
 * Extracts grammar correction cards from conversation transcript
 */
export function extractCardsFromTranscript(items: TranscriptionItem[]): Flashcard[] {
  const extracted: Flashcard[] = [];
  const now = Date.now();

  items.forEach((item, index) => {
    if (item.speaker !== 'ai') return;
    const match = item.text.match(CORRECTION_REGEX);
    if (!match) return;

    const [, incorrect, correct, explanation] = match;
    const cleanIncorrect = incorrect.trim();
    const cleanCorrect = correct.trim();

    if (!cleanIncorrect || !cleanCorrect) return;

    extracted.push({
      id: `correction-${now}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      front: cleanIncorrect,
      back: cleanCorrect,
      explanation: explanation?.trim() || undefined,
      category: 'Grammar Correction',
      interval: 1,
      repetition: 0,
      easeFactor: 2.5,
      dueDate: now, // immediately available for review
      createdAt: now,
    });
  });

  return extracted;
}

export function getFlashcards(): Flashcard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SRS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read SRS flashcards:', e);
    return [];
  }
}

export function saveAllFlashcards(cards: Flashcard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SRS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save SRS flashcards:', e);
  }
}

export function saveFlashcard(card: Flashcard): void {
  const cards = getFlashcards();
  const existingIndex = cards.findIndex(c => c.id === card.id);
  if (existingIndex >= 0) {
    cards[existingIndex] = card;
  } else {
    cards.push(card);
  }
  saveAllFlashcards(cards);
}

export function getDueCards(now: number = Date.now()): Flashcard[] {
  const cards = getFlashcards();
  return cards.filter(c => c.dueDate <= now);
}

/**
 * Adds new grammar corrections from session transcript into the user's review deck
 * with deduplication on (front + back).
 */
export function addGrammarCorrectionsFromSession(items: TranscriptionItem[]): number {
  const newCards = extractCardsFromTranscript(items);
  if (newCards.length === 0) return 0;

  const existing = getFlashcards();
  let addedCount = 0;

  for (const card of newCards) {
    const isDuplicate = existing.some(
      e => e.front.toLowerCase() === card.front.toLowerCase() &&
           e.back.toLowerCase() === card.back.toLowerCase()
    );
    if (!isDuplicate) {
      existing.push(card);
      addedCount += 1;
    }
  }

  if (addedCount > 0) {
    saveAllFlashcards(existing);
  }

  return addedCount;
}

/**
 * Seed initial cards from Everyday Sentences if user has no cards yet.
 */
export function seedInitialCardsIfEmpty(): void {
  const existing = getFlashcards();
  if (existing.length > 0) return;

  const now = Date.now();
  const initialCards: Flashcard[] = EVERYDAY_SENTENCES.slice(0, 15).map((s, idx) => ({
    id: `seed-${idx}`,
    front: s.english,
    back: s.german,
    explanation: `Category: ${s.category}`,
    category: 'Everyday',
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: now + idx * 3600 * 1000, // stagger due times
    createdAt: now,
  }));

  saveAllFlashcards(initialCards);
}
