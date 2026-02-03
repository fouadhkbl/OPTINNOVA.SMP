import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

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
    const { message, userId } = await request.json();

    // 1. Validate API Key
    if (!process.env.API_KEY) {
      throw new Error("Server API configuration missing.");
    }

    // 2. Initialize Supabase (Backend)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    // Prefer Service Role Key for backend operations to bypass RLS when inserting chat logs
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Database configuration missing.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Fetch Context Data from Supabase
    // We fetch a limited set to keep token usage optimized
    const { data: products } = await supabase
      .from('products')
      .select('name, price_dh, category, type, stock, description')
      .limit(50);

    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('title, prize_pool, status, tournament_date, role_required')
      .eq('status', 'upcoming');

    const contextStr = `
      Current Date: ${new Date().toISOString()}
      Products Catalog: ${JSON.stringify(products || [])}
      Active Tournaments: ${JSON.stringify(tournaments || [])}
    `;

    // 4. Save User Message (if user logged in)
    if (userId) {
      await supabase.from('ai_chats').insert({
        user_id: userId,
        role: 'user',
        content: message
      });
    }

    // 5. Generate AI Response
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    const text = response.text || "I'm processing that, but received no text response.";

    // 6. Save AI Response (if user logged in)
    if (userId) {
      await supabase.from('ai_chats').insert({
        user_id: userId,
        role: 'model',
        content: text
      });
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("AI Handler Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process AI request" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}