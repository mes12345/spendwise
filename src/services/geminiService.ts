
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
      contents: text,
      config: {
        systemInstruction: `Return a raw JSON object with: amount (number), vendor (string), category (string), and isRecurring (boolean). Categories: Shopping, Fitness, Dining, Groceries, Automotive, Travel, Health, Entertainment, Utilities, Baby Items, Education, Household, Other. No markdown.`,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            vendor: { type: Type.STRING },
            category: { type: Type.STRING },
            isRecurring: { type: Type.BOOLEAN },
          },
          required: ["amount", "vendor", "category", "isRecurring"]
        },
      },
    });

    const json = JSON.parse(response.text || "{}");
    return {
      ...json,
      description: json.vendor || text.slice(0, 50), // Fallback description
      date: new Date().toISOString().split('T')[0] // Default to today
    } as ParsedTransaction;
  } catch (error) {
    console.error("Gemini optimization fallback applied:", error);
    return {
      amount: 0,
      vendor: "Unknown",
      description: text.slice(0, 50),
      category: "Other",
      isRecurring: false,
      date: new Date().toISOString().split('T')[0]
    };
  }
}
