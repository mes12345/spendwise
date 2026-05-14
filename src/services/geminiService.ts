
import { GoogleGenAI, Type } from "@google/genai";

export interface ParsedTransaction {
  amount: number;
  vendor: string;
  description: string;
  category: string;
  isRecurring: boolean;
  date?: string; // ISO format YYYY-MM-DD
}

export async function parseNaturalLanguageTransaction(text: string, existingMerchants: string[] = []): Promise<ParsedTransaction | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Magic Entry: API Key present?", !!apiKey, "Length:", apiKey?.length);
  
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error("GEMINI_API_KEY is not configured or is empty. Please check Settings > Secrets.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const merchantsContext = existingMerchants.length > 0 
    ? `\n\nExisting merchants in the system: ${existingMerchants.join(', ')}. Please attempt to match the extracted vendor to one of these if they appear to be same (e.g. prioritize exact matches or follow established naming/capitalization).`
    : '';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract transaction details (amount, vendor, description, category, isRecurring, date) from: "${text}". Current date: ${new Date().toISOString().split('T')[0]}.${merchantsContext}`,
      config: {
        systemInstruction: "Extract transaction details. Categories: Food, Transport, Utilities, Entertainment, Shopping, Health, Other. Return JSON. If a merchant name is similar to one provided in the existing list, use the existing one to maintain consistency.",
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
    throw error;
  }
}
