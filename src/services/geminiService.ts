
import { GoogleGenAI, Type } from "@google/genai";

// Note: Always prefer process.env.GEMINI_API_KEY for the Gemini API.
const apiKey = process.env.GEMINI_API_KEY;

export interface ParsedTransaction {
  amount: number;
  vendor: string;
  description: string;
  category: string;
  isRecurring: boolean;
  date?: string; // ISO format YYYY-MM-DD
}

export async function parseNaturalLanguageTransaction(text: string): Promise<ParsedTransaction | null> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract transaction details (amount, vendor, description, category, isRecurring, date) from: "${text}". Current date: ${new Date().toISOString().split('T')[0]}.`,
      config: {
        systemInstruction: "Extract transaction details. Categories: Food, Transport, Utilities, Entertainment, Shopping, Health, Other. Return JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            vendor: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            isRecurring: { type: Type.BOOLEAN },
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
          },
          required: ["amount", "vendor", "description", "category", "isRecurring", "date"]
        },
      },
    });

    const json = JSON.parse(response.text || "{}");
    return json as ParsedTransaction;
  } catch (error) {
    console.error("Gemini parsing failed:", error);
    return null;
  }
}
