import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot, Minimize2, Loader2, BrainCircuit, AlertTriangle, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GoogleGenAI from "@google/genai"; // ✅ Correct default import

const SYSTEM_PROMPT = `You are Moon Night's advanced AI Fouad. 
Your goal is to help users navigate the digital shop, find products (Accounts, Keys, Services), and get information about Tournaments.
You have access to the current product catalog and tournament list in the context.
Be helpful, concise, and maintain a cool, cyberpunk/digital tone.
If a user asks about a specific product, provide its price (in DH) and details.
If a user asks about tournaments, list upcoming ones and mention the registration requirements.
Use your advanced reasoning capabilities (Thinking Mode) to answer complex queries, compare items, or analyze user needs deeply.
When thinking, consider multiple angles before providing the final recommendation.`;

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model' | 'error', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [contextData, setContextData] = useState<{products: any[], tournaments: any[]}>({ products: [], tournaments: [] });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: products } = await supabase.from('products').select('name, price_dh, category, type, stock, description');
      const { data: tournaments } = await supabase.from('tournaments').select('title, prize_pool, status, tournament_date, role_required');
      setContextData({ products: products || [], tournaments: tournaments || [] });
    };
    fetchData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isOpen, isThinking]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setIsThinking(true);

    try {
      const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GOOGLE_API_KEY;
      if (!apiKey) throw new Error("Missing API Key.");

      const ai = new GoogleGenAI({ apiKey });

      const contextStr = `
        Current Date: ${new Date().toISOString()}
        Products Catalog: ${JSON.stringify(contextData.products.slice(0, 50))}
        Active Tournaments: ${JSON.stringify(contextData.tournaments)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts: [{ text: `System Context: ${contextStr}\n\nUser Query: ${userMsg}` }] }],
        config: { systemInstruction: SYSTEM_PROMPT, thinkingConfig: { thinkingBudget: 32768 } }
      });

      const responseText = response.text || "No text returned from the model.";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'error', text: error.message || "Unknown error." }]);
    } finally {
      setLoading(false);
      setIsThinking(false);
    }
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl shadow-blue-600/40 hover:scale-110 transition-all duration-300 group border border-white/10">
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] flex flex-col glass rounded-[2rem] border border-blue-500/30 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden">
      {/* Header, Chat, Input Areas same as before */}
      {/* ... (rest of your JSX unchanged) */}
      <div ref={messagesEndRef} />
    </div>
  );
}
