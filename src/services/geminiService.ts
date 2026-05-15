
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
  try {
    const response = await fetch('/api/magic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, existingMerchants }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Magic Entry failed:", error);
    throw error;
  }
}
