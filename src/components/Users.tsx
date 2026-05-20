import React from 'react';
import { User, Trash2, Key, Edit, ShieldAlert } from 'lucide-react';
import { UserAccount } from '../types';

interface UsersProps {
  currentUser: UserAccount | null;
  users: UserAccount[];
  onOpenAddUser: () => void;
  onOpenEditUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
}

export const Users: React.FC<UsersProps> = ({
  currentUser,
  users,
  onOpenAddUser,
  onOpenEditUser,
  onDeleteUser
}) => {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const roleColors = {
    superadmin: 'bg-red-50 text-red-600 border border-red-200',
    admin: 'bg-blue-50 text-blue-600 border border-blue-200',
    user: 'bg-slate-50 text-slate-600 border border-slate-200',
  };

  const roleLabels = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    user: 'User / Guest',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[#1a2a6c] text-xl font-bold tracking-tight">👤 User Management</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Add and manage operator accounts, role access control and passwords.
          </p>
        </div>
        <button
          onClick={onOpenAddUser}
          className="flex items-center gap-1 bg-[#1a2a6c] hover:bg-[#2d4aaa] text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <User size={14} />
          <span>Add User Account</span>
        </button>
      </div>

      {/* User listing */}
      <div className="space-y-2.5">
        {users.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-slate-400 text-sm border border-slate-200">
            No local operator accounts. Seeding standard admin...
          </div>
        ) : (
          users.map((u) => {
            const initials = getInitials(u.displayName || u.username);
            const isSelf = u.id === currentUser?.id;
            
            return (
              <div 
                key={u.id}
                className="bg-white rounded-xl p-4 border border-slate-200/40 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-[#1a2a6c] flex items-center justify-center font-extrabold text-xs select-none">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span>{u.displayName || u.username}</span>
                      {isSelf && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">
                          you
                        </span>
                      )}
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
                      <span>@{u.username}</span>
                      <span>·</span>
                      <span className="font-bold">{roleLabels[u.role] || u.role}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {u.role === 'superadmin' ? (
                    <span 
                      title="Super-admin account is structurally protected from modification." 
                      className="p-1.5 text-red-600 block"
                    >
                      <ShieldAlert size={16} />
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => onOpenEditUser(u.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit User Profile"
                      >
                        <Edit size={14} />
                      </button>
                      
                      {!isSelf && (
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Delete User Account"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
