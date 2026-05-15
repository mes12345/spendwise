
import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

export interface ParsedTransaction {
  amount: number;
  vendor: string;
  description: string;
  category: Category;
  isRecurring: boolean;
  date: string; // ISO format YYYY-MM-DD
}

export async function parseNaturalLanguageTransaction(text: string, existingMerchants: string[] = []): Promise<ParsedTransaction | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error("Gemini API key is not configured. Please ensure it is set in Settings > Secrets.");
  }

  const merchantsContext = existingMerchants && existingMerchants.length > 0 
    ? `\n\nExisting merchants in the system: ${existingMerchants.join(', ')}. If the merchant name in the text is a variation of an existing merchant, please use the existing merchant name exactly.`
    : '';

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Today is ${new Date().toISOString().split('T')[0]}. 
      
      Extract transaction details from: "${text}"
      ${merchantsContext}
      
      Rules:
      - Categories: ${Object.values(Category).join(', ')}.
      - date: Use YYYY-MM-DD. If no year is specified, use the current year.
      - amount: Number only.
      - vendor: The store/service name.
      - description: A short summary of what was bought.
      - isRecurring: true if it sounds like a subscription or monthly bill.`,
      config: {
        systemInstruction: "You are a financial data extractor. You must output valid JSON matching the schema precisely. Be consistent with category names.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            vendor: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING, enum: Object.values(Category) },
            isRecurring: { type: Type.BOOLEAN },
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
          },
          required: ["amount", "vendor", "description", "category", "isRecurring", "date"]
        },
      },
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini API");
    }

    return JSON.parse(response.text.trim()) as ParsedTransaction;
  } catch (error: any) {
    console.error("Magic Entry failed:", error);
    if (error.message?.includes("API key not valid")) {
       throw new Error("The Gemini API key is invalid. Please check your settings.");
    }
    throw error;
  }
}
