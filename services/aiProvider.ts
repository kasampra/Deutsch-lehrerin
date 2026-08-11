import { GoogleGenAI, Type } from "@google/genai";
import { FeedbackReport, TranscriptionItem, Language } from "../types";

export interface AIProvider {
  generateFeedback(history: TranscriptionItem[], language: Language): Promise<FeedbackReport>;
  chat(text: string, systemInstruction: string, history: { role: 'user' | 'assistant', content: string }[]): Promise<string>;
}

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async chat(text: string, systemInstruction: string, history: { role: 'user' | 'assistant', content: string }[]): Promise<string> {
    const contents = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      ...history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      { role: 'user', parts: [{ text: text }] }
    ];

    const response = await this.ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contents,
    });

    if (!response.text) throw new Error("No chat response generated");
    return response.text;
  }

  async generateFeedback(history: TranscriptionItem[], language: Language): Promise<FeedbackReport> {
    const conversationText = history
      .map((item) => `${item.speaker.toUpperCase()}: ${item.text}`)
      .join("\n");

    const prompts = {
      [Language.GERMAN]: `
        You are an expert German language tutor. Analyze the following conversation transcript between a student (USER) and a teacher (AI).
        Provide a structured assessment of the student's German skills.
        TRANSCRIPT:
        ${conversationText}
      `,
      [Language.ENGLISH]: `
        You are an expert English language tutor. Analyze the following conversation transcript between a student (USER) and a teacher (AI).
        Provide a structured assessment of the student's English skills.
        TRANSCRIPT:
        ${conversationText}
      `,
    };

    const categorySchema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
        actionableTips: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["score", "strengths", "areasForImprovement", "actionableTips"],
    };

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompts[language],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grammar: categorySchema,
            vocabulary: categorySchema,
            pronunciation: categorySchema,
            generalSummary: { type: Type.STRING },
          },
          required: ["grammar", "vocabulary", "pronunciation", "generalSummary"],
        },
      },
    });

    if (!response.text) throw new Error("No feedback generated");
    return JSON.parse(response.text) as FeedbackReport;
  }
}

export class OllamaProvider implements AIProvider {
  constructor(private model: string = "llama3", private baseUrl: string = "http://localhost:11434") {}

  async chat(text: string, systemInstruction: string, history: { role: 'user' | 'assistant', content: string }[]): Promise<string> {
    const messages = [
      { role: "system", content: systemInstruction },
      ...history,
      { role: "user", content: text }
    ];

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message.content;
  }

  async generateFeedback(history: TranscriptionItem[], language: Language): Promise<FeedbackReport> {
    const conversationText = history
      .map((item) => `${item.speaker.toUpperCase()}: ${item.text}`)
      .join("\n");

    const prompt = `
      You are an expert ${language === Language.GERMAN ? 'German' : 'English'} language tutor. 
      Analyze the following conversation transcript between a student (USER) and a teacher (AI).
      
      Respond ONLY with a JSON object following this structure:
      {
        "grammar": { "score": 1-10, "strengths": [], "areasForImprovement": [], "actionableTips": [] },
        "vocabulary": { "score": 1-10, "strengths": [], "areasForImprovement": [], "actionableTips": [] },
        "pronunciation": { "score": 1-10, "strengths": [], "areasForImprovement": [], "actionableTips": [] },
        "generalSummary": "string"
      }

      TRANSCRIPT:
      ${conversationText}
    `;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        format: "json"
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.response) as FeedbackReport;
  }
}

export class LMStudioProvider implements AIProvider {
  constructor(private model: string = "model-identifier", private baseUrl: string = "http://localhost:1234/v1") {}

  async chat(text: string, systemInstruction: string, history: { role: 'user' | 'assistant', content: string }[]): Promise<string> {
    const messages = [
      { role: "system", content: systemInstruction },
      ...history,
      { role: "user", content: text }
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateFeedback(history: TranscriptionItem[], language: Language): Promise<FeedbackReport> {
    const conversationText = history
      .map((item) => `${item.speaker.toUpperCase()}: ${item.text}`)
      .join("\n");

    const prompt = `
      You are an expert ${language === Language.GERMAN ? 'German' : 'English'} language tutor. 
      Analyze the following conversation transcript between a student (USER) and a teacher (AI).
      
      Respond ONLY with a JSON object following this structure:
      {
        "grammar": { "score": 1-10, "strengths": [], "areasForImprovement": [], "actionableTips": [] },
        "vocabulary": { "score": 1-10, "strengths": [], "areasForImprovement": [], "actionableTips": [] },
        "pronunciation": { "score": 1-10, "strengths": [], "areasForImprovement": [], "actionableTips": [] },
        "generalSummary": "string"
      }

      TRANSCRIPT:
      ${conversationText}
    `;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as FeedbackReport;
  }
}
