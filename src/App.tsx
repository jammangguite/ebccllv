import React, { useEffect, useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MemberList } from './components/MemberList';
import { MemberDetail } from './components/MemberDetail';
import { MemberForm } from './components/MemberForm';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Users } from './components/Users';
import { 
  initDefaultUser, 
  getSessionUser, 
  saveSessionUser, 
  loginUser, 
  registerUserAccount, 
  removeUserAccount 
} from './lib/auth';
import { 
  getAllRecords, 
  putRecord, 
  deleteRecord, 
  getSetting, 
  setSetting, 
  clearStore 
} from './lib/db';
import { Member, UserAccount, SyncOp } from './types';
import { 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Menu, 
  Download, 
  Save, 
  Lock,
  BookOpen,
  X,
  Edit3,
  Check,
  Briefcase
} from 'lucide-react';

// Direct Sheets & Google Authentication Helpers
import { 
  initGoogleAuth, 
  signInWithGoogle, 
  logoutGoogle 
} from './lib/googleAuth';
import { 
  ensureTabAndHeaders, 
  pullSheetData, 
  batchSyncToSheet, 
  upsertMemberToSheet, 
  deleteMemberFromSheet 
} from './lib/sheets';

// Firebase Firestore Integration Helper imports
import {
  testFirestoreConnection,
  fetchMembersFromFirestore,
  upsertMemberToFirestore,
  deleteMemberFromFirestore,
  batchSyncToFirestore
} from './lib/firebase';

