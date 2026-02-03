import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot, Minimize2, Loader2, BrainCircuit, AlertTriangle, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GoogleGenAI from "@google/genai"; // ✅ Fixed import

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
      const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GOOGLE_API_KEY || (window as any).process?.env?.API_KEY;
      if (!apiKey) throw new Error("Missing API Key. Please add VITE_GOOGLE_API_KEY to your environment variables.");

      const ai = new GoogleGenAI({ apiKey }); // ✅ Correct usage

      const contextStr = `
        Current Date: ${new Date().toISOString()}
        Products Catalog: ${JSON.stringify(contextData.products.slice(0, 50))}
        Active Tournaments: ${JSON.stringify(contextData.tournaments)}
      `;

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
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });

      const responseText = response.text || "No text returned from the model.";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);

    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMsg = error.message || "Unknown connection error.";
      if (errorMsg.includes("Failed to fetch") || errorMsg.includes("Network")) errorMsg = "Network Error: Cannot reach AI servers. Please check your connection.";
      if (errorMsg.includes("400")) errorMsg = "Bad Request: The model rejected the data format.";
      if (errorMsg.includes("401")) errorMsg = "Unauthorized: Invalid API Key.";
      if (errorMsg.includes("403")) errorMsg = "Access Denied: Your API Key location/quota is restricted.";
      if (errorMsg.includes("ETARGET")) errorMsg = "Deployment Error: Version mismatch. Please refresh.";

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg relative overflow-hidden group">
            <Bot size={20} className="relative z-10" />
            <div className="absolute inset-0 bg-white/20 blur-lg group-hover:animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-black text-white text-sm">Fouad AI</h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-purple-500 animate-ping' : 'bg-green-500'}`}></span>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                {isThinking ? 'Thinking Mode' : 'Online'}
              </p>
            </div>
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
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce duration-[3s]">
              <Sparkles size={24} className="text-blue-500" />
            </div>
            <p className="text-xs font-medium text-slate-400 px-8 leading-relaxed">
              "I am Fouad AI. Powered by <span className="text-blue-400 font-bold">Gemini 3.0</span>. I can analyze shop inventory, compare prices, or help with tournament info using deep reasoning."
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 text-sm font-medium rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-600/10' 
                : msg.role === 'error'
                ? 'bg-red-500/10 border border-red-500/50 text-red-200 rounded-tl-sm'
                : 'bg-slate-800/80 backdrop-blur-sm text-slate-200 border border-slate-700 rounded-tl-sm shadow-lg'
            }`}>
              {msg.role === 'error' && <div className="flex items-center gap-2 mb-2 text-red-400 font-bold uppercase text-[10px] tracking-widest border-b border-red-500/20 pb-1"><AlertTriangle size={12}/> Connection Error</div>}
              {msg.text}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-4 shadow-xl shadow-blue-900/20">
              <div className="relative">
                <BrainCircuit size={20} className="text-purple-400 animate-pulse" />
                <div className="absolute inset-0 bg-purple-500/20 blur-lg animate-pulse"></div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-purple-300 font-black uppercase tracking-widest flex items-center gap-2">
                  Deep Reasoning <Lightbulb size={10} className="fill-purple-300" />
                </span>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
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
