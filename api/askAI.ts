import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are Moon Night's advanced AI Fouad. 
Your goal is to help users navigate the digital shop, find products (Accounts, Keys, Services), and get information about Tournaments.
You have access to the current product catalog and tournament list in the context.
Be helpful, concise, and maintain a cool, cyberpunk/digital tone.
If a user asks about a specific product, provide its price (in DH) and details.
If a user asks about tournaments, list upcoming ones and mention the registration requirements.
Use your advanced reasoning capabilities (Thinking Mode) to answer complex queries, compare items, or analyze user needs deeply.
When thinking, consider multiple angles before providing the final recommendation.`;

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, contextData } = await request.json();

    if (!process.env.API_KEY) {
      throw new Error("Server API configuration missing.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const contextStr = `
      Current Date: ${new Date().toISOString()}
      Products Catalog: ${JSON.stringify((contextData?.products || []).slice(0, 50))}
      Active Tournaments: ${JSON.stringify(contextData?.tournaments || [])}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: `System Context: ${contextStr}\n\nUser Query: ${message}` }]
        }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        thinkingConfig: { thinkingBudget: 32768 } // 32k token thinking budget
      }
    });

    const text = response.text || "No response generated.";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process AI request" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}