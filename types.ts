export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface TranscriptionItem {
  speaker: 'user' | 'ai';
  text: string;
  isComplete: boolean;
  timestamp: number;
}

export interface AudioVisualizerData {
  volume: number; // 0.0 to 1.0
}

export interface FeedbackCategory {
  score: number; // 1-10
  strengths: string[];
  areasForImprovement: string[];
  actionableTips: string[];
}

export interface FeedbackReport {
  grammar: FeedbackCategory;
  vocabulary: FeedbackCategory;
  pronunciation: FeedbackCategory;
  generalSummary: string;
}
