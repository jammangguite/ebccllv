import React, { useState, useEffect } from 'react';
import { Search, UserPlus2, UserCheck, MapPin } from 'lucide-react';
import { Member, UserAccount } from '../types';

interface MemberListProps {
  currentUser: UserAccount | null;
  members: Member[];
  onPageChange: (page: string) => void;
  onViewMember: (id: string) => void;
  onOpenAddMember: () => void;
  filterType?: 'all' | 'baptized' | 'active' | 'bial';
  onFilterTypeChange?: (filter: 'all' | 'baptized' | 'active' | 'bial') => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  currentUser,
  members,
  onPageChange,
  onViewMember,
  onOpenAddMember,
  filterType = 'all',
  onFilterTypeChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localFilter, setLocalFilter] = useState<'all' | 'baptized' | 'active' | 'bial'>('all');
  const [selectedBial, setSelectedBial] = useState<string>('');

  useEffect(() => {
    if (filterType) {
      setLocalFilter(filterType);
    }
  }, [filterType]);

  const role = currentUser?.role || 'user';
  const canEdit = role === 'admin' || role === 'superadmin';

  // Get list of unique Bials for Bial Sectors filter tab
  const uniqueBialsList = Array.from(
    new Set(members.map((m) => m.bial).filter(Boolean))
  ).sort() as string[];

  // Filter members on status tab + searchTerm (name, membership id, bial, phone)
  const filtered = members.filter((m) => {
    // Status pre-filter
    if (localFilter === 'baptized' && !m.baptDate) return false;
    if (localFilter === 'active' && (m.trans || m.death)) return false;
    if (localFilter === 'bial') {
      if (selectedBial && m.bial !== selectedBial) return false;
    }

    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(s) ||
      (m.mid || '').toLowerCase().includes(s) ||
      (m.bial || '').toLowerCase().includes(s) ||
      (m.phone || '').toLowerCase().includes(s)
    );
  });

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  return (
    <div className="space-y-4">
      {/* Header and Add button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[#1a2a6c] text-xl font-extrabold tracking-tight">👥 Member Search</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Query name, Membership ID, Bial sector, or phone number.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              onOpenAddMember();
              onPageChange('form');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1a2a6c] hover:bg-[#2d4aaa] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus2 size={14} />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-200/60 pb-px gap-1 overflow-x-auto select-none no-scrollbar">
        {[
          { id: 'all', label: '🌐 All Registry' },
          { id: 'baptized', label: '💧 Baptized' },
          { id: 'active', label: '⚡ Active' },
          { id: 'bial', label: '📍 Bial Sectors' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              const val = tab.id as any;
              setLocalFilter(val);
              if (onFilterTypeChange) onFilterTypeChange(val);
            }}
            className={`whitespace-nowrap pb-2 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              localFilter === tab.id
                ? 'border-[#1a2a6c] text-[#1a2a6c] font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bial Sector Specific Dropdown Selector */}
      {localFilter === 'bial' && (
        <div className="bg-indigo-50/50 border border-indigo-100/60 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-indigo-900 font-bold">
            <MapPin size={14} className="text-indigo-700" />
            <span>Filter List by Bial Sector:</span>
          </div>
          <select
            value={selectedBial}
            onChange={(e) => setSelectedBial(e.target.value)}
            className="w-full sm:w-64 bg-white border border-indigo-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-[#1a2a6c] text-slate-800 font-semibold"
          >
            <option value="">— Show All Bials —</option>
            {uniqueBialsList.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Styled Search input box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to search name, ID, Bial..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm shadow-xs focus:outline-none focus:border-[#1a2a6c] transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Matching Count Bar */}
      <div className="text-right text-xs text-slate-400 font-semibold px-1">
        Found {filtered.length} matching member{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* List Container */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-200/50 shadow-xs text-slate-400 text-sm">
          No records match your query. Try searching with different terms.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => {
            const initials = getInitials(m.name);
            const isActive = !m.trans && !m.death;
            return (
              <div
                key={m.id}
                onClick={() => onViewMember(m.id)}
                className="bg-white rounded-xl p-4 flex items-center justify-between gap-3 border border-slate-200/40 shadow-xs hover:shadow-md hover:border-slate-300/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-[#1a2a6c] flex items-center justify-center font-extrabold text-xs select-none">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{m.title ? m.title + ' ' : ''}{m.name}</span>
                      {isActive && <UserCheck size={12} className="text-emerald-600 block" title="Active Member" />}
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {m.mid || 'No ID'} {m.bial ? `· Bial ${m.bial}` : ''} {m.phone ? `· ${m.phone}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {m.mtype && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {m.mtype}
                    </span>
                  )}
                  {m.death && (
                    <span className="text-[9px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-md uppercase">
                      Deceased
                    </span>
                  )}
                  {m.trans && !m.death && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md uppercase">
                      Transferred
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