export default function App() {
  // Session States
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // App Database States
  const [members, setMembers] = useState<Member[]>([]);
  const [thilOptions, setThilOptions] = useState<string[]>(['Tithe', 'MMV', 'Others']);
  const [syncCount, setSyncCount] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  
  // App Config States
  const [scriptUrl, setScriptUrl] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Google Sheets / Firebase Direct sync states
  const [syncMethod, setSyncMethod] = useState<'oauth' | 'appsscript' | 'firebase'>('firebase');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(true);

  // Sidebar responsive toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState<string>('Local Committee');
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [tempFY, setTempFY] = useState('2026-2027');
  const [isEditingFY, setIsEditingFY] = useState(false);
  const [memberFilter, setMemberFilter] = useState<'all' | 'baptized' | 'active' | 'bial'>('all');

  // Router navigation Page state
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Users management States
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalId, setUserModalId] = useState('');
  const [userModalDisplayName, setUserModalDisplayName] = useState('');
  const [userModalUsername, setUserModalUsername] = useState('');
  const [userModalPassword, setUserModalPassword] = useState('');
  const [userModalRole, setUserModalRole] = useState<'admin' | 'user'>('admin');

  // Load baseline app parameters
  useEffect(() => {
    async function boot() {
      try {
        await initDefaultUser();
        const user = getSessionUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (e) {
        console.error('Boot authorization failed', e);
      } finally {
        setIsAuthLoading(false);
      }
    }
    boot();
  }, []);

  // Google Auth listener
  useEffect(() => {
    const unsub = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setIsGoogleLoading(false);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setIsGoogleLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Fetch Core Registry tables when user logs in successfully
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      try {
        const localMembers = await getAllRecords<Member>('members');
        setMembers(localMembers);

        const savedThil = await getSetting<string[]>('thilOptions');
        if (savedThil) {
          setThilOptions(savedThil);
        }

        const url = await getSetting<string>('scriptUrl');
        if (url) {
          setScriptUrl(url);
        }

        const auto = await getSetting<boolean>('autoSync');
        setAutoSync(auto !== false);

        const method = await getSetting<'oauth' | 'appsscript' | 'firebase'>('syncMethod');
        if (method) {
          setSyncMethod(method);
        } else {
          // If no sync method exists, default to 'firebase' as the primary modern solution
          setSyncMethod('firebase');
        }

        const sId = await getSetting<string>('spreadsheetId');
        if (sId) {
          setSpreadsheetId(sId);
        }

        const savedFY = await getSetting<string>('financialYear');
        if (savedFY) {
          setFinancialYear(savedFY);
          setTempFY(savedFY);
        } else {
          setFinancialYear('2026-2027');
          setTempFY('2026-2027');
        }

        const localUsers = await getAllRecords<UserAccount>('users');
        setAllUsers(localUsers);

        // Compute sync queue
        const queue = await getAllRecords<SyncOp>('syncQueue');
        setSyncCount(queue.length);

        // Attach network triggers
        const handleOnline = () => {
          setOnline(true);
          triggerSync();
        };
        const handleOffline = () => setOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      } catch (e) {
        console.error('Data database loading failed', e);
      }
    }
    loadData();
  }, [currentUser]);


  const formatSyncError = (err: any): string => {
    const errMsg = err?.message || String(err || '');
    const isNetworkOrCors = 
      errMsg.toLowerCase().includes('failed to fetch') || 
      errMsg.toLowerCase().includes('networkerror') ||
      errMsg.toLowerCase().includes('cors') ||
      errMsg.toLowerCase().includes('load failed') ||
      errMsg.toLowerCase().includes('typeerror: failed to fetch');
      
    if (isNetworkOrCors) {
      return 'Failed to connect to the spreadsheet server (network connectivity issue or CORS restriction). Please verify your internet connection, URL configuration, and active login state.';
    }
    return errMsg;
  };

  // Synchronize local background offline edits if online has restored
  const triggerSync = async (isManual: any = false) => {
    const manual = isManual === true;
    if (!navigator.onLine) return;
    const queue = await getAllRecords<SyncOp>('syncQueue');
    if (queue.length === 0) {
      if (manual) {
        alert('ℹ️ All offline changes are already synchronized!');
      }
      return;
    }

    // Gracefully handle absent config/credentials in background without setting error states
    if (syncMethod === 'firebase') {
      // Firebase is preconfigured and doesn't require individual OAuth tokens or script URLs
    } else if (syncMethod === 'oauth') {
      if (!spreadsheetId || !googleToken) {
        if (manual) {
          alert('Sync process failed: Google Spreadsheet ID and active Google login are required for syncing. Please set them up in Settings.');
        }
        return;
      }
    } else {
      if (!scriptUrl) {
        if (manual) {
          alert('Sync process failed: Google Apps Script Web App Endpoint URL is required for syncing. Please configure it in Settings.');
        }
        return;
      }
    }

    setSyncStatus('syncing');
    try {
      if (syncMethod === 'firebase') {
        await batchSyncToFirestore(queue);
      } else if (syncMethod === 'oauth') {
        await batchSyncToSheet(googleToken, spreadsheetId, queue);
      } else {
        // Use text/plain to avoid preflight OPTIONS CORS errors with Google Apps Script web apps
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'batch', ops: queue })
        });
        if (!response.ok) throw new Error('Sync failed with status ' + response.status);
      }
      
      // Clear processed sync logs from store
      for (const op of queue) {
        if (op.qid) {
          await deleteRecord('syncQueue', op.qid);
        }
      }
      setSyncStatus('synced');
      setSyncError(null);
      if (manual) {
        alert('🎉 Successfully synchronized offline changes!');
      }
    } catch (e: any) {
      console.error('Sync process failed:', e);
      setSyncStatus('error');
      const errMsg = formatSyncError(e);
      setSyncError(errMsg);
      if (manual) {
        alert('Sync process failed: ' + errMsg);
      }
    } finally {
      const remaining = await getAllRecords<SyncOp>('syncQueue');
      setSyncCount(remaining.length);
    }
  };

  const handleSyncNow = () => {
    triggerSync(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('❌ Enter credentials.');
      return;
    }
    const logged = await loginUser(loginUsername, loginPassword);
    if (logged) {
      setCurrentUser(logged);
    } else {
      setLoginError('❌ Invalid username or password.');
    }
  };

  const handleLogout = () => {
    saveSessionUser(null);
    setCurrentUser(null);
    setActivePage('dashboard');
  };

  // Sync operations Queue Helper
  const queueOperation = async (action: 'upsert' | 'delete', memberData?: Member, idData?: string) => {
    await putRecord('syncQueue', {
      action,
      member: memberData,
      id: idData,
      ts: Date.now()
    });
    const remaining = await getAllRecords<SyncOp>('syncQueue');
    setSyncCount(remaining.length);
  };

  // Google Sheets Direct POST proxies (Apps Script fallback)
  const sendSyncPost = async (payload: any) => {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('HTTP Status ' + response.status);
    return response.json();
  };

  const handlePushChange = async (action: 'upsert' | 'delete', m?: Member, id?: string) => {
    if (syncMethod === 'firebase') {
      if (navigator.onLine && autoSync) {
        try {
          setSyncStatus('syncing');
          if (action === 'upsert' && m) {
            await upsertMemberToFirestore(m);
          } else if (action === 'delete' && id) {
            await deleteMemberFromFirestore(id);
          }
          setSyncStatus('synced');
          setSyncError(null);
        } catch (error) {
          console.error("Direct Firebase sync failed, queueing offline:", error);
          await queueOperation(action, m, id);
          setSyncStatus('error');
        }
      } else {
        await queueOperation(action, m, id);
      }
      return;
    }

    if (syncMethod === 'oauth') {
      if (spreadsheetId && googleToken && navigator.onLine && autoSync) {
        try {
          setSyncStatus('syncing');
          if (action === 'upsert' && m) {
            await upsertMemberToSheet(googleToken, spreadsheetId, m);
          } else if (action === 'delete' && id) {
            await deleteMemberFromSheet(googleToken, spreadsheetId, id);
          }
          setSyncStatus('synced');
        } catch (error) {
          console.error("Direct sheet sync failed, queueing offline:", error);
          await queueOperation(action, m, id);
          setSyncStatus('error');
        }
      } else {
        await queueOperation(action, m, id);
      }
      return;
    }

    // Apps Script fallback
    if (!scriptUrl) return;
    if (navigator.onLine && autoSync) {
      try {
        setSyncStatus('syncing');
        await sendSyncPost({ action, member: m, id });
        setSyncStatus('synced');
      } catch {
        await queueOperation(action, m, id);
        setSyncStatus('error');
      }
    } else {
      await queueOperation(action, m, id);
    }
  };

  const handleSaveMember = async (m: Member) => {
    await putRecord('members', m);
    setMembers((prev) => {
      const idx = prev.findIndex((x) => x.id === m.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = m;
        return copy;
      }
      return [...prev, m];
    });
    await handlePushChange('upsert', m);
  };

  const handleDeleteMember = async (id: string) => {
    await deleteRecord('members', id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    await handlePushChange('delete', undefined, id);
  };

  // Native OAuth config and method controls
  const handleSyncMethodChange = async (method: 'oauth' | 'appsscript' | 'firebase') => {
    setSyncMethod(method);
    await setSetting('syncMethod', method);
  };

  const handleSpreadsheetIdChange = async (id: string) => {
    let extractedId = id.trim();
    if (extractedId.includes('/spreadsheets/d/')) {
      const match = extractedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        extractedId = match[1];
      }
    }
    setSpreadsheetId(extractedId);
    await setSetting('spreadsheetId', extractedId);
  };

  const handleGoogleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        alert('Successfully signed in with Google and linked OAuth spreadsheet permission!');
      }
    } catch (err: any) {
      alert('Google Authentication flow failed: ' + err.message);
    }
  };

  const handleGoogleSignOut = async () => {
    if (confirm('Disconnect your active Google Sheets account linkage?')) {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
    }
  };

  const handleConfigUrlChange = async (url: string) => {
    setScriptUrl(url);
    await setSetting('scriptUrl', url);
  };

  const handleAutoSyncToggle = async (checked: boolean) => {
    setAutoSync(checked);
    await setSetting('autoSync', checked);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      if (!Array.isArray(obj)) throw new Error('Invalid JSON array');
      
      for (const m of obj) {
        await putRecord('members', m);
      }
      const updated = await getAllRecords<Member>('members');
      setMembers(updated);
      alert(`✅ Uploaded and processed ${obj.length} records.`);
    } catch {
      alert('❌ Failed to parse JSON file structure.');
    }
  };

  const handleClearStores = async () => {
    if (confirm('Permanently wipe out ALL local members data? This cannot be undone.')) {
      await clearStore('members');
      setMembers([]);
      alert('Local datashield store cleared successfully.');
    }
  };

  const handlePullFromSheets = async () => {
    if (syncMethod === 'firebase') {
      setSyncStatus('syncing');
      try {
        const data = await fetchMembersFromFirestore();
        for (const m of data) {
          await putRecord('members', m);
        }
        const updated = await getAllRecords<Member>('members');
        setMembers(updated);
        setSyncStatus('synced');
        alert(`✅ Successfully pulled and synchronized with Firebase Firestore! Fetched and stored ${data.length} records.`);
      } catch (err: any) {
        setSyncStatus('error');
        const errMsg = formatSyncError(err);
        alert('Firebase pull failed: ' + errMsg);
      }
      return;
    }

    if (syncMethod === 'oauth') {
      if (!spreadsheetId || !googleToken) {
        alert('Spreadsheet ID / Share-Link and Google Sheets integration are required to pull rows.');
        return;
      }
      setSyncStatus('syncing');
      try {
        const data = await pullSheetData(googleToken, spreadsheetId);
        for (const m of data) {
          await putRecord('members', m);
        }
        const updated = await getAllRecords<Member>('members');
        setMembers(updated);
        setSyncStatus('synced');
        alert(`✅ Successfully synchronized with Google Sheets! Fetched and stored ${data.length} records.`);
      } catch (err: any) {
        setSyncStatus('error');
        const errMsg = formatSyncError(err);
        alert('Google Sheets direct pull failed: ' + errMsg);
      }
      return;
    }

    if (!scriptUrl) {
      alert('Sheet WebApp URL endpoint is required for pulls.');
      return;
    }
    setSyncStatus('syncing');
    try {
      const r = await fetch(scriptUrl + '?t=' + Date.now());
      const data = await r.json();
      if (!Array.isArray(data)) throw new Error('CORS or invalid apps script data returned');
      for (const m of data) {
        await putRecord('members', m);
      }
      const updated = await getAllRecords<Member>('members');
      setMembers(updated);
      setSyncStatus('synced');
      alert(`Successfully synchronized with sheets array. Synced ${data.length} records.`);
    } catch (err: any) {
      setSyncStatus('error');
      const errMsg = formatSyncError(err);
      alert('Failed to connect to Google Sheets: ' + errMsg);
    }
  };

  const handleTestConnection = async () => {
    if (syncMethod === 'firebase') {
      setSyncStatus('syncing');
      try {
        await testFirestoreConnection();
        setSyncStatus('synced');
        alert('🎉 Active Connection! Successfully verified connection and communicating with Firebase Firestore DB.');
      } catch (err: any) {
        setSyncStatus('error');
        const errMsg = formatSyncError(err);
        alert('Firebase connection test failed: ' + errMsg);
      }
      return;
    }

    if (syncMethod === 'oauth') {
      if (!spreadsheetId || !googleToken) {
        alert('Google Spreadsheet ID / URL and active Google login are required.');
        return;
      }
      setSyncStatus('syncing');
      try {
        await ensureTabAndHeaders(googleToken, spreadsheetId);
        const data = await pullSheetData(googleToken, spreadsheetId);
        setSyncStatus('synced');
        alert(`🎉 Active Connection! Successfully initialized the "EBCC_Members" tab. Found ${data.length} registered member row(s).`);
      } catch (err: any) {
        setSyncStatus('error');
        const errMsg = formatSyncError(err);
        alert('Sheets direct connection request failed: ' + errMsg);
      }
      return;
    }

    if (!scriptUrl) {
      alert('URL configuration missing.');
      return;
    }
    setSyncStatus('syncing');
    try {
      const r = await fetch(scriptUrl + '?t=' + Date.now());
      const data = await r.json();
      setSyncStatus('synced');
      alert(`Connection Active! Found ${Array.isArray(data) ? data.length : 0} sheets records.`);
    } catch (err: any) {
      setSyncStatus('error');
      const errMsg = formatSyncError(err);
      alert('Sheet communication test failed: ' + errMsg);
    }
  };

  const handleExportJSON = async () => {
    const list = await getAllRecords<Member>('members');
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ebcc_llv_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleAddThilOptionValue = async (val: string) => {
    const updated = [...thilOptions, val];
    setThilOptions(updated);
    await setSetting('thilOptions', updated);
  };

  // User Management
  const handleOpenAddUser = () => {
    setUserModalId('');
    setUserModalDisplayName('');
    setUserModalUsername('');
    setUserModalPassword('');
    setUserModalRole('admin');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (id: string) => {
    const found = allUsers.find((u) => u.id === id);
    if (!found) return;
    setUserModalId(found.id);
    setUserModalDisplayName(found.displayName || '');
    setUserModalUsername(found.username);
    setUserModalPassword('');
    setUserModalRole(found.role === 'superadmin' ? 'admin' : found.role);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userModalDisplayName.trim() || !userModalUsername.trim()) {
      alert('Display Name and Username are mandatory.');
      return;
    }

    const usernameNormalize = userModalUsername.trim().toLowerCase();
    const dup = allUsers.find((x) => x.username.toLowerCase() === usernameNormalize && x.id !== userModalId);
    if (dup) {
      alert('Account username is already in use.');
      return;
    }

    let account: UserAccount;
    if (userModalId) {
      const existing = allUsers.find((u) => u.id === userModalId);
      if (!existing) return;
      account = {
        ...existing,
        username: usernameNormalize,
        displayName: userModalDisplayName.trim(),
        role: existing.role === 'superadmin' ? 'superadmin' : userModalRole,
        password: userModalPassword || existing.password
      };
      if (userModalId === currentUser?.id) {
        setCurrentUser(account);
        saveSessionUser(account);
      }
    } else {
      if (!userModalPassword) {
        alert('Password is required for newly created accounts.');
        return;
      }
      account = {
        id: 'u_' + Date.now(),
        username: usernameNormalize,
        password: userModalPassword,
        displayName: userModalDisplayName.trim(),
        role: userModalRole
      };
    }

    await registerUserAccount(account);
    const updated = await getAllRecords<UserAccount>('users');
    setAllUsers(updated);
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      alert('Cannot delete your own active session account.');
      return;
    }
    const target = allUsers.find((u) => u.id === id);
    if (target?.role === 'superadmin') {
      alert('Structural Superadmin account is protected.');
      return;
    }
    if (!confirm('Permanently delete this user profile?')) return;
    await removeUserAccount(id);
    const updated = await getAllRecords<UserAccount>('users');
    setAllUsers(updated);
  };

  // Auth Loading splash screen
  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-[#1a2a6c] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#f5c842] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#f5c842]/80">Loading registry...</p>
      </div>
    );
  }

  // Login view if unauthenticated
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4">
        {/* Background Decorative Blobs */}
        <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-[#1a2a6c]/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-[#c9972d]/10 rounded-full filter blur-3xl"></div>

        <div className="w-28 h-28 rounded-full overflow-hidden border-3 border-[#c9972d] shadow-2xl relative z-10 flex items-center justify-center bg-white p-1">
          <img 
            src="/ebc_logo.png" 
            className="w-full h-full object-contain" 
            alt="EBCC Logo" 
            referrerPolicy="no-referrer" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a2a6c] to-[#0e1c5a] text-white rounded-full p-2';
                fallback.innerHTML = `
                  <svg viewBox="0 0 24 24" fill="none" stroke="#f5c842" stroke-width="1.5" class="w-10 h-10">
                    <circle cx="12" cy="12" r="10" stroke="#f5c842" stroke-width="1" fill="none" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18V8m-3 3h6M5 12h14" />
                  </svg>
                  <span class="text-[7px] font-black tracking-widest text-[#f5c842] uppercase text-center mt-0.5">EBC</span>
                `;
                parent.appendChild(fallback);
              }
            }}
          />
        </div>

        <h1 className="text-[#f5c842] text-xl font-black tracking-wider text-center mt-4">
          EBCC, LAILAM VENG
        </h1>
        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest text-center mt-1">
          Spatuam Record
        </p>

        <form 
          onSubmit={handleLogin}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6 w-full max-w-[340px] shadow-2xl relative z-10 space-y-4"
        >
          <h2 className="text-white font-extrabold text-sm border-b border-slate-800 pb-2.5 flex items-center gap-1.5">
            <Lock size={14} className="text-[#f5c842]" />
            <span>Secure Registry Sign-In</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Username Identifier
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="superadmin"
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-3 text-xs focus:outline-none focus:border-[#c9972d] transition-colors"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg p-3 text-xs focus:outline-none focus:border-[#c9972d] transition-colors"
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <p className="text-red-500 text-[11px] font-bold text-center">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#1a2a6c] to-[#2d4aaa] hover:brightness-110 active:scale-[0.98] text-white font-extrabold text-sm rounded-lg shadow-md transition-all cursor-pointer"
            >
              Sign In →
            </button>
          </div>
        </form>

        <div className="text-slate-600 text-[10px] mt-6 text-center font-bold tracking-wider uppercase">
          EBCC Lailam Veng, Central Lamka
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <SpeedInsights />
      {/* Offline Status Banner */}
      {!online && (
        <div className="bg-red-600 text-white font-bold text-[10px] text-center py-1.5 flex items-center justify-center gap-1.5 uppercase tracking-wider relative z-[1000]">
          <WifiOff size={12} />
          <span>Operating offline. Profiles will auto-sync on restoration.</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="h-14 bg-gradient-to-r from-[#0e1c5a] to-[#1a2a6c] flex items-center justify-between p-3 gap-3 shadow-md border-b border-white/5 relative z-[300]">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer select-none border border-white/10 ${
              isSidebarOpen 
                ? 'bg-[#c9972d] text-[#1a2a6c]' 
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
            title="Toggle Left Menu"
          >
            <Menu size={14} className={isSidebarOpen ? 'text-[#1a2a6c]' : 'text-[#f5c842]'} />
          </button>
          <button 
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-2.5 text-left hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer group"
            title="Go to Home"
          >
            <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-inner border border-white/20">
              <img src="/ebc_logo.png" className="w-full h-full object-cover" alt="EBCC Logo" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xs leading-none group-hover:text-[#f5c842] transition-colors">EBCC Lailam Veng</h1>
              <p className="text-[#f5c842] text-[9px] uppercase font-bold tracking-widest mt-0.5">
                Spatuam Record
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Online/Offline status pills */}
          <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1 rounded-full text-[10px] font-bold text-white select-none">
            <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <span>{online ? 'Online' : 'Offline'}</span>
          </div>

          <div 
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full text-xs text-white border border-white/5 hover:bg-white/15 transition-all select-none cursor-pointer"
          >
            <span className="w-5 h-5 rounded-full bg-[#c9972d] text-[#1a2a6c] font-black text-[10px] flex items-center justify-center">
              {currentUser.displayName?.slice(0, 1)}
            </span>
            <span className="hidden sm:inline font-bold truncate max-w-[80px]">{currentUser.displayName}</span>
          </div>

          {/* Codex Sidebar Toggle Icon-only Button (placed right of super admin/user badge) */}
          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer select-none border border-white/10 ${
              isRightSidebarOpen 
                ? 'bg-[#c9972d] text-[#1a2a6c]' 
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
            title="Toggle Local Spatuam Departments"
          >
            <BookOpen size={14} className={isRightSidebarOpen ? 'text-[#1a2a6c]' : 'text-[#f5c842]'} />
          </button>
        </div>
      </header>

      {/* Main UI Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentUser={currentUser}
          activePage={activePage}
          onPageChange={setActivePage}
          syncCount={syncCount}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        />

        {/* Content Page Split Container with Codex Panel */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Main Content Router Container */}
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-7xl mx-auto w-full">
            {activePage === 'dashboard' && (
              <Dashboard
                currentUser={currentUser}
                members={members}
                onPageChange={setActivePage}
                onViewMember={(id) => {
                  setSelectedMember(members.find((m) => m.id === id) || null);
                  setActivePage('detail');
                }}
                onOpenAddMember={() => setSelectedMember(null)}
                onMetricClick={(filter) => {
                  setMemberFilter(filter);
                  setActivePage('members');
                }}
              />
            )}

            {activePage === 'members' && (
              <MemberList
                currentUser={currentUser}
                members={members}
                onPageChange={setActivePage}
                onViewMember={(id) => {
                  setSelectedMember(members.find((m) => m.id === id) || null);
                  setActivePage('detail');
                }}
                onOpenAddMember={() => setSelectedMember(null)}
                filterType={memberFilter}
                onFilterTypeChange={(filter) => setMemberFilter(filter)}
              />
            )}

            {activePage === 'detail' && (
              <MemberDetail
                currentUser={currentUser}
                member={selectedMember}
                onPageChange={setActivePage}
                onEditMember={(m) => setSelectedMember(m)}
                onDeleteMember={async (id) => {
                  await handleDeleteMember(id);
                  setActivePage('members');
                }}
              />
            )}

            {activePage === 'form' && (
              <MemberForm
                member={selectedMember}
                thilOptions={thilOptions}
                onAddThilOption={handleAddThilOptionValue}
                onSave={handleSaveMember}
                members={members}
                onCancel={() => {
                  if (selectedMember) setActivePage('detail');
                  else setActivePage('members');
                }}
              />
            )}

            {activePage === 'report' && (
              <Reports
                currentUser={currentUser}
                members={members}
                thilOptions={thilOptions}
                onViewMember={(id) => {
                  setSelectedMember(members.find((m) => m.id === id) || null);
                  setActivePage('detail');
                }}
                onDeleteMember={handleDeleteMember}
                onRefresh={() => {
                  alert('Refreshing latest system stores...');
                }}
                onMetricClick={(filter) => {
                  setMemberFilter(filter);
                  setActivePage('members');
                }}
              />
            )}

            {activePage === 'settings' && (
              <Settings
                currentUser={currentUser}
                scriptUrl={scriptUrl}
                autoSync={autoSync}
                onUrlChange={handleConfigUrlChange}
                onAutoSyncChange={handleAutoSyncToggle}
                onSyncNow={handleSyncNow}
                onPullFromSheets={handlePullFromSheets}
                onTestConnection={handleTestConnection}
                onExport={handleExportJSON}
                onImport={handleImportJSON}
                onClear={handleClearStores}
                syncStatus={syncStatus}
                syncError={syncError}
                membersCount={members.length}
                
                syncMethod={syncMethod}
                onSyncMethodChange={handleSyncMethodChange}
                spreadsheetId={spreadsheetId}
                onSpreadsheetIdChange={handleSpreadsheetIdChange}
                googleUser={googleUser}
                onGoogleSignIn={handleGoogleSignIn}
                onGoogleSignOut={handleGoogleSignOut}
                isGoogleLoading={isGoogleLoading}
              />
            )}

            {activePage === 'users' && (
              <Users
                currentUser={currentUser}
                users={allUsers}
                onOpenAddUser={handleOpenAddUser}
                onOpenEditUser={handleOpenEditUser}
                onDeleteUser={handleDeleteUser}
              />
            )}
          </main>

          {/* Codex Right Sidebar - copy Codex App style */}
          {isRightSidebarOpen && (
            <>
              {/* Right Sidebar Backdrop for mobile */}
              <div 
                className="fixed inset-0 bg-black/40 z-[900] md:hidden transition-opacity cursor-pointer"
                onClick={() => setIsRightSidebarOpen(false)}
              />
              <aside id="codex-right-sidebar" className="w-full max-w-[320px] bg-white border-l border-slate-200 flex flex-col h-full shadow-2xl fixed inset-y-0 right-0 z-[1000] md:static md:shadow-none md:h-auto md:border-l md:border-slate-200/60 animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-[#0e1c5a] to-[#1a2a6c] text-white flex items-center justify-between border-b border-[#c9972d] shrink-0">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={16} className="text-[#f5c842]" />
                  <span className="font-extrabold text-xs tracking-wider uppercase">Local Spatuam Departments</span>
                </div>
                <button
                  onClick={() => setIsRightSidebarOpen(false)}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Close Departments Panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 p-4 overflow-y-auto space-y-5 bg-slate-50/50">
                {/* Section 1: Financial Year Details */}
                <div className="bg-white rounded-xl p-4 border border-slate-200/50 shadow-xs relative">
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => {
                        if (isEditingFY) {
                          if (tempFY.trim()) {
                            setFinancialYear(tempFY.trim());
                            setSetting('financialYear', tempFY.trim());
                            setIsEditingFY(false);
                          } else {
                            alert('Financial Year cannot be blank');
                          }
                        } else {
                          setIsEditingFY(true);
                        }
                      }}
                      className="p-1 bg-[#1a2a6c]/5 hover:bg-[#1a2a6c]/10 text-[#1a2a6c] rounded-md transition-all cursor-pointer"
                      title={isEditingFY ? 'Save changes' : 'Edit financial year'}
                    >
                      {isEditingFY ? <Check size={14} className="text-emerald-700" /> : <Edit3 size={11} />}
                    </button>
                  </div>

                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block mb-1">
                    Financial Year
                  </span>

                  {isEditingFY ? (
                    <div className="mt-2 flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={tempFY}
                        onChange={(e) => setTempFY(e.target.value)}
                        placeholder="e.g. 2026-2027"
                        className="w-full bg-white border border-slate-200 rounded-lg p-1 px-2 text-xs focus:outline-none focus:border-[#1a2a6c] font-black"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tempFY.trim()) {
                            setFinancialYear(tempFY.trim());
                            setSetting('financialYear', tempFY.trim());
                            setIsEditingFY(false);
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="text-base font-black text-[#1a2a6c] flex items-center gap-1.5">
                      <span className="border-b-[2px] border-[#c9972d] inline-block pb-0.5">{financialYear}</span>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-400 mt-1.5">
                    Assigned reporting cycle for accounting & data records.
                  </p>
                </div>

                {/* Section 2: Local Committees / Departments */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/40">
                    <h3 className="text-[#1a2a6c] text-[10px] uppercase font-extrabold tracking-widest pl-1 border-l-2 border-[#c9972d]">
                      Spatuam Departments
                    </h3>
                  </div>

                  {(() => {
                    // Helper to parse dynamic committee details
                    const categorizeMember = (m: Member) => {
                      const des = m.designation || '';
                      if (des.startsWith('Local Committee - ') || des === 'Local Committee') {
                        return { dept: 'Local Committee', role: des.replace('Local Committee - ', '') };
                      }
                      if (des.startsWith('Missions Committee - ') || des === 'Missions Committee') {
                        return { dept: 'Missions Committee', role: des.replace('Missions Committee - ', '') };
                      }
                      if (des.startsWith('Dorcas Committee - ') || des === 'Dorcas Committee') {
                        return { dept: 'Dorcas Committee', role: des.replace('Dorcas Committee - ', '') };
                      }
                      if (des.startsWith('BYF Committee - ') || des === 'BYF Committee') {
                        return { dept: 'BYF Committee', role: des.replace('BYF Committee - ', '') };
                      }
                      if (des.startsWith('Baptist Children Department - ') || des === 'Baptist Children Department') {
                        return { dept: 'Baptist Children Department', role: des.replace('Baptist Children Department - ', '') };
                      }

                      const lower = des.toLowerCase();
                      if (lower.includes('missions committee') || lower.includes('missions') || lower.includes('mission')) {
                        return { dept: 'Missions Committee', role: des };
                      }
                      if (lower.includes('dorcas committee') || lower.includes('dorcas')) {
                        return { dept: 'Dorcas Committee', role: des };
                      }
                      if (lower.includes('byf committee') || lower.includes('byf') || lower.includes('youth') || lower.includes('khalai')) {
                        return { dept: 'BYF Committee', role: des };
                      }
                      if (lower.includes('baptist children') || lower.includes('children') || lower.includes('bcd') || lower.includes('naupang')) {
                        return { dept: 'Baptist Children Department', role: des };
                      }
                      if (lower.includes('local committee') || lower.includes('local') || lower.includes('committee') || lower.includes('chairman') || lower.includes('secretary') || lower.includes('finance') || lower.includes('elder') || lower.includes('upa')) {
                        return { dept: 'Local Committee', role: des };
                      }

                      return null;
                    };

                    const getRoleWeight = (role: string) => {
                      const r = role.toLowerCase();
                      if (r.includes('chairman') || r.includes('president') || r.includes('leader')) return 1;
                      if (r.includes('vice chairman') || r.includes('vice-chairman') || r.includes('vice president') || r.includes('vice-president')) return 2;
                      if (r.includes('secretary') && !r.includes('asst')) return 3;
                      if (r.includes('asst') || r.includes('assistant')) return 4;
                      if (r.includes('finance') || r.includes('treasurer')) return 5;
                      if (r.includes('teacher')) return 6;
                      if (r.includes('member')) return 100;
                      return 50;
                    };

                    // Group members
                    const deptGroups: Record<string, Array<{ member: Member; role: string }>> = {
                      'Local Committee': [],
                      'Missions Committee': [],
                      'Dorcas Committee': [],
                      'BYF Committee': [],
                      'Baptist Children Department': []
                    };

                    members.forEach((m) => {
                      const match = categorizeMember(m);
                      if (match && match.dept in deptGroups) {
                        deptGroups[match.dept].push({ member: m, role: match.role });
                      }
                    });

                    const departments = [
                      { id: 'Local Committee', label: '👥 Local Committee' },
                      { id: 'Missions Committee', label: '🌍 Missions Committee' },
                      { id: 'Dorcas Committee', label: '🌺 Dorcas Committee' },
                      { id: 'BYF Committee', label: '⚡ BYF Committee' },
                      { id: 'Baptist Children Department', label: '👶 Baptist Children Dept' }
                    ];

                    return (
                      <div className="space-y-2">
                        {departments.map((dept) => {
                          const list = deptGroups[dept.id].sort((a, b) => {
                            const wA = getRoleWeight(a.role);
                            const wB = getRoleWeight(b.role);
                            if (wA !== wB) return wA - wB;
                            return a.member.name.localeCompare(b.member.name);
                          });

                          const isOpen = activeDepartment === dept.id;

                          return (
                            <div key={dept.id} className="border border-slate-200/50 rounded-xl overflow-hidden bg-white shadow-xs">
                              {/* Header Accordion */}
                              <button
                                onClick={() => setActiveDepartment(isOpen ? '' : dept.id)}
                                className={`w-full flex items-center justify-between p-3 cursor-pointer text-left transition-colors select-none ${
                                  isOpen ? 'bg-[#1a2a6c]/5 font-black text-[#1a2a6c]' : 'bg-white hover:bg-slate-50 font-bold text-slate-800'
                                }`}
                              >
                                <span className="text-xs">{dept.label}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                    list.length > 0
                                      ? isOpen 
                                        ? 'bg-[#1a2a6c] text-white' 
                                        : 'bg-slate-100 text-slate-600'
                                      : 'bg-slate-50 text-slate-450'
                                  }`}>
                                    {list.length}
                                  </span>
                                  <span className="text-slate-400 text-[10px]">
                                    {isOpen ? '▲' : '▼'}
                                  </span>
                                </div>
                              </button>

                              {/* Accordion Body */}
                              {isOpen && (
                                <div className="p-2.5 bg-slate-50/30 border-t border-slate-100 space-y-1.5 max-h-[320px] overflow-y-auto">
                                  {list.length === 0 ? (
                                    <div className="py-5 px-3 text-center border border-dashed border-slate-200 rounded-lg bg-white/50">
                                      <p className="text-[10px] text-slate-400">
                                        No members assigned to this department.
                                      </p>
                                    </div>
                                  ) : (
                                    list.map(({ member: m, role }) => {
                                      const initials = m.name
                                        .split(' ')
                                        .map((w) => w[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2) || '?';
                                      return (
                                        <div
                                          key={m.id}
                                          onClick={() => {
                                            setSelectedMember(m);
                                            setActivePage('detail');
                                            if (window.innerWidth < 768) setIsRightSidebarOpen(false);
                                          }}
                                          className="bg-white rounded-lg p-2 border border-slate-200/55 hover:border-[#c9972d]/40 shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-2 transition-all active:scale-[0.98]"
                                        >
                                          <div className="w-7 h-7 rounded-full bg-slate-100 text-[#1a2a6c] text-[10px] font-black flex items-center justify-center select-none shrink-0 border border-slate-200/20">
                                            {initials}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="text-[11px] font-extrabold text-slate-900 truncate">
                                              {m.title ? m.title + ' ' : ''}{m.name}
                                            </div>
                                            <span className="inline-block text-[8px] px-1.5 py-0.5 bg-amber-50 text-[#c9972d] font-bold rounded-md truncate mt-0.5 border border-[#c9972d]/5">
                                              {role || 'Member'}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </aside>
          </>)}

        </div>
      </div>

      {/* User Accounts add/edit modal (Restricted to superadmin) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[360px] shadow-2xl space-y-4">
            <h2 className="text-[#1a2a6c] font-black text-sm border-b border-slate-100 pb-2.5">
              {userModalId ? '✏️ Edit Operator Profile' : '👤 Register New Operator'}
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={userModalDisplayName}
                  onChange={(e) => setUserModalDisplayName(e.target.value)}
                  placeholder="e.g. Pastor Ricky"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Username handle
                </label>
                <input
                  type="text"
                  value={userModalUsername}
                  onChange={(e) => setUserModalUsername(e.target.value)}
                  placeholder="e.g. pastor_ricky"
                  disabled={!!userModalId}
                  className="w-full bg-white disabled:bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={userModalPassword}
                  onChange={(e) => setUserModalPassword(e.target.value)}
                  placeholder={userModalId ? '•••••••• (leave blank to keep)' : '••••••••'}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Access Role Level
                </label>
                <select
                  value={userModalRole}
                  onChange={(e) => setUserModalRole(e.target.value as 'admin' | 'user')}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#1a2a6c]"
                >
                  <option value="admin">Admin - All settings except Integrations</option>
                  <option value="user">User - Read-Only Viewer / Accountant</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-[#1a2a6c] hover:bg-[#2d4aaa] text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
