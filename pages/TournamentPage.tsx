
import React from 'react';
import { Trophy, Calendar, Users, Star, ArrowRight } from 'lucide-react';
import { Tournament } from '../types';

const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 't1',
    title: 'Valorant Clash: Moon Edition',
    description: '5v5 competitive play for all skill levels. Join with your team and compete for the top prize.',
    role_required: 'Verified Member',
    prize_pool: '5000 DH + 10k Discord Points',
    status: 'upcoming',
    date: '2023-12-15 18:00',
  },
  {
    id: 't2',
    title: 'League of Legends 1v1 Mid',
    description: 'A fast-paced showdown on the Howling Abyss. Prove you are the king of mid lane.',
    role_required: 'Bronze I+',
    prize_pool: '2000 DH',
    status: 'ongoing',
    date: '2023-12-05 20:00',
  },
  {
    id: 't3',
    title: 'CS2 Wingman Monthly',
    description: 'Partner up and conquer the tactical maps of CS2.',
    role_required: 'Active Member',
    prize_pool: '3000 DH',
    status: 'finished',
    date: '2023-11-20 19:00',
  }
];

export default function TournamentPage() {
  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ongoing': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'finished': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-12">
      <div className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Competitive Arena</h1>
        <p className="text-slate-500 text-lg leading-relaxed">
          The heart of Moon Night. Join our weekly tournaments, win big prizes, and gain exclusive Discord roles and bragging rights.
        </p>
      </div>

      <div className="grid gap-8">
        {MOCK_TOURNAMENTS.map(tournament => (
          <div key={tournament.id} className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 border border-slate-800 hover:border-blue-500/20 transition-all group">
            <div className="md:w-1/3 aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden">
              <img 
                src={`https://picsum.photos/seed/${tournament.id}/600/450`} 
                alt={tournament.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            
            <div className="flex-grow space-y-6 flex flex-col">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(tournament.status)}`}>
                  {tournament.status}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <Calendar size={14} /> {tournament.date}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold">{tournament.title}</h3>
                <p className="text-slate-400 leading-relaxed">{tournament.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Role Required</span>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Users size={16} className="text-blue-400" /> {tournament.role_required}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Prize Pool</span>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Star size={16} className="text-yellow-400" /> {tournament.prize_pool}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button 
                  disabled={tournament.status === 'finished'}
                  className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    tournament.status === 'finished' 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                  }`}
                >
                  {tournament.status === 'finished' ? 'Tournament Ended' : 'Join Tournament'} 
                  {tournament.status !== 'finished' && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
