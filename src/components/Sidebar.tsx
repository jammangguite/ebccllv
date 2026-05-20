import React from 'react';
import { 
  Home, 
  Search, 
  UserPlus, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { UserAccount } from '../types';

interface SidebarProps {
  currentUser: UserAccount | null;
  activePage: string;
  onPageChange: (page: string) => void;
  syncCount: number;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activePage,
  onPageChange,
  syncCount,
  isOpen,
  onClose,
  onLogout
}) => {
  const role = currentUser?.role || 'user';
  const name = currentUser?.displayName || currentUser?.username || 'User';
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const roleLabels = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    user: 'User',
  };

  const roleColors = {
    superadmin: 'bg-red-600 text-white',
    admin: 'bg-blue-600 text-white',
    user: 'bg-slate-500/20 text-slate-300',
  };

  const handleNavItemClick = (page: string) => {
    onPageChange(page);
    onClose();
  };

  return (
    <>
      {/* Sidebar Overlay for mobile screen */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[400] md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 bg-gradient-to-b from-[#0e1c5a] to-[#1a2a6c] 
        flex flex-col overflow-y-auto overflow-x-hidden z-[500] transition-all duration-200 ease-out
        md:relative
        ${isOpen 
          ? 'translate-x-0 w-60 opacity-100 pointer-events-auto' 
          : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:pointer-events-none'
        }
      `}>
        {/* User Card inside Sidebar */}
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#c9972d] text-[#1a2a6c] flex items-center justify-center font-black text-sm flex-shrink-0 select-none">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm truncate">{name}</div>
            <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-full mt-1 uppercase tracking-wider ${roleColors[role]}`}>
              {roleLabels[role]}
            </span>
          </div>
          <button 
            onClick={onLogout}
            title="Log Out"
            className="text-white/40 hover:text-red-500 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Home Navigation */}
        <div className="px-2 py-3 flex flex-col gap-1">
          <span className="text-white/30 text-[10px] font-extrabold uppercase tracking-widest px-3 mb-1.5">
            Home
          </span>
          <button
            onClick={() => handleNavItemClick('dashboard')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activePage === 'dashboard' 
                ? 'bg-white/15 text-white font-bold' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Home size={16} className="text-[#f5c842]" />
            Home
          </button>
          
          <button
            onClick={() => handleNavItemClick('members')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activePage === 'members' || activePage === 'detail'
                ? 'bg-white/15 text-white font-bold' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Search size={16} className="text-[#f5c842]" />
            Member Search
          </button>
        </div>

        {/* Member Action (Hidden from Plain User) */}
        {role !== 'user' && (
          <div className="px-2 py-1 flex flex-col gap-1">
            <span className="text-white/30 text-[10px] font-extrabold uppercase tracking-widest px-3 mb-1.5">
              Registry Controls
            </span>
            <button
              onClick={() => handleNavItemClick('form')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activePage === 'form' 
                  ? 'bg-white/15 text-white font-bold' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <UserPlus size={16} className="text-[#f5c842]" />
              New Member
            </button>
          </div>
        )}

        {/* Analytics Section */}
        <div className="px-2 py-3 flex flex-col gap-1">
          <span className="text-white/30 text-[10px] font-extrabold uppercase tracking-widest px-3 mb-1.5">
            Saptuam Record
          </span>
          <button
            onClick={() => handleNavItemClick('report')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activePage === 'report' 
                ? 'bg-white/15 text-white font-bold' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BarChart3 size={16} className="text-[#f5c842]" />
            Saptuam Record
          </button>
        </div>

        {/* Administrative Sections (Hidden from User roles) */}
        {role !== 'user' && (
          <div className="px-2 py-1 flex flex-col gap-1">
            <span className="text-white/30 text-[10px] font-extrabold uppercase tracking-widest px-3 mb-1.5">
              Administrative
            </span>
            {role === 'superadmin' && (
              <button
                onClick={() => handleNavItemClick('users')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activePage === 'users' 
                    ? 'bg-white/15 text-white font-bold' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Users size={16} className="text-[#f5c842]" />
                User Profiles
              </button>
            )}
            <button
              onClick={() => handleNavItemClick('settings')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activePage === 'settings' 
                  ? 'bg-white/15 text-white font-bold' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings size={16} className="text-[#f5c842]" />
              <span>App Settings</span>
              {syncCount > 0 && (
                <span className="ml-auto bg-[#c9972d] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {syncCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-white/5 text-center">
          <p className="text-white/25 text-[10px]">
            EBCC Lailam Veng © 2026<br />Offline Registry PWA
          </p>
        </div>
      </aside>
    </>
  );
};
