import { GoogleGenAI, Type } from "@google/genai";

export interface ParsedTransaction {
  amount: number;
  vendor: string;
  description: string;
  category: string;
  isRecurring: boolean;
  date?: string; // ISO format YYYY-MM-DD
}

// In AI Studio Build, process.env.GEMINI_API_KEY is automatically provided.
const apiKey = process.env.GEMINI_API_KEY;

export async function parseNaturalLanguageTransaction(text: string): Promise<ParsedTransaction | null> {
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured in the environment.");
    throw new Error("GEMINI_API_KEY is missing. Please check your AI Studio Secrets.");
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
      throw new Error("Model returned empty response");
    }

    const result = JSON.parse(response.text);
    return result as ParsedTransaction;
  } catch (error: any) {
    console.error("Gemini parsing failed:", error);
    // Explicitly throw so the UI can catch and alert the message as requested for debugging
    throw error;
  }
}
