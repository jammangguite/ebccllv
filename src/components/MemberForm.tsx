import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { Lock, Plus } from 'lucide-react';

interface MemberFormProps {
  member: Member | null;
  thilOptions: string[];
  onAddThilOption: (option: string) => void;
  onSave: (member: Member) => Promise<void>;
  members: Member[]; // Used to calculate suggestions/pastor lists and autogenerate index numbers
  onCancel: () => void;
}

export const MemberForm: React.FC<MemberFormProps> = ({
  member,
  thilOptions,
  onAddThilOption,
  onSave,
  members,
  onCancel
}) => {
  const isEdit = !!member;
  
  // States
  const [mid, setMid] = useState('');
  const [bial, setBial] = useState('');
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [pob, setPob] = useState('');
  const [parents, setParents] = useState('');
  const [baptDate, setBaptDate] = useState('');
  const [baptMode, setBaptMode] = useState('');
  const [tang, setTang] = useState('');
  const [mtype, setMtype] = useState('');
  const [ordained, setOrdained] = useState('');
  const [rel, setRel] = useState('');
  const [wed, setWed] = useState('');
  const [kitenni, setKitenni] = useState('');
  const [kitennamun, setKitennamun] = useState('');
  const [kite, setKite] = useState('');
  const [wm, setWm] = useState('');
  const [wf, setWf] = useState('');
  const [trans, setTrans] = useState('');
  const [death, setDeath] = useState('');
  const [addr, setAddr] = useState('');
  const [thil, setThil] = useState('');
  const [designation, setDesignation] = useState('');
  const [commType, setCommType] = useState('');
  const [commRole, setCommRole] = useState('');
  const [customDesig, setCustomDesig] = useState('');

  // Pastor/tangsaktu suggestions
  const [tangs, setTangs] = useState<string[]>([]);
  const [kites, setKites] = useState<string[]>([]);

  useEffect(() => {
    // Collect unique officiating pastors for suggestions list
    setTangs(Array.from(new Set(members.map((m) => m.tang).filter(Boolean))) as string[]);
    setKites(Array.from(new Set(members.map((m) => m.kite).filter(Boolean))) as string[]);

    if (member) {
      setMid(member.mid || '');
      setBial(member.bial || '');
      setTitle(member.title || '');
      setName(member.name || '');
      setPhone(member.phone || '');
      setDob(member.dob || '');
      setPob(member.pob || '');
      setParents(member.parents || '');
      setBaptDate(member.baptDate || '');
      setBaptMode(member.baptMode || '');
      setTang(member.tang || '');
      setMtype(member.mtype || '');
      setOrdained(member.ordained || '');
      setRel(member.rel || '');
      setWed(member.wed || '');
      setKitenni(member.kitenni || '');
      setKitennamun(member.kitennamun || '');
      setKite(member.kite || '');
      setWm(member.wm || '');
      setWf(member.wf || '');
      setTrans(member.trans || '');
      setDeath(member.death || '');
      setAddr(member.addr || '');
      setThil(member.thil || '');
      
      const des = member.designation || '';
      setDesignation(des);
      
      // Parse committee and role
      if (des) {
        if (des.startsWith('Local Committee - ')) {
          setCommType('Local Committee');
          setCommRole(des.replace('Local Committee - ', ''));
        } else if (des.startsWith('Missions Committee - ')) {
          setCommType('Missions Committee');
          setCommRole(des.replace('Missions Committee - ', ''));
        } else if (des.startsWith('Dorcas Committee - ')) {
          setCommType('Dorcas Committee');
          setCommRole(des.replace('Dorcas Committee - ', ''));
        } else if (des.startsWith('BYF Committee - ')) {
          setCommType('BYF Committee');
          setCommRole(des.replace('BYF Committee - ', ''));
        } else if (des.startsWith('Baptist Children Department - ')) {
          setCommType('Baptist Children Department');
          setCommRole(des.replace('Baptist Children Department - ', ''));
        } else if (des === 'Baptist Children Department') {
          setCommType('Baptist Children Department');
          setCommRole('');
        } else {
          setCommType('Custom');
          setCustomDesig(des);
        }
      } else {
        setCommType('');
        setCommRole('');
        setCustomDesig('');
      }
    } else {
      setMid('');
      setBial('');
      setTitle('');
      setName('');
      setPhone('');
      setDob('');
      setPob('');
      setParents('');
      setBaptDate('');
      setBaptMode('');
      setTang('');
      setMtype('');
      setOrdained('');
      setRel('');
      setWed('');
      setKitenni('');
      setKitennamun('');
      setKite('');
      setWm('');
      setWf('');
      setTrans('');
      setDeath('');
      setAddr('');
      setDesignation('');
      setCommType('');
      setCommRole('');
      setCustomDesig('');
      // Default Thil to first option if available
      setThil(thilOptions[0] || '');
    }
  }, [member, members, thilOptions]);

  // Autogenerate sequential membership ID
  const genMID = () => {
    const used = new Set(members.map((m) => m.mid).filter(Boolean));
    let n = 1;
    while (used.has('EBCCLLV' + String(n).padStart(6, '0'))) n++;
    return 'EBCCLLV' + String(n).padStart(6, '0');
  };

  const handleAddThilOptionClick = () => {
    const choice = prompt('Enter a new Thilpiak registry option:')?.trim();
    if (choice && !thilOptions.includes(choice)) {
      onAddThilOption(choice);
      setThil(choice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Min (Name) is a required field.');
      return;
    }

    const finalMID = mid.trim() || genMID();
    
    // Validate uniqueness of custom/autogenerated Member ID
    const duplicate = members.find((m) => m.mid === finalMID && m.id !== member?.id);
    if (duplicate) {
      alert(`Membership No. is already assigned to: ${duplicate.name}`);
      return;
    }

    let finalDesignation = '';
    if (commType === 'Custom') {
      finalDesignation = customDesig.trim();
    } else if (commType && commRole) {
      finalDesignation = `${commType} - ${commRole}`;
    } else if (commType) {
      finalDesignation = commType;
    }

    const saved: Member = {
      id: member?.id || 'm' + Date.now(),
      mid: finalMID,
      bial: bial.trim(),
      title,
      name: name.trim(),
      phone: phone.trim(),
      dob,
      pob: pob.trim(),
      parents: parents.trim(),
      baptDate,
      baptMode: baptMode.trim(),
      tang: tang.trim(),
      mtype,
      ordained,
      rel: rel.trim(),
      wed,
      kitenni,
      kitennamun: kitennamun.trim(),
      kite: kite.trim(),
      wm: wm.trim(),
      wf: wf.trim(),
      trans,
      death,
      addr: addr.trim(),
      thil,
      designation: finalDesignation.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    await onSave(saved);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h1 className="text-[#1a2a6c] text-xl font-bold tracking-tight">
          {isEdit ? '✏️ Edit Member Profile' : '➕ Register Member'}
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          {isEdit ? `Modifying records for "${member?.name}"` : 'Input complete details of the church member.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/50 p-6 shadow-xs space-y-6">
        
        {/* Personal Details SECTION */}
        <div>
          <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-wider bg-slate-50 p-2 rounded-lg border-l-3 border-[#1a2a6c] mb-4">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Membership ID */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Membership No. (ID Code)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={mid}
                  onChange={(e) => setMid(e.target.value.toUpperCase())}
                  disabled={isEdit && !!member?.mid}
                  placeholder={`Auto: ${genMID()}`}
                  className="flex-1 bg-white disabled:bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-[#1a2a6c]"
                />
                {isEdit && member?.mid && (
                  <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-md" title="MIDs cannot be altered after creation to preserve relational integrity.">
                    <Lock size={12} />
                    <span>LOCKED</span>
                  </span>
                )}
              </div>
            </div>

            {/* Bial No */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Bial No. / Sector
              </label>
              <input
                type="text"
                value={bial}
                onChange={(e) => setBial(e.target.value)}
                placeholder="Bial value"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            {/* Title & Name */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Title
                </label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
                >
                  <option value="">None</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Upa">Upa</option>
                  <option value="Pastor">Pastor</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Rev.">Rev.</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Min (Name) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            {/* DOB & POB */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Pianna Mun (Place of Birth)
              </label>
              <input
                type="text"
                value={pob}
                onChange={(e) => setPob(e.target.value)}
                placeholder="Birthplace"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            {/* Parents */}
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Nu leh Pa Min (Parents Name)
              </label>
              <input
                type="text"
                value={parents}
                onChange={(e) => setParents(e.target.value)}
                placeholder="e.g. John Doe & Jane Doe"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>
          </div>
        </div>

        {/* Spiritual & Membership SECTION */}
        <div>
          <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-wider bg-slate-50 p-2 rounded-lg border-l-3 border-[#1a2a6c] mb-4">
            Spiritual &amp; Membership Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Baptisma Tanni (Baptism Date)
              </label>
              <input
                type="date"
                value={baptDate}
                onChange={(e) => setBaptDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Baptisma Tan Dan (Baptism Mode)
              </label>
              <input
                type="text"
                value={baptMode}
                onChange={(e) => setBaptMode(e.target.value)}
                placeholder="Mode / church ceremony"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            {/* Pastor suggestion datalist */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Tangsaktu (Baptizer Pastor)
              </label>
              <input
                type="text"
                value={tang}
                onChange={(e) => setTang(e.target.value)}
                list="pastors-tang-datalist"
                placeholder="Officiating Pastor"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
              <datalist id="pastors-tang-datalist">
                {tangs.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Membership Type
              </label>
              <select
                value={mtype}
                onChange={(e) => setMtype(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              >
                <option value="">— Select —</option>
                <option value="PM">PM</option>
                <option value="JCM">JCM</option>
                <option value="FCM">FCM</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Ordained Date (if applicable)
              </label>
              <input
                type="date"
                value={ordained}
                onChange={(e) => setOrdained(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>


          </div>
        </div>

        {/* Family & Marriage SECTION */}
        <div>
          <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-wider bg-slate-50 p-2 rounded-lg border-l-3 border-[#1a2a6c] mb-4">
            Marriage &amp; Family Records
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={rel}
                onChange={(e) => setRel(e.target.value)}
                placeholder="e.g. Single, Married, Widow"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Pasal/Zi Neih Ni (Marriage Date)
              </label>
              <input
                type="date"
                value={wed}
                onChange={(e) => setWed(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Kitenni Date
              </label>
              <input
                type="date"
                value={kitenni}
                onChange={(e) => setKitenni(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Kitennamun (Wedding Place)
              </label>
              <input
                type="text"
                value={kitennamun}
                onChange={(e) => setKitennamun(e.target.value)}
                placeholder="Place of wedding"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Kitengsaktu (Officiating Wedding Pastor)
              </label>
              <input
                type="text"
                value={kite}
                onChange={(e) => setKite(e.target.value)}
                list="pastors-kite-datalist"
                placeholder="Officiating Pastor"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
              <datalist id="pastors-kite-datalist">
                {kites.map((k) => <option key={k} value={k} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Pasal Witness
                </label>
                <input
                  type="text"
                  value={wm}
                  onChange={(e) => setWm(e.target.value)}
                  placeholder="Male Witness"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Numei Witness
                </label>
                <input
                  type="text"
                  value={wf}
                  onChange={(e) => setWf(e.target.value)}
                  placeholder="Female Witness"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Administration SECTION */}
        <div>
          <h2 className="text-[#1a2a6c] text-xs font-bold uppercase tracking-wider bg-slate-50 p-2 rounded-lg border-l-3 border-[#1a2a6c] mb-4">
            Spatuam a kizatna leh Thilpiak
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Saptuam a Kizatna Selection Form */}
            <div className="md:col-span-2 border border-[#1a2a6c]/10 rounded-xl p-4 bg-[#1a2a6c]/[0.02] space-y-3">
              <span className="text-[10px] uppercase font-bold text-[#1a2a6c] block tracking-wider">
                Spatuam a Kizatna (Committee &amp; Department Designation)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Committee Selector */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#1a2a6c]/80 block mb-1 font-mono">
                    Committee / Department
                  </label>
                  <select
                    value={commType}
                    onChange={(e) => {
                      setCommType(e.target.value);
                      setCommRole(''); // Reset role when changing committee
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-[#1a2a6c] focus:outline-none focus:border-[#1a2a6c]"
                  >
                    <option value="">None / No Committee</option>
                    <option value="Local Committee">Local Committee</option>
                    <option value="Missions Committee">Missions Committee</option>
                    <option value="Dorcas Committee">Dorcas Committee</option>
                    <option value="BYF Committee">BYF Committee</option>
                    <option value="Baptist Children Department">Baptist Children Department</option>
                    <option value="Custom">Custom Designation</option>
                  </select>
                </div>

                {/* Role / Office Standard Dynamic Selector */}
                {commType && commType !== 'Custom' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#1a2a6c]/80 block mb-1 font-mono">
                      Role / Designation
                    </label>
                    <select
                      value={commRole}
                      onChange={(e) => setCommRole(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:outline-none focus:border-[#1a2a6c] text-[#1a2a6c]"
                    >
                      <option value="">— Select Role / Designation —</option>
                      {commType === 'Dorcas Committee' ? (
                        <>
                          <option value="President">President</option>
                          <option value="Vice President">Vice President</option>
                          <option value="Secretary">Secretary</option>
                          <option value="Asst. Secretary">Asst. Secretary</option>
                          <option value="Finance">Finance</option>
                          <option value="Members">Members</option>
                        </>
                      ) : commType === 'Baptist Children Department' ? (
                        <>
                          <option value="Leader">Leader</option>
                          <option value="Secretary">Secretary</option>
                          <option value="Asst. Secretary">Asst. Secretary</option>
                          <option value="Finance">Finance</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Members">Members</option>
                        </>
                      ) : (
                        <>
                          <option value="Chairman">Chairman</option>
                          <option value="Vice Chairman">Vice Chairman</option>
                          <option value="Secretary">Secretary</option>
                          <option value="Asst. Secretary">Asst. Secretary</option>
                          <option value="Finance">Finance</option>
                          <option value="Members">Members</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {/* Custom Designation Raw Input */}
                {commType === 'Custom' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 font-mono">
                      Specify Designation
                    </label>
                    <input
                      type="text"
                      value={customDesig}
                      onChange={(e) => setCustomDesig(e.target.value)}
                      placeholder="e.g. Elder, General Secretary, etc."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#1a2a6c]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Pemlutni / Potni (Transfer Date)
              </label>
              <input
                type="date"
                value={trans}
                onChange={(e) => setTrans(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Sihni (Deceased Date)
              </label>
              <input
                type="date"
                value={death}
                onChange={(e) => setDeath(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Address (Khosung / Mundang Details)
              </label>
              <input
                type="text"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="Full address details"
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            {/* Thilpiak dropdown with add button */}
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Thilpiak Option
              </label>
              <div className="flex gap-2">
                <select
                  value={thil}
                  onChange={(e) => setThil(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#1a2a6c]"
                >
                  {thilOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddThilOptionClick}
                  className="flex items-center gap-1 bg-[#1a2a6c] hover:bg-[#2d4aaa] text-white px-3 py-2 rounded-lg font-bold text-sm cursor-pointer whitespace-nowrap"
                  title="Add custom option"
                >
                  <Plus size={16} />
                  <span>Add Custom</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#1a2a6c] hover:bg-[#2d4aaa] text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            💾 {isEdit ? 'Update Member' : 'Save Member'}
          </button>
        </div>
      </form>
    </div>
  );
};
