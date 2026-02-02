
import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Star, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Tournament } from '../types';
import { supabase } from '../lib/supabase';

export default function TournamentPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tournaments').select('*').order('tournament_date', { ascending: true });
    if (!error && data) {
      setTournaments(data.map(t => ({ ...t, date: t.tournament_date })));
    }
    setLoading(false);
  };

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ongoing': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'finished': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-16 pb-20 animate-in fade-in duration-700">
      <div className="relative overflow-hidden glass rounded-[3rem] p-10 md:p-16 border border-blue-500/10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] -z-10"></div>
        <div className="max-w-3xl space-y-6 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
            <Trophy size={14} className="text-yellow-500" /> The Elite Moon Arena
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">Competitive <span className="gradient-text">Gaming Ecosystem</span></h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
            Where legends are born. Join high-stakes tournaments hosted by Moon Night and compete for massive DH rewards and exclusive digital roles.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
           <Loader2 className="animate-spin text-blue-500" size={48} />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Retrieving Arena Intel...</span>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-24 glass rounded-[2.5rem] border border-dashed border-slate-800 space-y-6 opacity-60">
           <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-slate-700"><Sparkles size={40}/></div>
           <p className="font-black text-slate-600 uppercase tracking-[0.2em] text-sm">The arena is currently quiet. Check back soon for new events!</p>
        </div>
      ) : (
        <div className="grid gap-10">
          {tournaments.map(tournament => (
            <div key={tournament.id} className="glass rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row gap-10 border border-slate-800 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:bg-blue-600/10 transition-colors"></div>
              
              <div className="md:w-[400px] aspect-[16/10] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800/50">
                <img 
                  src={`https://picsum.photos/seed/${tournament.id}/800/500`} 
                  alt={tournament.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100"
                />
              </div>
              
              <div className="flex-grow space-y-8 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-4">
                  <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                  <span className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
                    <Calendar size={14} className="text-blue-500" /> {new Date(tournament.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors">{tournament.title}</h3>
                  <p className="text-slate-400 leading-relaxed font-medium text-lg">{tournament.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">Requirement</span>
                    <div className="flex items-center gap-3 text-slate-200 font-black uppercase text-xs tracking-widest">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10"><Users size={16} /></div> 
                      {tournament.role_required}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">Grand Prize</span>
                    <div className="flex items-center gap-3 text-yellow-500 font-black uppercase text-xs tracking-widest">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/10"><Star size={16} /></div> 
                      {tournament.prize_pool}
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    disabled={tournament.status === 'finished'}
                    onClick={() => window.open('https://discord.gg/wJUsVzDuXk', '_blank')}
                    className={`w-full md:w-auto px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl ${
                      tournament.status === 'finished' 
                      ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    }`}
                  >
                    {tournament.status === 'finished' ? 'Event Concluded' : 'Register via Discord'} 
                    {tournament.status !== 'finished' && <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
