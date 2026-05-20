export interface Member {
  id: string;
  mid: string; // Membership number, e.g. EBCCLLV000001
  bial: string; // Bial group number/name
  title?: string;
  name: string;
  phone?: string;
  dob?: string;
  pob?: string; // Place of birth
  parents?: string;
  baptDate?: string;
  baptMode?: string;
  tang?: string; // Officiating pastor for baptism
  mtype?: string; // PM, JCM, FCM
  ordained?: string;
  rel?: string; // Relationship status
  wed?: string; // Wedding date
  kitenni?: string; // Church wedding date
  kitennamun?: string; // Church wedding place
  kite?: string; // Officiating pastor for wedding
  wm?: string; // Male witness
  wf?: string; // Female witness
  trans?: string; // Transfer date (Pemlut/Potni)
  death?: string; // Deceased date
  addr?: string;
  thil?: string; // Thilpiak option
  designation?: string; // Local committee/church designation, e.g. "Secretary"
  updatedAt: string;
}

export interface SyncOp {
  qid?: number;
  action: 'upsert' | 'delete' | 'batch';
  member?: Member;
  id?: string; // Used for delete actions
  ops?: SyncOp[];
  ts: number;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  role: 'superadmin' | 'admin' | 'user';
}
