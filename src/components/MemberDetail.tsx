import React from 'react';
import { ArrowLeft, Edit3, Trash2, ShieldAlert } from 'lucide-react';
import { Member, UserAccount } from '../types';

interface MemberDetailProps {
  currentUser: UserAccount | null;
  member: Member | null;
  onPageChange: (page: string) => void;
  onEditMember: (m: Member) => void;
  onDeleteMember: (id: string) => Promise<void>;
}

export const MemberDetail: React.FC<MemberDetailProps> = ({
  currentUser,
  member,
  onPageChange,
  onEditMember,
  onDeleteMember
}) => {
  if (!member) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500 text-sm">No member selected.</p>
        <button onClick={() => onPageChange('members')} className="mt-3 btn btn-navy btn-sm">
          Return to List
        </button>
      </div>
    );
  }

  const role = currentUser?.role || 'user';
  const canEdit = role === 'admin' || role === 'superadmin';
  const nameInitials = member.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // Format Helper
  const row = (label: string, value?: string) => {
    if (!value) return null;
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200/50 shadow-xs">
        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-0.5">
          {label}
        </span>
        <span className="text-slate-800 font-extrabold text-sm block">
          {value}
        </span>
      </div>
    );
  };

  const handleDelete = async () => {
    await onDeleteMember(member.id);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0e1c5a] to-[#1a2a6c] rounded-2xl p-6 shadow-md border-b-[3px] border-[#c9972d] text-white flex flex-col sm:flex-row items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/10 text-[#f5c842] flex items-center justify-center font-black text-xl border-2 border-[#c9972d] flex-shrink-0 select-none">
          {nameInitials}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-black text-[#f5c842]">
            {member.title ? member.title + ' ' : ''}{member.name}
          </h1>
          <p className="text-white/60 text-xs mt-1">
            {member.mid || 'No Membership MID'} {member.bial ? `· Bial ${member.bial}` : ''}
          </p>
        </div>
      </div>

      {/* Action list */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onPageChange('members')}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-[#1a2a6c] font-bold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        {canEdit && (
          <>
            <button
              onClick={() => {
                onEditMember(member);
                onPageChange('form');
              }}
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete Record</span>
            </button>
          </>
        )}
      </div>

      {/* Detail Block Sections */}
      <div>
        <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-widest mb-3 border-l-3 border-[#c9972d] pl-2">
          Personal Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {row('Bial No. / Sector', member.bial)}
          {row('Full Name', member.name)}
          {row('Phone Number', member.phone)}
          {row('Date of Birth', member.dob)}
          {row('Place of Birth', member.pob)}
          {row('Parents (Nu leh Pa Min)', member.parents)}
          {row('Address', member.addr)}
        </div>
      </div>

      {/* Spiritual details */}
      {(member.baptDate || member.baptMode || member.tang || member.mtype || member.ordained) && (
        <div>
          <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-widest mb-3 border-l-3 border-[#c9972d] pl-2">
            Spiritual &amp; Membership
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {row('Baptism Date', member.baptDate)}
            {row('Baptism Mode', member.baptMode)}
            {row('Tangsaktu (Officiating Pastor)', member.tang)}
            {row('Membership Type', member.mtype)}
            {row('Ordained Date', member.ordained)}
          </div>
        </div>
      )}

      {/* Marriage Details */}
      {(member.rel || member.wed || member.kitenni || member.kitennamun || member.kite || member.wm || member.wf) && (
        <div>
          <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-widest mb-3 border-l-3 border-[#c9972d] pl-2">
            Marriage &amp; Family
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {row('Relationship', member.rel)}
            {row('Pasal/Zi Neih Ni', member.wed)}
            {row('Kitenni (Wedding Date)', member.kitenni)}
            {row('Kitennamun (Wedding Place)', member.kitennamun)}
            {row('Kitengsaktu (Officiating Pastor)', member.kite)}
            {row('Pasal Theihpihtu (Male Witness)', member.wm)}
            {row('Numei Theihpihtu (Female Witness)', member.wf)}
          </div>
        </div>
      )}

      {/* Administrative Details */}
      {(member.trans || member.death || member.thil) && (
        <div>
          <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-widest mb-3 border-l-3 border-[#c9972d] pl-2">
            Administration &amp; Record status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {row('Pemlutni / Potni (Transfer Date)', member.trans)}
            {row('Sihni (Deceased Date)', member.death)}
            {row('Thilpiak Option', member.thil)}
          </div>
        </div>
      )}
    </div>
  );
};
