
import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parseTransaction(text: string) {
  const categories = Object.values(Category).join(', ');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this spending transaction: "${text}". 
    Extract the amount (if mentioned, otherwise 0) and categorize it into one of these: ${categories}.
    If the text is just a store or item name, predict the most likely category.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "A clean description of the item or store" },
          amount: { type: Type.NUMBER, description: "The numerical amount spent" },
          category: { type: Type.STRING, description: "The best category fit" }
        },
        required: ["description", "amount", "category"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    // Ensure the category is valid
    if (!Object.values(Category).includes(data.category as Category)) {
      data.category = Category.Other;
    }
    return data;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { description: text, amount: 0, category: Category.Other };
  }
}
