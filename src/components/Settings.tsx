import React, { useState } from 'react';
import { 
  Cloud, 
  FileJson, 
  Trash2, 
  Check, 
  Info, 
  Wifi, 
  History 
} from 'lucide-react';
import { UserAccount } from '../types';

interface SettingsProps {
  currentUser: UserAccount | null;
  scriptUrl: string;
  autoSync: boolean;
  onUrlChange: (url: string) => void;
  onAutoSyncChange: (sync: boolean) => void;
  onSyncNow: () => Promise<void>;
  onPullFromSheets: () => Promise<void>;
  onTestConnection: () => Promise<void>;
  onExport: () => Promise<void>;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onClear: () => Promise<void>;
  syncStatus: string;
  syncError?: string | null;
  membersCount: number;

  syncMethod: 'oauth' | 'appsscript' | 'firebase';
  onSyncMethodChange: (method: 'oauth' | 'appsscript' | 'firebase') => void;
  spreadsheetId: string;
  onSpreadsheetIdChange: (id: string) => void;
  googleUser: any;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  isGoogleLoading: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  currentUser,
  scriptUrl,
  autoSync,
  onUrlChange,
  onAutoSyncChange,
  onSyncNow,
  onPullFromSheets,
  onTestConnection,
  onExport,
  onImport,
  onClear,
  syncStatus,
  syncError,
  membersCount,

