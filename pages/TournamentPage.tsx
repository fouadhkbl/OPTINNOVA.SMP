
import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Star, ArrowRight, Loader2, Sparkles, Gamepad2, Target, ChevronRight } from 'lucide-react';
import { Tournament } from '../types';
import { supabase } from '../lib/supabase';

type TournamentFilter = 'all' | 'open' | 'live' | 'past';

export default function TournamentPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TournamentFilter>('all');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tournaments').select('*').order('tournament_date', { ascending: false });
    if (!error && data) {
      setTournaments(data.map(t => ({ ...t, date: t.tournament_date })));
    }
    setLoading(false);
  };

  const getFilteredTournaments = () => {
    if (activeFilter === 'all') return tournaments;
    if (activeFilter === 'past') return tournaments.filter(t => t.status === 'finished');
    if (activeFilter === 'open') return tournaments.filter(t => t.status === 'upcoming');
    if (activeFilter === 'live') return tournaments.filter(t => t.status === 'ongoing');
    return tournaments;
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Filter Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-1.5 rounded-2xl shadow-2xl">
          {(['all', 'open', 'live', 'past'] as TournamentFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                activeFilter === filter 
                ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {/* Section Header */}
        <div className="flex items-center gap-4">
          <div className="p-2.5 glass rounded-xl border border-slate-800 text-slate-400">
            <Trophy size={24} />
          </div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">
            {activeFilter === 'past' ? 'Past Tournaments' : 
             activeFilter === 'open' ? 'Open Registrations' :
             activeFilter === 'live' ? 'Live Matches' : 'All Tournaments'}
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <Loader2 className="animate-spin text-blue-500" size={48} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Syncing Arena...</span>
          </div>
        ) : getFilteredTournaments().length === 0 ? (
          <div className="text-center py-24 glass rounded-[2.5rem] border border-dashed border-slate-800 space-y-6 opacity-60">
             <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-slate-700"><Sparkles size={40}/></div>
             <p className="font-black text-slate-600 uppercase tracking-widest text-sm">No events found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getFilteredTournaments().map(tournament => (
              <div key={tournament.id} className="glass rounded-[2rem] overflow-hidden border border-slate-800/50 hover:border-blue-500/30 transition-all duration-500 group flex flex-col bg-slate-900/40">
                {/* Image Section */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${tournament.id}/800/450`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={tournament.title}
                  />
                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
                    <Gamepad2 size={12} className="text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{tournament.role_required}</span>
                  </div>
                  
                  {tournament.status === 'finished' && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/5">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Completed</span>
                    </div>
                  )}
                  {tournament.status === 'ongoing' && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-red-600/80 backdrop-blur-sm rounded-full border border-white/20 animate-pulse">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Now</span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-8 space-y-6 flex-grow">
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">{tournament.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 font-medium">
                    {tournament.description}
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <Users size={16} className="text-blue-500" />
                      <span className="text-sm font-bold text-slate-300">26 Players</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Target size={16} className="text-purple-500" />
                      <span className="text-sm font-bold text-slate-300">Solo / 1v1</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-slate-500" />
                      <span className="text-sm font-bold text-slate-500">
                        {new Date(tournament.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="p-6 border-t border-slate-800/50 flex items-center justify-between bg-slate-900/20">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-500/10 rounded-lg text-yellow-500">
                      <Trophy size={18} />
                    </div>
                    <span className="text-lg font-black text-yellow-500">{tournament.prize_pool}</span>
                  </div>
                  
                  <button 
                    onClick={() => window.open('https://discord.gg/wJUsVzDuXk', '_blank')}
                    className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-400 transition-colors group/view"
                  >
                    View <ChevronRight size={16} className="group-hover/view:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
