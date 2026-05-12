'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2, User, X, ChevronDown, Trash2, Shield, UserMinus } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';

// ─── Types & Interfaces ─────────────────────────────────────────────────────
type MembershipRole = 'MANAGER' | 'MEMBER';

interface Mess {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  mess_id: string;
  user_id: string;
  role: MembershipRole;
  joined_at: string;
  left_at?: string | null;
  is_active: boolean;
  created_by?: string | null;

  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
    phone?: string | null;
    role?: string;
  };

  mess: {
    id: string;
    name: string;
  };
}

interface MembersSectionProps {
  organizerId?: string;
}

interface MemberCardProps {
  member: Member;
  onEditRole: (member: Member, newRole: MembershipRole) => void;
  onRemove: (member: Member) => void;
  removingId: string | null;
}

interface EditRoleModalProps {
  member: Member;
  onClose: () => void;
  onSave: (memberId: string, role: MembershipRole, messId: string) => Promise<void>;
}

interface AddMemberModalProps {
  onClose: () => void;
  onAdd: (data: { email: string; role: MembershipRole; messId: string }) => Promise<void>;
}

// ─── ROLE_CONFIG ───────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<MembershipRole, { label: string; icon: React.ReactNode; color: string; textColor: string }> = {
  MANAGER: {
    label: 'Manager',
    icon: <Shield size={11} />,
    color: '#6366f122',
    textColor: '#a5b4fc',
  },
  MEMBER: {
    label: 'Member',
    icon: <User size={11} />,
    color: 'rgba(255,255,255,0.07)',
    textColor: 'rgba(255,255,255,0.85)',
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e'];

const avatarColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ─── Edit Role Modal ───────────────────────────────────────────────────────
function EditRoleModal({ member, onClose, onSave }: EditRoleModalProps) {
  const [role, setRole] = useState<MembershipRole>(member.role);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(member.id, role, member.mess_id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (your modal JSX remains the same - only handleSave was fixed)
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Rest of your EditRoleModal JSX (unchanged) */}
      {/* ... */}
    </div>
  );
}

