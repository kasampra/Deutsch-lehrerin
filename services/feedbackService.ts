import { FeedbackReport, TranscriptionItem, Language } from "../types";
import { AIProvider } from "./aiProvider";

export async function generateFeedback(provider: AIProvider, history: TranscriptionItem[], language: Language = Language.GERMAN): Promise<FeedbackReport> {
  return provider.generateFeedback(history, language);
}
