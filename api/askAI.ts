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

    // 1. Validate API Keys
    const apiKey = process.env.API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

    if (!apiKey) {
      throw new Error("Server API configuration missing (API_KEY).");
    }

    // 2. Initialize Supabase Admin Client
    let supabaseAdmin = null;
    if (supabaseUrl && supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      });
    }

    // 3. Fetch Context
    let contextStr = "Context unavailable";
    if (supabaseAdmin) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('name, price_dh, category, type, stock, description')
        .limit(50);

      const { data: tournaments } = await supabaseAdmin
        .from('tournaments')
        .select('title, prize_pool, status, tournament_date, role_required')
        .eq('status', 'upcoming');

      contextStr = `
        Current Date: ${new Date().toISOString()}
        Products Catalog: ${JSON.stringify(products || [])}
        Active Tournaments: ${JSON.stringify(tournaments || [])}
      `;
    }

    // 4. Save User Message
    if (userId && supabaseAdmin) {
      await supabaseAdmin.from('ai_chats').insert({
        user_id: userId,
        role: 'user',
        content: message
      });
    }

    // 5. Generate AI Response using REST API (Removing SDK Dependency)
    // Using gemini-2.0-flash which is generally stable for REST
    const model = 'gemini-2.0-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `System Context: ${contextStr}\n\nUser Query: ${message}` }]
          }
        ],
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      throw new Error(`Gemini API Error: ${errorData.error?.message || apiResponse.statusText}`);
    }

    const responseJson = await apiResponse.json();
    const text = responseJson.candidates?.[0]?.content?.parts?.[0]?.text || "I'm processing that, but received no text response.";

    // 6. Save AI Response
    if (userId && supabaseAdmin) {
      await supabaseAdmin.from('ai_chats').insert({
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