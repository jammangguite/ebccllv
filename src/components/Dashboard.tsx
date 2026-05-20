import React, { useEffect, useState } from 'react';
import { 
  Users as UsersIcon, 
  CheckCircle2, 
  Activity, 
  MapPin, 
  Plus, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Settings as SettingsIcon
} from 'lucide-react';
import { Member, UserAccount } from '../types';

interface DashboardProps {
  currentUser: UserAccount | null;
  members: Member[];
  onPageChange: (page: string) => void;
  onViewMember: (id: string) => void;
  onOpenAddMember: () => void;
  onMetricClick?: (filter: 'all' | 'baptized' | 'active' | 'bial') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  members,
  onPageChange,
  onViewMember,
  onOpenAddMember,
  onMetricClick
}) => {
  const [greeting, setGreeting] = useState('Welcome');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    setCurrentDate(formatter.format(new Date()));
  }, []);

  const role = currentUser?.role || 'user';
  const name = currentUser?.displayName || currentUser?.username || 'User';

  // Compute stats
  const totalKidsAndAdults = members.length;
  const baptizedCount = members.filter(m => m.baptDate).length;
  const activeCount = members.filter(m => !m.trans && !m.death).length;
  const uniqueBials = Array.from(new Set(members.map(m => m.bial).filter(Boolean))).length;

  // Filter 5 most recently updated records
  const recentMembers = [...members]
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 5);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card styled in solid premium deep blue color scale */}
      <div className="bg-gradient-to-r from-[#0e1c5a] to-[#1a2a6c] rounded-2xl p-6 shadow-md border-b-[3px] border-[#c9972d]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-inner border border-white/25 p-1 shrink-0">
              <img src="/ebc_logo.png" className="w-full h-full object-contain" alt="EBCC Logo" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span className="text-[#f5c842] text-xs font-bold uppercase tracking-widest block mb-1">
                {currentDate}
              </span>
              <h1 className="text-white text-2xl font-extrabold tracking-tight">
                {greeting}, {name}!
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Member Registry and Statistical Directory Dashboard.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs text-white">
            <ShieldCheck size={14} className="text-[#f5c842]" />
            <span>Role Perms: {role.toUpperCase()}</span>
          </div>
        </div>

        {/* Biblical Verse citation */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/70 text-xs italic leading-relaxed">
            "For no one can lay any foundation other than the one already laid, which is Jesus Christ."
          </p>
          <span className="text-[#f5c842] text-[10px] font-bold block mt-1 uppercase tracking-wider">
            1 Corinthian 3:11
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div 
          onClick={() => onMetricClick && onMetricClick('all')}
          className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/50 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-[#1a2a6c]/30 hover:scale-[1.01] transition-all duration-200 active:scale-[0.99] select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Total Registry</span>
            <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
              <UsersIcon size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-[#1a2a6c]">{totalKidsAndAdults}</h3>
            <p className="text-[10px] text-slate-400 mt-1 flex justify-between items-center">
              <span>Total registered names</span>
              <span className="text-[#c9972d] font-bold text-[9px] hover:underline">View All →</span>
            </p>
          </div>
        </div>

        {/* Baptized */}
        <div 
          onClick={() => onMetricClick && onMetricClick('baptized')}
          className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/50 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-emerald-500/30 hover:scale-[1.01] transition-all duration-200 active:scale-[0.99] select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Baptized</span>
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-700">{baptizedCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1 flex justify-between items-center">
              <span>With recorded baptism</span>
              <span className="text-[#c9972d] font-bold text-[9px] hover:underline">View List →</span>
            </p>
          </div>
        </div>

        {/* Active Members */}
        <div 
          onClick={() => onMetricClick && onMetricClick('active')}
          className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/50 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-[#c9972d]/30 hover:scale-[1.01] transition-all duration-200 active:scale-[0.99] select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Active</span>
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-[#c9972d]">{activeCount}</h3>
            <p className="text-[10px] text-slate-400 mt-1 flex justify-between items-center">
              <span>Excl. transferred & deceased</span>
              <span className="text-[#c9972d] font-bold text-[9px] hover:underline">View List →</span>
            </p>
          </div>
        </div>

        {/* Bials */}
        <div 
          onClick={() => onMetricClick && onMetricClick('bial')}
          className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/50 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-indigo-500/30 hover:scale-[1.01] transition-all duration-200 active:scale-[0.99] select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Bial groups</span>
            <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
              <MapPin size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-indigo-700">{uniqueBials || '—'}</h3>
            <p className="text-[10px] text-slate-400 mt-1 flex justify-between items-center">
              <span>Unique active Bial sectors</span>
              <span className="text-[#c9972d] font-bold text-[9px] hover:underline">View Sectors →</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Dashboard Buttons */}
      <div className="flex flex-wrap gap-3">
        {role !== 'user' && (
          <button
            onClick={() => {
              onOpenAddMember();
              onPageChange('form');
            }}
            className="flex-1 min-w-[140px] px-4 py-3 bg-gradient-to-r from-[#00b09b] to-[#96c93d] hover:brightness-105 rounded-xl shadow-xs transition-transform cursor-pointer text-white flex flex-col items-center justify-center gap-1 font-bold text-xs"
          >
            <Plus size={20} className="mb-0.5" />
            New Member
          </button>
        )}

        <button
          onClick={() => onPageChange('report')}
          className="flex-1 min-w-[140px] px-4 py-3 bg-gradient-to-r from-[#11998e] to-[#38ef7d] hover:brightness-105 rounded-xl shadow-xs transition-transform cursor-pointer text-white flex flex-col items-center justify-center gap-1 font-bold text-xs"
        >
          <TrendingUp size={20} className="mb-0.5" />
          Saptuam Record
        </button>

        {role !== 'user' && (
          <button
            onClick={() => onPageChange('settings')}
            className="flex-1 min-w-[140px] px-4 py-3 bg-gradient-to-r from-[#0f2027] to-[#203a43] hover:brightness-105 rounded-xl shadow-xs transition-transform cursor-pointer text-white flex flex-col items-center justify-center gap-1 font-bold text-xs"
          >
            <SettingsIcon size={20} className="mb-0.5" />
            Integrations & Backups
          </button>
        )}
      </div>

      {/* Recent Records list */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-slate-900 font-extrabold text-sm tracking-tight">
            🕐 Recently Modified Members
          </h2>
          <button 
            onClick={() => onPageChange('members')}
            className="text-[#1a2a6c] hover:text-[#2d4aaa] text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>See All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentMembers.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No member profiles on file yet. Tap "New Member" to start.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentMembers.map((m) => {
              const initials = getInitials(m.name);
              return (
                <div 
                  key={m.id}
                  onClick={() => onViewMember(m.id)}
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-[#1a2a6c] flex items-center justify-center font-bold text-xs select-none">
                      {initials}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{m.title ? m.title + ' ' : ''}{m.name}</div>
                      <div className="text-slate-400 text-xs">
                        {m.mid || 'No ID'} {m.bial ? `· Bial ${m.bial}` : ''}
                      </div>
                    </div>
                  </div>
                  {m.mtype && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {m.mtype}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