  syncMethod,
  onSyncMethodChange,
  spreadsheetId,
  onSpreadsheetIdChange,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isGoogleLoading
}) => {
  const role = currentUser?.role || 'user';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const [copiedCode, setCopiedCode] = useState(false);

  const scriptCode = `/* 
 ============================================================
 EBCC Lailam Veng — Church Member Registry Sheets Integration
 ============================================================
 
 How to deploy correctly:
 1. Open your Google Sheet
 2. Click "Extensions" → "Apps Script" in the top menu
 3. Erase all existing template code (delete myFunction)
 4. Paste this entire code block below
 5. Click the "Save" (floppy disk) icon
 6. Click "Deploy" (top-right) → "New deployment"
 7. Click the gear icon next to "Select type" and select "Web App"
 8. Configure exactly like this:
    - Description: EBCC Registry Sync
    - Execute as: Me (your-email@gmail.com)
    - Who has access: Anyone
 9. Click "Deploy", authorize the permissions, then copy the 
    Web App URL (ends with "/exec") and paste it in PWA settings.
 
 ⚠️ IMPORTANT:
 If you ever edit this script, you MUST deploy a new version:
 Click Deploy → Manage deployments → Edit (pencil) → Version: "New version" → Deploy.
 ============================================================
 */

const SNAME = 'EBCC_Members';
const COLS  = ['id','mid','bial','title','name','phone','dob','pob',
               'parents','baptDate','baptMode','tang','mtype','ordained',
               'rel','wed','kitenni','kitennamun','kite','wm','wf',
               'trans','death','addr','thil','updatedAt'];

function doGet(e) {
  const s = getSheet();
  const d = s.getDataRange().getValues();
  if (d.length < 2) return out([]);
  const h = d[0], rows = d.slice(1)
    .map(r => Object.fromEntries(h.map((k,i) => [k, r[i]||''])))
    .filter(r => r.id);
  return out(rows);
}

function doPost(e) {
  const p = JSON.parse(e.postData.contents);
  const s = getSheet();
  if      (p.action === 'upsert')  upsert(s, p.member);
  else if (p.action === 'delete')  del(s, p.id);
  else if (p.action === 'batch')   p.ops.forEach(o => {
    if (o.action==='upsert') upsert(s, o.member);
    if (o.action==='delete') del(s, o.id);
  });
  return out({ok:true});
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SNAME);
  if (!s) {
    s = ss.insertSheet(SNAME);
    s.getRange(1,1,1,COLS.length).setValues([COLS]).setFontWeight('bold');
  }
  return s;
}

function upsert(s, m) {
  const d = s.getDataRange().getValues();
  const ic = d[0].indexOf('id');
  const row = COLS.map(c => m[c]||'');
  for (let i=1;i<d.length;i++) {
    if (d[i][ic]===m.id) {
      s.getRange(i+1,1,1,row.length).setValues([row]); return;
    }
  }
  s.appendRow(row);
}

function del(s, id) {
  const d = s.getDataRange().getValues();
  const ic = d[0].indexOf('id');
  for (let i=1;i<d.length;i++) {
    if (d[i][ic]===id) { s.deleteRow(i+1); return; }
  }
}

function out(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode)
      .then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      })
      .catch(() => alert('Copy failed, please select and copy the text manually.'));
  };

  const getSyncStateText = () => {
    if (syncStatus === 'synced') return '✅ Connected & Synced';
    if (syncStatus === 'syncing') return '🔄 Syncing data...';
    if (syncStatus === 'error') return '❌ Connection / Sync Error';
    return '⚠️ Configure connection URL';
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h1 className="text-[#1a2a6c] text-xl font-bold tracking-tight">⚙️ App Settings</h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Manage cloud synchronizations, JSON backups, and local storage.
        </p>
      </div>

      {/* Google Sheets Sync Card */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200/50 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#1a2a6c] font-black text-sm border-b border-slate-100 pb-2.5">
            <Cloud size={18} />
            <h2>Google Spreadsheet Synchronization</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
              <div>
                <dt className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sync State Status</dt>
                <dd className="text-sm font-extrabold text-slate-800 mt-1">{getSyncStateText()}</dd>
                {syncStatus === 'error' && syncError && (
                  <p className="text-[11px] text-red-600 mt-1.5 font-medium leading-relaxed max-w-sm">
                    ⚠️ {syncError}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onSyncNow}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#1a2a6c] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  🔄 Sync Now
                </button>
                <button
                  type="button"
                  onClick={onPullFromSheets}
                  className="px-3 py-1.5 bg-[#0e1c5a] hover:bg-[#1a2a6c] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  ⬇ Pull Sheet Rows
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-2">
              <div>
                <h3 className="text-slate-800 font-extrabold text-sm">Automatic Background Sync</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Synchronize each profile update instantly when connected online.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => onAutoSyncChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-5 after:width-5 after:transition-all peer-checked:bg-[#1a2a6c]"></div>
              </label>
            </div>

            {/* Sync Type Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">
                Database / Spreadsheet Synchronization Method
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => onSyncMethodChange('firebase')}
                  className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    syncMethod === 'firebase'
                      ? 'bg-white text-[#1a2a6c] shadow-xs border-white/50 border'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🔥 Firebase Firestore (Default)
                </button>
                <button
                  type="button"
                  onClick={() => onSyncMethodChange('oauth')}
                  className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    syncMethod === 'oauth'
                      ? 'bg-white text-[#1a2a6c] shadow-xs border-white/50 border'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🔗 Google Sheets OAuth
                </button>
                <button
                  type="button"
                  onClick={() => onSyncMethodChange('appsscript')}
                  className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    syncMethod === 'appsscript'
                      ? 'bg-white text-[#1a2a6c] shadow-xs border-white/50 border'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  📡 Apps Script Web App (Legacy)
                </button>
              </div>
            </div>

            {syncMethod === 'firebase' ? (
              <div className="space-y-4 pt-1">
                <div className="bg-emerald-50/70 border border-emerald-200/50 rounded-xl p-4 text-xs space-y-2 text-emerald-900">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-800">
                    <Check size={14} className="text-emerald-700" />
                    <span>Real-time Firebase Firestore Storage Active</span>
                  </div>
                  <p className="leading-relaxed text-emerald-800">
                    Your database is securely linked and updated in real-time. No complicated links or web apps are needed. Full offline persistence works automatically!
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onTestConnection}
                    className="px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    🧪 Test Firebase status
                  </button>
                </div>
              </div>
            ) : syncMethod === 'oauth' ? (
              <div className="space-y-4 pt-1">
                {/* Google OAuth Login Panel */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/80 p-3.5 rounded-xl border border-blue-100/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-blue-200 shadow-3xs overflow-hidden flex-shrink-0">
                      {googleUser ? (
                        <img 
                          src={googleUser.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                          alt={googleUser.displayName || 'Google'} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <span className="font-extrabold text-blue-600 text-xs">G</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <h4 className="font-extrabold text-slate-800">
                        {googleUser ? (googleUser.displayName || 'Authorized Account') : 'Google Access Token Link'}
                      </h4>
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        {googleUser ? googleUser.email : 'Link your Google account to save/load members'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {isGoogleLoading ? (
                      <span className="text-[10px] uppercase font-bold text-slate-400">Loading token...</span>
                    ) : googleUser ? (
                      <button
                        type="button"
                        onClick={onGoogleSignOut}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-red-600 font-extrabold text-[11px] rounded-lg transition-all cursor-pointer shadow-3xs active:scale-[0.98]"
                      >
                        Disconnect Link
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onGoogleSignIn}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-[0.98]"
                      >
                        Authorize Sheets
                      </button>
                    )}
                  </div>
                </div>

                {/* Spreadsheet ID / URL input box */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block pb-1">
                    Google Spreadsheet Link / Active ID
                  </span>
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => onSpreadsheetIdChange(e.target.value)}
                    placeholder="E.g., https://docs.google.com/spreadsheets/d/abc123xyz/edit"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#1a2a6c] shadow-xs"
                  />
                  {spreadsheetId && (
                    <span className="text-[9px] font-mono text-slate-400 block break-all">
                      Spreadsheet Target: <span className="font-bold text-slate-500">{spreadsheetId}</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onTestConnection}
                    disabled={!googleUser || !spreadsheetId}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:pointer-events-none text-emerald-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    🧪 Test Cloud Connection
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {/* URL config Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Google Apps Script Web App Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={scriptUrl}
                    onChange={(e) => onUrlChange(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#1a2a6c] shadow-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onTestConnection}
                    disabled={!scriptUrl}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-45 disabled:pointer-events-none text-emerald-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    🧪 Test WebApp Connection
                  </button>
                </div>

                {/* Troubleshooting doGet Section */}
                <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 text-xs space-y-2 text-amber-900">
                  <div className="flex items-center gap-1.5 font-extrabold text-amber-800">
                    <Info size={14} className="text-amber-700" />
                    <span>Fixing "Script function not found: doGet"</span>
                  </div>
                  <p className="leading-relaxed text-amber-800">
                    This error means Google Apps Script cannot locate the active <code className="bg-amber-100/80 px-1 py-0.5 rounded text-[10px] font-mono font-bold">doGet</code> endpoint. Please do the following to fix it:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-amber-800 ml-1">
                    <li>
                      <strong className="text-amber-950">Replace Existing Code entirely:</strong> In Google Sheet's Apps Script editor, make sure you delete any preset code like <code className="bg-amber-100/80 px-1 py-0.5 rounded text-[10px] font-mono font-bold">function myFunction()</code> before pasting our snippet.
                    </li>
                    <li>
                      <strong className="text-amber-950">Deploy a "New Version":</strong> Google does not run your saved changes until they are deployed. 
                      <div className="pl-4 mt-1 space-y-1 text-[11px] text-amber-900 border-l-2 border-amber-300">
                        <div>a. Click <strong className="text-amber-950">Deploy &rarr; Manage deployments</strong>.</div>
                        <div>b. Click the <strong className="text-amber-950">Active Web App Deployment</strong>, then click the pencil icon to edit.</div>
                        <div>c. Change <strong className="text-amber-950">Version</strong> to <strong className="text-amber-950">"New version"</strong>.</div>
                        <div>d. Click <strong className="text-amber-950">Deploy</strong>.</div>
                      </div>
                    </li>
                    <li>
                      <strong className="text-amber-950">Check Permissions:</strong> Verify <strong className="text-amber-950">"Execute as: Me"</strong> and <strong className="text-amber-950">"Who has access: Anyone"</strong>.
                    </li>
                  </ol>
                </div>

                {/* Instruction Code Box */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">
                    📋 Google Apps Script — Deploy this Code In Sheets
                  </label>
                  <div className="bg-slate-900 leading-relaxed text-[#a8d9a8] font-mono text-[10px] rounded-xl p-4 overflow-auto max-h-48 whitespace-pre">
                    {scriptCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#1a2a6c] font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-600" /> : null}
                    <span>{copiedCode ? 'Copied!' : 'Copy code snippet'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Local Storage Card */}
      <div className="bg-white rounded-xl border border-slate-200/50 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-[#1a2a6c] font-black text-sm border-b border-slate-100 pb-2.5">
          <FileJson size={18} />
          <h2>Local Database Backups</h2>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <h3 className="text-slate-800 font-extrabold text-sm">Download Backup File</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Download a complete locally saved member array in JSON format.
              </p>
            </div>
            <button
              onClick={onExport}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#1a2a6c] font-bold text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              Export JSON
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <h3 className="text-slate-800 font-extrabold text-sm">Restore/Upload JSON</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Upload a verified local JSON database file to append profiles.
              </p>
            </div>
            <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#1a2a6c] font-bold text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap">
              <span>Import JSON</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={onImport} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <h3 className="text-slate-800 font-extrabold text-sm">Wipe Local Database</h3>
              <p className="text-red-500 font-semibold text-xs mt-0.5">
                Permanently purge all offline members currently held in IndexedDB.
              </p>
            </div>
            <button
              onClick={onClear}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <Trash2 size={12} />
              <span>Clear Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-slate-200/50 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 text-slate-800 font-black text-sm">
          <Info size={18} />
          <h2>Application Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <dt className="text-slate-400 font-semibold">Build Version</dt>
          <dd className="text-slate-800 font-bold text-right">2.0.0 (PWA Release)</dd>

          <dt className="text-slate-400 font-semibold">Active Members</dt>
          <dd className="text-slate-800 font-bold text-right">{membersCount}</dd>

          <dt className="text-slate-400 font-semibold">Local Storage engine</dt>
          <dd className="text-slate-800 font-bold text-right">IndexedDB (W3C Standard)</dd>

          <dt className="text-slate-400 font-semibold">Cloud sync channel</dt>
          <dd className="text-[#1a2a6c] font-black text-right truncate" title={scriptUrl || 'No active connection endpoint'}>
            {scriptUrl ? 'Configured URL' : 'Not Connected'}
          </dd>
        </div>
      </div>
    </div>
  );
};
