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
      const ai = new GoogleGenAI({ apiKey });
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `Today is ${new Date().toISOString().split('T')[0]}. 
      Extract transaction details from: "${text}"
      ${merchantsContext}
      
      Output JSON matching this schema:
      {
        "amount": number,
        "vendor": string,
        "description": string,
        "category": "Shopping" | "Fitness" | "Dining" | "Groceries" | "Automotive" | "Travel" | "Health" | "Entertainment" | "Utilities" | "Baby Items" | "Education" | "Household" | "Other",
        "isRecurring": boolean,
        "date": "YYYY-MM-DD"
      }`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const responseText = result.response.text();
      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.error("Gemini server failure:", error);
      res.status(500).json({ error: "AI processing failed", details: error.message });
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
