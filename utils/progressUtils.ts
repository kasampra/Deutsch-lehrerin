import { FeedbackReport } from "../types";
import { getFlashcards, saveAllFlashcards, Flashcard } from "../services/srsService";

const STORAGE_KEY = 'deutsch_lehrerin_progress';

export interface ProgressData {
  sessions: {
    timestamp: number;
    language: string;
    duration: number;
    sentenceCount: number;
    feedback?: FeedbackReport;
  }[];
  masteredSentences: string[];
}

export interface SovereignBackup {
  schema: 'deutsch_lehrerin_sovereign_backup_v1';
  version: string;
  exportedAt: string;
  progress: ProgressData;
  flashcards: Flashcard[];
  settings?: {
    provider?: string | null;
    strictness?: string | null;
    selectedModel?: string | null;
  };
}

export const saveSession = (data: Omit<ProgressData['sessions'][0], 'timestamp'>) => {
  const current = getProgress();
  current.sessions.push({
    ...data,
    timestamp: Date.now(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
};

export const getProgress = (): ProgressData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { sessions: [], masteredSentences: [] };
  } catch (e) {
    console.error("Failed to read progress data:", e);
    return { sessions: [], masteredSentences: [] };
  }
};

export const markSentenceMastered = (sentence: string) => {
  const current = getProgress();
  if (!current.masteredSentences.includes(sentence)) {
    current.masteredSentences.push(sentence);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
};

/**
 * Exports all user data into a clean, sovereign JSON string
 */
export const exportSovereignData = (): string => {
  const progress = getProgress();
  const flashcards = getFlashcards();
  const settings = {
    provider: localStorage.getItem('deutsch_lehrerin_provider'),
    strictness: localStorage.getItem('deutsch_lehrerin_strictness'),
    selectedModel: localStorage.getItem('deutsch_lehrerin_selected_model'),
  };

  const backup: SovereignBackup = {
    schema: 'deutsch_lehrerin_sovereign_backup_v1',
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    progress,
    flashcards,
    settings,
  };

  return JSON.stringify(backup, null, 2);
};

/**
 * Triggers a browser file download of the sovereign backup
 */
export const downloadSovereignBackup = (): void => {
  const json = exportSovereignData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `deutsch-lehrerin-sovereign-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Imports and merges sovereign backup JSON into local storage
 */
export const importSovereignData = (
  jsonString: string
): { success: boolean; message: string; sessionsCount?: number; flashcardsCount?: number } => {
  try {
    const parsed = JSON.parse(jsonString) as SovereignBackup;
    if (!parsed || parsed.schema !== 'deutsch_lehrerin_sovereign_backup_v1') {
      return { success: false, message: 'Invalid backup file schema. Please ensure this is a Deutsch-lehrerin backup.' };
    }

    // Merge sessions
    const currentProgress = getProgress();
    const existingTimestamps = new Set(currentProgress.sessions.map(s => s.timestamp));
    let newSessions = 0;

    if (parsed.progress?.sessions) {
      for (const s of parsed.progress.sessions) {
        if (!existingTimestamps.has(s.timestamp)) {
          currentProgress.sessions.push(s);
          existingTimestamps.add(s.timestamp);
          newSessions++;
        }
      }
    }

    // Merge mastered sentences
    if (parsed.progress?.masteredSentences) {
      for (const sentence of parsed.progress.masteredSentences) {
        if (!currentProgress.masteredSentences.includes(sentence)) {
          currentProgress.masteredSentences.push(sentence);
        }
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProgress));

    // Merge flashcards
    const currentCards = getFlashcards();
    let newCards = 0;
    if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
      for (const card of parsed.flashcards) {
        const exists = currentCards.some(
          c => c.front.toLowerCase() === card.front.toLowerCase() &&
               c.back.toLowerCase() === card.back.toLowerCase()
        );
        if (!exists) {
          currentCards.push(card);
          newCards++;
        }
      }
      saveAllFlashcards(currentCards);
    }

    return {
      success: true,
      message: `Successfully imported ${newSessions} sessions and ${newCards} flashcards!`,
      sessionsCount: newSessions,
      flashcardsCount: newCards,
    };
  } catch (e: any) {
    return { success: false, message: `Failed to parse backup: ${e.message || 'Corrupted file'}` };
  }
};
