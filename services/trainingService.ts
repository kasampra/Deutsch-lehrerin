import { FeedbackReport, Language } from "../types";
import { AIProvider } from "./aiProvider";

export interface TrainingExercise {
  german: string;
  english: string;
  focus: string; // e.g., "Dativ Case", "Verb Conjugation"
}

export async function generatePersonalizedTraining(
  provider: AIProvider,
  report: FeedbackReport,
  language: Language
): Promise<TrainingExercise[]> {
  const prompt = `
    Based on the following language learning feedback, generate 5 targeted practice exercises.
    
    FEEDBACK SUMMARY:
    ${report.generalSummary}
    
    AREAS FOR IMPROVEMENT:
    Grammar: ${report.grammar.areasForImprovement.join(", ")}
    Vocabulary: ${report.vocabulary.areasForImprovement.join(", ")}

    Respond ONLY with a JSON array of objects:
    [{ "german": "sentence", "english": "translation", "focus": "reason for this exercise" }]
  `;

  try {
    // Reuse the chat method for simple generation
    const response = await provider.chat(prompt, "You are an exercise generator.", []);
    // Simple extraction of JSON if the LLM adds markdown
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    return JSON.parse(jsonStr) as TrainingExercise[];
  } catch (error) {
    console.error("Failed to generate training:", error);
    return [];
  }
}
