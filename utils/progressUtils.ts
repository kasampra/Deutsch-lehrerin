import { FeedbackReport } from "../types";

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

export const saveSession = (data: Omit<ProgressData['sessions'][0], 'timestamp'>) => {
  const current = getProgress();
  current.sessions.push({
    ...data,
    timestamp: Date.now(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
};

export const getProgress = (): ProgressData => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { sessions: [], masteredSentences: [] };
};

export const markSentenceMastered = (sentence: string) => {
  const current = getProgress();
  if (!current.masteredSentences.includes(sentence)) {
    current.masteredSentences.push(sentence);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
};