// ─── Member Card ───────────────────────────────────────────────────────────
function MemberCard({ member, onEditRole, onRemove, removingId }: MemberCardProps) {
  const cfg = ROLE_CONFIG[member.role];
  const isRemoving = removingId === member.id;
  const avatarBg = avatarColor(member.user_id);

  return (
    <div className="w-full max-w-[350px] h-[240px] bg-[#0f172a] border border-slate-700/50 rounded-2xl overflow-hidden 
                    hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 group">
      
      {/* Top Accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="p-5 flex flex-col h-full">
        {/* Avatar + Info */}
        <div className="flex gap-4">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold border-2 flex-shrink-0"
            style={{ backgroundColor: `${avatarBg}22`, borderColor: avatarBg, color: avatarBg }}
          >
            {getInitials(member.user.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-white truncate">
                {member.user.name}
              </h3>
              <span className="px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                ACTIVE
              </span>
            </div>

            <p className="text-slate-400 text-sm mt-1 truncate">
              {member.user.email}
            </p>
            <p className="text-indigo-400 text-sm font-medium mt-0.5">
              {member.mess.name}
            </p>
          </div>
        </div>

        {/* Role */}
        <div className="mt-4 inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full w-fit">
          {cfg.icon}
          <span className="text-sm font-semibold text-slate-200">{cfg.label}</span>
        </div>

        {/* Joined Date */}
        <div className="text-xs text-slate-500 mt-auto text-right mb-4">
          Joined {formatDate(member.joined_at)}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={() => onEditRole(member, member.role)}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-indigo-500/50 text-indigo-300 
                       rounded-xl font-semibold text-sm transition-all active:scale-95"
          >
            Change Role
          </button>

          <button
            onClick={() => onRemove(member)}
            disabled={isRemoving}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-rose-500/50 text-rose-300 
                       rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Member Modal ──────────────────────────────────────────────────────
// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd }: AddMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MembershipRole>('MEMBER')
  const [selectedMess, setSelectedMess] = useState('')
  const [messes, setMesses] = useState<Mess[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMesses()
  }, [])

  async function loadMesses() {
    try {
      const res = await apiClient.getMesses()
      const data = res.data
      const messList = Array.isArray(data) ? data : data ? [data] : []
      setMesses(messList)
    } catch (err) {
      console.error('Failed to load messes', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return setError('Email is required')
    if (!selectedMess) return setError('Please select a mess')

    setError('')
    setLoading(true)

    try {
      await onAdd({
        email: email.trim(),
        role,
        messId: selectedMess,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (   // ← Make sure this return is present
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'linear-gradient(135deg, #0d1b2e 0%, #162035 60%, #1a2640 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Mess Management</p>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#fff' }}>Add New Member</h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255,255,255,0.06)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'rgba(255,255,255,0.6)' 
            }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* Email Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              style={{ 
                width: '100%', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: '10px', 
                padding: '11px 14px', 
                fontSize: '14px', 
                color: '#fff' 
              }}
            />
          </div>

          {/* Mess Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
              Select Mess
            </label>
            <select
              value={selectedMess}
              onChange={(e) => setSelectedMess(e.target.value)}
              style={{
                width: '100%', 
                background: '#1a2640', 
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '10px',
                padding: '11px 14px', 
                fontSize: '14px', 
                outline: 'none',
              }}
            >
              <option value="">Select Mess</option>
              {messes.map((mess) => (
                <option key={mess.id} value={mess.id}>
                  {mess.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
              Role
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(['MEMBER', 'MANAGER'] as MembershipRole[]).map((r) => {
                const cfg = ROLE_CONFIG[r]
                const selected = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      background: selected ? cfg.color : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selected ? cfg.textColor + '55' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '10px',
                      padding: '10px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: selected ? cfg.textColor : 'rgba(255,255,255,0.35)' }}>{cfg.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: selected ? cfg.textColor : 'rgba(255,255,255,0.4)' }}>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239,68,68,0.1)', 
              border: '1px solid rgba(239,68,68,0.25)', 
              borderRadius: '8px', 
              padding: '10px 12px', 
              marginBottom: '16px', 
              color: '#f87171' 
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', color: 'rgba(255,255,255,0.6)' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                flex: 2, 
                background: loading ? 'rgba(99,102,241,0.5)' : '#6366f1', 
                border: 'none', 
                borderRadius: '10px', 
                padding: '11px', 
                color: '#fff', 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px' 
              }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────
// export default function MembersSection({ organizerId }: MembersSectionProps) {
//   const [members, setMembers] = useState<Member[]>([]);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [editingMember, setEditingMember] = useState<Member | null>(null);
//   const [removingId, setRemovingId] = useState<string | null>(null);
//   const [search, setSearch] = useState('');
//   const [filterRole, setFilterRole] = useState<MembershipRole | 'ALL'>('ALL');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [meta, setMeta] = useState<any>(null);
//   const [page, setPage] = useState(1);
//   const [searchTerm, setSearchTerm] = useState('');

//   useEffect(() => {
//     loadMembers();
//   }, [page, searchTerm]);

//   async function loadMembers() {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await apiClient.getAllMembers({
//         page,
//         limit: 20,
//         searchTerm: searchTerm.trim() || undefined,
//       });

//       const membersData = Array.isArray(response.data) ? response.data : [];
//       setMembers(membersData);
//       setMeta(response.meta || null);
//     } catch (err) {
//       const errorMsg = err instanceof ApiError ? err.message : 'Failed to load members';
//       setError(errorMsg);
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleAddMember(data: { email: string; role: MembershipRole; messId: string }) {
//     try {
//       await apiClient.addMember(data.messId, { email: data.email, role: data.role });
//       await loadMembers();
//     } catch (err) {
//       const errorMsg = err instanceof ApiError ? err.message : 'Failed to add member';
//       setError(errorMsg);
//       throw err;
//     }
//   }

//   async function handleEditRole(memberId: string, role: MembershipRole, messId: string) {
//     try {
//       setError(null);
//       await apiClient.updateMemberRole(messId, memberId, role);

//       setMembers((prev) =>
//         prev.map((m) => (m.id === memberId ? { ...m, role } : m))
//       );
//     } catch (err) {
//       const errorMsg = err instanceof ApiError ? err.message : 'Failed to update role';
//       setError(errorMsg);
//       throw err;
//     }
//   }

//   async function handleRemove(member: Member) {
//     if (!member.mess_id) return;
//     setRemovingId(member.id);
//     try {
//       setError(null);
//       await apiClient.removeMember(member.mess_id, member.id);
//       setMembers((prev) => prev.filter((m) => m.id !== member.id));
//     } catch (err) {
//       const errorMsg = err instanceof ApiError ? err.message : 'Failed to remove member';
//       setError(errorMsg);
//     } finally {
//       setRemovingId(null);
//     }
//   }

//   const filtered = members.filter((m) => {
//     const matchSearch =
//       m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
//       m.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
//       m.mess?.name?.toLowerCase().includes(search.toLowerCase());

//     const matchRole = filterRole === 'ALL' || m.role === filterRole;
//     return matchSearch && matchRole;
//   });

//   const activeCount = members.filter((m) => m.is_active).length;

//   return (
//     // Your full JSX (with small fixes in onEditRole calls)
//     <>
//       <div className="p-4 sm:p-6 lg:p-8">
//         {/* ... your header, search, filters ... */}

//        {/* Responsive Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
//         {filtered.map((member) => (
//           <MemberCard
//             key={member.id}
//             member={member}
//             onEditRole={(mem, newRole) => handleEditRole(mem.id, newRole, mem.mess_id)}
//             onRemove={handleRemove}
//             removingId={removingId}
//           />
//         ))}
//       </div>

//         {/* Modals */}
//         {showAddModal && <AddMemberModal onClose={() => setShowAddModal(false)} onAdd={handleAddMember} />}

//         {editingMember && (
//           <EditRoleModal
//             member={editingMember}
//             onClose={() => setEditingMember(null)}
//             onSave={handleEditRole}
//           />
//         )}
//       </div>
//     </>
//   );
// }


export default function MembersSection({ organizerId }: MembersSectionProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<MembershipRole | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);

  // Load Members
  useEffect(() => {
    loadMembers();
  }, [search]);

  async function loadMembers() {
    try {
      setLoading(true);
      const response = await apiClient.getAllMembers({
        page: 1,
        limit: 50,
        searchTerm: search.trim() || undefined,
      });

      const membersData = Array.isArray(response.data) ? response.data : [];
      setMembers(membersData);
      setMeta(response.meta || null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }

  // Handle Add Member
  async function handleAddMember(data: { email: string; role: MembershipRole; messId: string }) {
    try {
      await apiClient.addMember(data.messId, {
        email: data.email,
        role: data.role,
      });
      setShowAddModal(false);
      loadMembers(); // Refresh
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to add member';
      setError(errorMsg);
    }
  }

  // Handle Change Role
  async function handleEditRole(memberId: string, role: MembershipRole, messId: string) {
    try {
      await apiClient.updateMemberRole(messId, memberId, role);
      
      setMembers(prev => 
        prev.map(m => m.id === memberId ? { ...m, role } : m)
      );
      setEditingMember(null);
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to update role';
      setError(errorMsg);
    }
  }

  // Handle Remove
  async function handleRemove(member: Member) {
    if (!member.mess_id) return;
    
    setRemovingId(member.id);
    try {
      await apiClient.removeMember(member.mess_id, member.id);
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  }

  const filtered = members.filter((m) => {
    const matchSearch = 
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase()) ||
      m.mess.name.toLowerCase().includes(search.toLowerCase());
    
    const matchRole = filterRole === 'ALL' || m.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xl">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={30} />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 pl-12 py-3 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filtered.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onEditRole={setEditingMember}        // ← Fixed: Direct state setter
            onRemove={handleRemove}
            removingId={removingId}
          />
        ))}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMember}
        />
      )}

      {editingMember && (
        <EditRoleModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleEditRole}
        />
      )}
    </div>
  );
}