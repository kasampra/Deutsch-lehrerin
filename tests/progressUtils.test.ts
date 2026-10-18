import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveSession,
  getProgress,
  exportSovereignData,
  importSovereignData,
  markSentenceMastered,
} from '../utils/progressUtils';
import { saveFlashcard, getFlashcards, Flashcard } from '../services/srsService';

describe('progressUtils - Sovereign Data Portability', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and reads session history', () => {
    saveSession({
      language: 'GERMAN',
      duration: 120,
      sentenceCount: 8,
    });

    const progress = getProgress();
    expect(progress.sessions.length).toBe(1);
    expect(progress.sessions[0].language).toBe('GERMAN');
    expect(progress.sessions[0].duration).toBe(120);
  });

  it('marks sentences as mastered with deduplication', () => {
    markSentenceMastered('Guten Tag!');
    markSentenceMastered('Guten Tag!');

    const progress = getProgress();
    expect(progress.masteredSentences).toEqual(['Guten Tag!']);
  });

  it('exports sovereign data in valid schema format', () => {
    saveSession({ language: 'GERMAN', duration: 300, sentenceCount: 15 });
    const card: Flashcard = {
      id: 'c1',
      front: 'der Hund',
      back: 'the dog',
      category: 'Everyday',
      interval: 1,
      repetition: 1,
      easeFactor: 2.5,
      dueDate: Date.now(),
      createdAt: Date.now(),
    };
    saveFlashcard(card);

    const exportedJson = exportSovereignData();
    const parsed = JSON.parse(exportedJson);

    expect(parsed.schema).toBe('deutsch_lehrerin_sovereign_backup_v1');
    expect(parsed.version).toBe('1.1.0');
    expect(parsed.progress.sessions.length).toBe(1);
    expect(parsed.flashcards.length).toBe(1);
  });

  it('imports sovereign data and merges with existing sessions and flashcards', () => {
    // Current local data
    saveSession({ language: 'GERMAN', duration: 100, sentenceCount: 5 });

    // External backup to import
    const backupJson = JSON.stringify({
      schema: 'deutsch_lehrerin_sovereign_backup_v1',
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      progress: {
        sessions: [
          { timestamp: 99999, language: 'GERMAN', duration: 250, sentenceCount: 10 },
        ],
        masteredSentences: ['Tschüss!'],
      },
      flashcards: [
        {
          id: 'imported-1',
          front: 'die Katze',
          back: 'the cat',
          category: 'Everyday',
          interval: 2,
          repetition: 1,
          easeFactor: 2.5,
          dueDate: Date.now(),
          createdAt: Date.now(),
        },
      ],
    });

    const result = importSovereignData(backupJson);
    expect(result.success).toBe(true);
    expect(result.sessionsCount).toBe(1);
    expect(result.flashcardsCount).toBe(1);

    const progress = getProgress();
    expect(progress.sessions.length).toBe(2);
    expect(progress.masteredSentences).toContain('Tschüss!');

    const cards = getFlashcards();
    expect(cards.some(c => c.front === 'die Katze')).toBe(true);
  });

  it('rejects invalid or corrupted backup files safely', () => {
    const invalidJson = JSON.stringify({ invalid: 'data' });
    const result = importSovereignData(invalidJson);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid backup file schema');
  });
});
