import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  CheckCircle2, 
  Activity, 
  MapPin, 
  Trash2, 
  Search, 
  RefreshCw,
  XCircle
} from 'lucide-react';
import { Member, UserAccount } from '../types';

interface ReportsProps {
  currentUser: UserAccount | null;
  members: Member[];
  thilOptions: string[];
  onViewMember: (id: string) => void;
  onDeleteMember: (id: string) => Promise<void>;
  onRefresh: () => void;
  onMetricClick?: (filter: 'all' | 'baptized' | 'active' | 'bial') => void;
}

export const Reports: React.FC<ReportsProps> = ({
  currentUser,
  members,
  thilOptions,
  onViewMember,
  onDeleteMember,
  onRefresh,
  onMetricClick
}) => {
  const role = currentUser?.role || 'user';
  const canDelete = role === 'admin' || role === 'superadmin';

  // Filters
  const [q, setQ] = useState('');
  const [mtype, setMtype] = useState('');
  const [bial, setBial] = useState('');
  const [thil, setThil] = useState('');
  const [baptStatus, setBaptStatus] = useState('');
  const [dobFrom, setDobFrom] = useState('');
  const [dobTo, setDobTo] = useState('');

  // Local filtered list
  const [filtered, setFiltered] = useState<Member[]>([]);

  useEffect(() => {
    const list = members.filter((m) => {
      if (q) {
        const query = q.toLowerCase();
        const match =
          (m.name || '').toLowerCase().includes(query) ||
          (m.mid || '').toLowerCase().includes(query) ||
          (m.bial || '').toLowerCase().includes(query) ||
          (m.phone || '').toLowerCase().includes(query);
        if (!match) return false;
      }
      if (mtype && m.mtype !== mtype) return false;
      if (bial && !(m.bial || '').toLowerCase().includes(bial.toLowerCase())) return false;
      if (thil && m.thil !== thil) return false;
      if (baptStatus === 'y' && !m.baptDate) return false;
      if (baptStatus === 'n' && m.baptDate) return false;
      if (dobFrom && m.dob && m.dob < dobFrom) return false;
      if (dobTo && m.dob && m.dob > dobTo) return false;
      return true;
    });

    setFiltered(list);
  }, [members, q, mtype, bial, thil, baptStatus, dobFrom, dobTo]);

  const handleClearFilters = () => {
    setQ('');
    setMtype('');
    setBial('');
    setThil('');
    setBaptStatus('');
    setDobFrom('');
    setDobTo('');
  };

  // KPI calculations
  const total = members.length;
  const baptized = members.filter((m) => m.baptDate).length;
  const active = members.filter((m) => !m.trans && !m.death).length;
  const transferred = members.filter((m) => m.trans).length;
  const deceased = members.filter((m) => m.death).length;
  const uniqueBials = Array.from(new Set(members.map((m) => m.bial).filter(Boolean))).length;
  const pmCount = members.filter((m) => m.mtype === 'PM').length;
  const jcmFcmDisplay = `${members.filter((m) => m.mtype === 'JCM').length} / ${members.filter((m) => m.mtype === 'FCM').length}`;

  const kpis = [
    { title: 'Total Registered', val: total, color: 'text-[#1a2a6c]', bg: 'bg-blue-50', filterType: 'all' as const },
    { title: 'Baptized', val: baptized, color: 'text-emerald-700', bg: 'bg-emerald-50', filterType: 'baptized' as const },
    { title: 'Active Congregation', val: active, color: 'text-[#c9972d]', bg: 'bg-amber-50', filterType: 'active' as const },
    { title: 'Transferred Out', val: transferred, color: 'text-[#1a2a6c]', bg: 'bg-orange-50' },
    { title: 'Deceased', val: deceased, color: 'text-red-700', bg: 'bg-red-50' },
    { title: 'Active Bial Sectors', val: uniqueBials, color: 'text-indigo-700', bg: 'bg-indigo-50', filterType: 'bial' as const },
    { title: 'PM Level Strength', val: pmCount, color: 'text-[#1a2a6c]', bg: 'bg-blue-50' },
    { title: 'JCM / FCM Ratio', val: jcmFcmDisplay, color: 'text-purple-700', bg: 'bg-purple-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[#1a2a6c] text-xl font-bold tracking-tight">📊 EBCC Lailam Veng Saptuam Record</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Key system metrics, filterable church profiles and administrative records.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Section Cards */}
      <div className="space-y-3">
        <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-widest border-l-3 border-[#c9972d] pl-2 mb-2">
          Dashboard
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map((k, idx) => {
            const isClickable = !!k.filterType && !!onMetricClick;
            return (
              <div 
                key={idx} 
                onClick={() => {
                  if (isClickable && k.filterType) {
                    onMetricClick(k.filterType);
                  }
                }}
                className={`bg-white rounded-xl p-4 border border-slate-200/40 shadow-xs text-center flex flex-col justify-between transition-all ${
                  isClickable 
                    ? 'cursor-pointer hover:shadow-md hover:border-[#c9972d]/40 active:scale-[0.98]' 
                    : ''
                }`}
              >
                <span className={`text-[20px] font-black ${k.color}`}>
                  {k.val}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  {k.title}
                  {isClickable && <span className="text-[9px] text-[#c9972d] block font-bold mt-0.5">Click to view Details</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Options */}
      <div className="space-y-3">
        <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-widest border-l-3 border-[#c9972d] pl-2 mb-2">
          Interactive Search Filters
        </h2>

        <div className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-xs space-y-4">
          {/* Main search text */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search keyword on Name, MID, Bial and phone..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs shadow-xs focus:outline-none focus:border-[#1a2a6c] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Membership Type */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Membership Type
              </label>
              <select
                value={mtype}
                onChange={(e) => setMtype(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#1a2a6c]"
              >
                <option value="">All Types</option>
                <option value="PM">PM</option>
                <option value="JCM">JCM</option>
                <option value="FCM">FCM</option>
              </select>
            </div>

            {/* Bial input */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Bial No. / Sector
              </label>
              <input
                type="text"
                value={bial}
                onChange={(e) => setBial(e.target.value)}
                placeholder="Any"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            {/* Thilpiak */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Thilpiak Option
              </label>
              <select
                value={thil}
                onChange={(e) => setThil(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#1a2a6c]"
              >
                <option value="">All options</option>
                {thilOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Baptism recorded */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Recorded Baptism
              </label>
              <select
                value={baptStatus}
                onChange={(e) => setBaptStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#1a2a6c]"
              >
                <option value="">All statuses</option>
                <option value="y">Recorded</option>
                <option value="n">Not Recorded</option>
              </select>
            </div>

            {/* DOB range from */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Date of Birth From
              </label>
              <input
                type="date"
                value={dobFrom}
                onChange={(e) => setDobFrom(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            {/* DOB range to */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Date of Birth To
              </label>
              <input
                type="date"
                value={dobTo}
                onChange={(e) => setDobTo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <XCircle size={14} />
              <span>Reset Active Filters</span>
            </button>
            <span className="text-slate-400 text-xs font-semibold">
              Matches {filtered.length} member{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Query output database list */}
      <div className="space-y-3">
        <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-widest border-l-3 border-[#c9972d] pl-2 mb-2">
          Filtered Registry Results Table
        </h2>

        <div className="bg-white rounded-xl border border-slate-200/50 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 text-slate-800 font-extrabold uppercase border-b border-slate-200/60">
                  <th className="p-3">ID Code</th>
                  <th className="p-3">Min (Name)</th>
                  <th className="p-3">Bial No</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Thilpiak</th>
                  <th className="p-3 text-center">Baptisma</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      No matching registered church profiles.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">{m.mid || '—'}</td>
                      <td className="p-3 font-bold text-[#1a2a6c]">
                        {m.title ? m.title + ' ' : ''}{m.name}
                      </td>
                      <td className="p-3">{m.bial || '—'}</td>
                      <td className="p-3">
                        {m.mtype ? (
                          <span className="bg-blue-50 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded">
                            {m.mtype}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-slate-500">{m.phone || '—'}</td>
                      <td className="p-3">{m.thil || '—'}</td>
                      <td className="p-3 text-center text-sm">{m.baptDate ? '✅' : '—'}</td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onViewMember(m.id)}
                          className="px-2.5 py-1 bg-[#1a2a6c] hover:bg-[#2d4aaa] text-white font-bold text-[10px] rounded-lg cursor-pointer"
                        >
                          View
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => onDeleteMember(m.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 size={14} className="inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
