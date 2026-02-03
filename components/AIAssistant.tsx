import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot, Minimize2, Loader2, BrainCircuit, AlertTriangle, WifiOff } from 'lucide-react';
// import { GoogleGenAI } from "@google/genai"; // Dynamic import used instead
import { supabase } from '../lib/supabase';

const SYSTEM_PROMPT = `You are Moon Night's advanced AI Fouad. 
Your goal is to help users navigate the digital shop, find products (Accounts, Keys, Services), and get information about Tournaments.
You have access to the current product catalog and tournament list in the context.
Be helpful, concise, and maintain a cool, cyberpunk/digital tone.
If a user asks about a specific product, provide its price (in DH) and details.
If a user asks about tournaments, list upcoming ones and mention the registration requirements.
Use your advanced reasoning capabilities (Thinking Mode) to answer complex queries, compare items, or analyze user needs deeply.`;

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

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isThinking]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setIsThinking(true);

    try {
      // Safe access to API Key for browser environments
      const apiKey = (window as any).process?.env?.API_KEY || (import.meta as any).env?.VITE_GOOGLE_API_KEY;
      
      if (!apiKey) {
        throw new Error("Missing API Key. Please add VITE_GOOGLE_API_KEY to your environment variables.");
      }

      // DYNAMIC IMPORT with Error Handling and Fallbacks
      let GoogleGenAI;
      try {
        const module = await import("@google/genai");
        // Robust check for different CDN export structures
        GoogleGenAI = module.GoogleGenAI || module.default || module;
      } catch (err) {
        throw new Error("Failed to load Fouad AI Brain. Network connection blocked the library download.");
      }

      if (!GoogleGenAI) {
        throw new Error("AI Library loaded but the Class was not found.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const contextStr = `
        Current Date: ${new Date().toISOString()}
        Products Catalog: ${JSON.stringify(contextData.products.slice(0, 50))}
        Active Tournaments: ${JSON.stringify(contextData.tournaments)}
      `;

      // 'contents' must be an Array for Gemini API
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          {
            role: 'user',
            parts: [{ text: `System Context: ${contextStr}\n\nUser Query: ${userMsg}` }]
          }
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          // Enabling Thinking Mode with max budget
          thinkingConfig: { thinkingBudget: 32768 } 
          // Do NOT set maxOutputTokens when thinkingBudget is high, as instructed
        }
      });

      const responseText = response.text || "No text returned from the model.";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);

    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMsg = error.message || "Unknown connection error.";
      
      // Improve error messages for user
      if (errorMsg.includes("Failed to fetch") || errorMsg.includes("Network")) {
         errorMsg = "Network Error: Cannot reach AI servers. Please check your connection.";
      }
      if (errorMsg.includes("400")) errorMsg = "Bad Request: The model rejected the data format.";
      if (errorMsg.includes("401")) errorMsg = "Unauthorized: Invalid API Key.";
      if (errorMsg.includes("403")) errorMsg = "Access Denied: Your API Key location/quota is restricted.";
      
      setMessages(prev => [...prev, { role: 'error', text: errorMsg }]);
    } finally {
      setLoading(false);
      setIsThinking(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl shadow-blue-600/40 hover:scale-110 transition-all duration-300 group border border-white/10"
      >
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] flex flex-col glass rounded-[2rem] border border-blue-500/30 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-black text-white text-sm">Fouad AI</h3>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Thinking 3.0 Active
            </p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
          <Minimize2 size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/50">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4 opacity-60">
            <Sparkles size={32} className="mx-auto text-blue-500" />
            <p className="text-xs font-medium text-slate-400 px-8">
              "I am Fouad AI. I can analyze shop inventory, compare prices, or help with tournament info."
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 text-sm font-medium rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : msg.role === 'error'
                ? 'bg-red-500/10 border border-red-500/50 text-red-200 rounded-tl-sm'
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
            }`}>
              {msg.role === 'error' && <div className="flex items-center gap-2 mb-1 text-red-400 font-bold uppercase text-[10px] tracking-widest"><AlertTriangle size={12}/> Connection Error</div>}
              {msg.text}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-slate-900/80 border border-blue-500/30 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
              <BrainCircuit size={18} className="text-blue-400 animate-pulse" />
              <div className="space-y-1">
                <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest block">Deep Reasoning...</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-md flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Fouad..."
          className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || loading}
          className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}