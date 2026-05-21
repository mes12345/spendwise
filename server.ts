import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  // Bind to 3000 for AI Studio environment, but respect $PORT for Cloud Run deployments
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Route for Magic Entry - Robust server-side execution
  app.post("/api/magic", async (req, res) => {
    const { text, existingMerchants } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      console.error("GEMINI_API_KEY missing from environment");
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    const merchantsContext = existingMerchants && existingMerchants.length > 0 
      ? `\n\nExisting merchants in the system: ${existingMerchants.join(', ')}. Use matching names for consistency.`
      : '';

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const prompt = `Today is ${new Date().toISOString().split('T')[0]}. 
      Extract transaction details from: "${text}"
      ${merchantsContext}
      
      Rules:
      - Categories: Shopping, Fitness, Dining, Groceries, Automotive, Travel, Health, Entertainment, Utilities, Baby Items, Education, Household, Other.
      - date: Use YYYY-MM-DD. If no year is specified, use the current year.
      - amount: Number only.
      - vendor: The store/service name.
      - description: A short summary of what was bought.
      - isRecurring: true if it sounds like a subscription or monthly bill.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a financial data extractor. You must output valid JSON matching the schema precisely. Be consistent with category names.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              vendor: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING, enum: ["Shopping", "Fitness", "Dining", "Groceries", "Automotive", "Travel", "Health", "Entertainment", "Utilities", "Baby Items", "Education", "Household", "Other"] },
              isRecurring: { type: Type.BOOLEAN },
              date: { type: Type.STRING, description: "YYYY-MM-DD" },
            },
            required: ["amount", "vendor", "description", "category", "isRecurring", "date"]
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }
      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.error("Gemini server failure:", error);
      let errorMsg = "AI processing failed";
      let details = error.message || String(error);
      
      if (details.includes("API key not valid") || details.includes("API_KEY_INVALID") || details.includes("INVALID_ARGUMENT")) {
        errorMsg = "Invalid API Key";
        details = "The Gemini API key configured on the server is invalid. Please visit Settings > Secrets in AI Studio to configure a valid API key.";
      }
      
      res.status(500).json({ error: errorMsg, details });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serving from the dist directory in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Express 5 requires '*all' for the catch-all route
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Express server startup failed:", err);
  process.exit(1);
});
