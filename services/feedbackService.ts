import { GoogleGenAI, Type } from "@google/genai";
import { FeedbackReport, TranscriptionItem, Language } from "../types";

export async function generateFeedback(apiKey: string, history: TranscriptionItem[], language: Language = Language.GERMAN): Promise<FeedbackReport> {
  const ai = new GoogleGenAI({ apiKey });

  const conversationText = history
    .map((item) => `${item.speaker.toUpperCase()}: ${item.text}`)
    .join("\n");

  const prompts = {
    [Language.GERMAN]: `
      You are an expert German language tutor. Analyze the following conversation transcript between a student (USER) and a teacher (AI).
      
      Provide a structured assessment of the student's German skills.
      Focus on:
      1. Grammar: Correct usage of cases, verb conjugations, sentence structure (Satzbau).
      2. Vocabulary: Variety, appropriateness, use of specific terms.
      3. Pronunciation: Infer likely pronunciation issues based on the text (e.g. if the transcript shows phonetically incorrect words) or general advice for their level. *Note: Since this is text-based, focus on general pronunciation advice for the words they used.*
      
      Provide a score (1-10), strengths, areas for improvement, and specifically actionable advice for next steps.
      
      TRANSCRIPT:
      ${conversationText}
    `,
    [Language.ENGLISH]: `
      You are an expert English language tutor. Analyze the following conversation transcript between a student (USER) and a teacher (AI).
      
      Provide a structured assessment of the student's English skills.
      Focus on:
      1. Grammar: Correct usage of tenses, subject-verb agreement, article usage, sentence structure.
      2. Vocabulary: Range, appropriateness, idiomatic expressions, word choice.
      3. Pronunciation: Infer likely pronunciation issues based on the text (e.g. if the transcript shows phonetically incorrect words) or general advice for their level. *Note: Since this is text-based, focus on general pronunciation advice for the words they used.*
      
      Provide a score (1-10), strengths, areas for improvement, and specifically actionable advice for next steps.
      
      TRANSCRIPT:
      ${conversationText}
    `,
  };

  const prompt = prompts[language];

  const categorySchema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: "Score from 1 to 10" },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
      actionableTips: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["score", "strengths", "areasForImprovement", "actionableTips"],
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          grammar: categorySchema,
          vocabulary: categorySchema,
          pronunciation: categorySchema,
          generalSummary: { type: Type.STRING, description: "A brief, encouraging summary of the session." },
        },
        required: ["grammar", "vocabulary", "pronunciation", "generalSummary"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No feedback generated");
  
  return JSON.parse(text) as FeedbackReport;
}