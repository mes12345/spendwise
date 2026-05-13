
import { GoogleGenAI, Type } from "@google/genai";

export interface ParsedTransaction {
  amount: number;
  vendor: string;
  description: string;
  category: string;
  isRecurring: boolean;
  date?: string; // ISO format YYYY-MM-DD
}

// In AI Studio, process.env.GEMINI_API_KEY is provided automatically.
const apiKey = process.env.GEMINI_API_KEY;

export async function parseNaturalLanguageTransaction(text: string): Promise<ParsedTransaction | null> {
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured in the environment.");
    throw new Error("GEMINI_API_KEY is missing. Please ensure your AI Studio project is configured.");
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

    if (!response.text) {
      throw new Error("Model returned an empty response.");
    }

    const result = JSON.parse(response.text);
    return result as ParsedTransaction;
  } catch (error: any) {
    console.error("Gemini client-side parsing failed:", error);
    // Alert info for debugging as per user requirement
    const errorMsg = error.message || String(error);
    throw new Error(`Client-side Gemini Error: ${errorMsg}`);
  }
}
