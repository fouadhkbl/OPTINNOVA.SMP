
import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Star, ArrowRight, Loader2, Sparkles, Gamepad2, Target, ChevronRight, X, CheckCircle } from 'lucide-react';
import { Tournament, TournamentRegistration } from '../types';
import { supabase } from '../lib/supabase';

type TournamentFilter = 'all' | 'open' | 'live' | 'past';

export default function TournamentPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TournamentFilter>('all');
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchTournaments();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
      if (data.user) fetchRegistrations(data.user.id);
    });
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tournaments').select('*').order('tournament_date', { ascending: false });
    if (!error && data) {
      setTournaments(data.map(t => ({ ...t, date: t.tournament_date })));
    }
    setLoading(false);
  };

  const fetchRegistrations = async (userId: string) => {
    const { data } = await supabase.from('tournament_registrations').select('*').eq('user_id', userId);
    if(data) setRegistrations(data);
  };

  const getFilteredTournaments = () => {
    if (activeFilter === 'all') return tournaments;
    if (activeFilter === 'past') return tournaments.filter(t => t.status === 'finished');
    if (activeFilter === 'open') return tournaments.filter(t => t.status === 'upcoming');
    if (activeFilter === 'live') return tournaments.filter(t => t.status === 'ongoing');
    return tournaments;
  };

  const handleRegisterClick = (t: Tournament) => {
    if(!currentUser) {
       alert("Please login to register.");
       return;
    }
    const existing = registrations.find(r => r.tournament_id === t.id);
    if (existing) {
       alert(`You are already registered! Status: ${existing.status}`);
       return;
    }
    setFormData({});
    setSelectedTournament(t);
  };

  const handleSubmitRegistration = async () => {
    if (!selectedTournament || !currentUser) return;
    
    // Validate fields
    const fields = selectedTournament.registration_fields || [];
    for (const f of fields) {
      if (f.required && !formData[f.name]) {
        alert(`${f.name} is required!`);
        return;
      }
    }

    setSubmitting(true);
    const { error } = await supabase.from('tournament_registrations').insert({
       tournament_id: selectedTournament.id,
       user_id: currentUser.id,
       submitted_data: formData,
       status: 'pending'
    });

    if (error) {
       alert("Registration failed: " + error.message);
    } else {
       alert("Registration submitted successfully! Check your profile for updates.");
       setSelectedTournament(null);
       fetchRegistrations(currentUser.id);
    }
    setSubmitting(false);
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
            {getFilteredTournaments().map(tournament => {
              const userReg = registrations.find(r => r.tournament_id === tournament.id);
              
              return (
              <div key={tournament.id} className="glass rounded-[2rem] overflow-hidden border border-slate-800/50 hover:border-blue-500/30 transition-all duration-500 group flex flex-col bg-slate-900/40">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${tournament.id}/800/450`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={tournament.title}
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
                    <Gamepad2 size={12} className="text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{tournament.role_required}</span>
                  </div>
                  {userReg && (
                    <div className={`absolute bottom-4 right-4 px-3 py-1.5 backdrop-blur-sm rounded-full border text-[10px] font-black uppercase tracking-widest ${
                       userReg.status === 'approved' ? 'bg-green-500/80 border-green-400 text-white' : 
                       userReg.status === 'rejected' ? 'bg-red-500/80 border-red-400 text-white' : 
                       'bg-yellow-500/80 border-yellow-400 text-white'
                    }`}>
                       {userReg.status}
                    </div>
                  )}
                </div>

                <div className="p-8 space-y-6 flex-grow">
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">{tournament.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 font-medium">
                    {tournament.description}
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-slate-500" />
                      <span className="text-sm font-bold text-slate-500">
                        {new Date(tournament.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-800/50 flex items-center justify-between bg-slate-900/20">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-500/10 rounded-lg text-yellow-500">
                      <Trophy size={18} />
                    </div>
                    <span className="text-lg font-black text-yellow-500">{tournament.prize_pool}</span>
                  </div>
                  
                  {tournament.status === 'upcoming' && !userReg ? (
                     <button 
                       onClick={() => handleRegisterClick(tournament)}
                       className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                     >
                       Register <ChevronRight size={14} />
                     </button>
                  ) : (
                     <button disabled className="text-slate-600 text-xs font-black uppercase tracking-widest cursor-not-allowed">
                        {userReg ? 'Registered' : 'Closed'}
                     </button>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {selectedTournament && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedTournament(null)}></div>
            <div className="relative glass w-full max-w-md rounded-[2.5rem] border border-slate-700 p-8 space-y-6 animate-in zoom-in-95 duration-300">
               <button onClick={() => setSelectedTournament(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20} /></button>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">Register for Event</h3>
                  <p className="text-slate-500 text-sm">Please provide the required details below.</p>
               </div>
               
               <div className="space-y-4">
                  {(selectedTournament.registration_fields || []).map((field, i) => (
                     <div key={i} className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">{field.name} {field.required && '*'}</label>
                        <input 
                           type={field.type} 
                           className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none"
                           placeholder={`Enter ${field.name}`}
                           onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                        />
                     </div>
                  ))}
                  {(selectedTournament.registration_fields || []).length === 0 && (
                     <p className="text-center text-sm text-slate-500 italic py-4">No additional details required. Click Submit to confirm.</p>
                  )}
               </div>

               <button 
                  onClick={handleSubmitRegistration}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
               >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Submit Registration'}
               </button>
            </div>
         </div>
      )}
    </div>
  );
}
