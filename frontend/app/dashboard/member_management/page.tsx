'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Mail, Plus, Search, Loader2, User, X, Trash2, Shield, UserCog } from 'lucide-react';
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
  onEditRole: (member: Member) => void;
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
    color: '#6d28d922',
    textColor: '#6d28d9',
  },
  MEMBER: {
    label: 'Member',
    icon: <User size={11} />,
    color: '#0f766e1a',
    textColor: '#0f766e',
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
      await onSave(member.user_id, role, member.mess_id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#120a33]/65 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-lg border border-white/70 bg-white/90 shadow-[0_28px_80px_rgba(65,103,153,0.26)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
        <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#2f80ed]/14 blur-2xl" />

        <div className="relative flex items-center justify-between border-b border-[#d8e6f8] px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Mess Management</p>
            <h2 className="mt-1 text-xl font-black text-[#172554]">Change Member Role</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e6f8] bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#dcebff]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-[#d8e6f8] bg-[#edf5ff] p-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg font-black"
              style={{ backgroundColor: `${avatarColor(member.user_id)}18`, borderColor: `${avatarColor(member.user_id)}55`, color: avatarColor(member.user_id) }}
            >
              {getInitials(member.user.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-[#172554]">{member.user.name}</h3>
              <p className="truncate text-sm font-semibold text-[#6b7a99]">{member.user.email}</p>
            </div>
          </div>

          <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
            Role
          </label>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(['MEMBER', 'MANAGER'] as MembershipRole[]).map((r) => {
              const cfg = ROLE_CONFIG[r];
              const selected = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black transition active:scale-[0.98] ${
                    selected
                      ? 'border-[#2f80ed]/40 bg-[#e7f1ff] text-[#2f80ed] shadow-[0_12px_28px_rgba(47,128,237,0.16)]'
                      : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-[#a9ccfb] hover:bg-[#edf5ff]'
                  }`}
                >
                  <span style={{ color: selected ? cfg.textColor : undefined }}>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.6fr]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-12 rounded-xl border border-[#d8e6f8] bg-white px-4 font-black text-[#53617d] transition hover:bg-[#edf5ff] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 font-black text-white shadow-[0_16px_35px_rgba(47,128,237,0.30)] transition hover:shadow-[0_20px_42px_rgba(47,128,237,0.38)] disabled:opacity-70"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Saving...' : 'Save Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Member Card ───────────────────────────────────────────────────────────
function MemberCard({ member, onEditRole, onRemove, removingId }: MemberCardProps) {
  const cfg = ROLE_CONFIG[member.role];
  const isRemoving = removingId === member.id;
  const avatarBg = avatarColor(member.user_id);

  return (
    <div className="group relative w-full overflow-hidden rounded-lg border border-white/70 bg-white/88 shadow-[0_18px_45px_rgba(65,103,153,0.16)] transition-all duration-300 hover:-translate-y-1 hover:border-[#a9ccfb] hover:shadow-[0_24px_60px_rgba(47,128,237,0.20)]">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#2f80ed]/10 blur-2xl transition group-hover:bg-[#2f80ed]/18" />
      <div className="absolute -bottom-14 -left-12 h-28 w-28 rounded-full bg-[#58d68d]/12 blur-2xl" />

      <div className="relative flex min-h-[260px] flex-col p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-xl font-black shadow-inner sm:h-16 sm:w-16 sm:text-2xl"
            style={{ backgroundColor: `${avatarBg}18`, borderColor: `${avatarBg}55`, color: avatarBg }}
          >
            {getInitials(member.user.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-[#172554] sm:text-lg">
                  {member.user.name}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-[#6b7a99] sm:text-sm">
                  <Mail size={14} className="shrink-0 text-[#2f80ed]" />
                  {member.user.email}
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-600">
                Active
              </span>
            </div>

            <p className="mt-2 truncate text-sm font-bold text-[#2f80ed]">
              {member.mess.name}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className="flex items-center gap-2 rounded-2xl border px-3 py-3"
            style={{ backgroundColor: cfg.color, borderColor: `${cfg.textColor}33`, color: cfg.textColor }}
          >
            {cfg.icon}
            <span className="text-sm font-black">{cfg.label}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#d8e6f8] bg-[#edf5ff] px-3 py-3 text-[#2f80ed]">
            <CalendarDays size={14} />
            <span className="truncate text-xs font-bold">Joined {formatDate(member.joined_at)}</span>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
          <button
            onClick={() => onEditRole(member)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2f80ed]/25 bg-[#e7f1ff] px-3 text-sm font-black text-[#2f80ed] transition hover:border-[#2f80ed]/50 hover:bg-[#dcebff] active:scale-[0.98]"
          >
            <UserCog size={16} />
            <span className="truncate">Change Role</span>
          </button>

          <button
            onClick={() => onRemove(member)}
            disabled={isRemoving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#ff4d4f]/25 bg-[#fff0f0] px-3 text-sm font-black text-[#ff4d4f] transition hover:border-[#ff4d4f]/45 hover:bg-[#ffe5e5] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRemoving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span className="truncate">{isRemoving ? 'Removing' : 'Remove'}</span>
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#120a33]/65 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[calc(100vh-32px)] w-full max-w-[460px] overflow-hidden rounded-[24px] border border-[#6d3df4]/20 bg-white shadow-[0_28px_80px_rgba(18,10,51,0.35)]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#26106f] via-[#6d3df4] to-[#f43f8f]" />
        <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#6d3df4]/12 blur-2xl" />
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-[#6d3df4]/10 px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6d3df4]">Mess Management</p>
            <h2 className="mt-1 text-xl font-black text-[#171044]">Add New Member</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#6d3df4]/15 bg-[#f5f2ff] text-[#4c2cc5] transition hover:border-[#6d3df4]/35 hover:bg-[#ebe4ff]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative max-h-[calc(100vh-120px)] overflow-y-auto p-5 sm:p-6">
          {/* Email Input */}
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#7c70a8]">
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="h-12 w-full rounded-2xl border border-[#6d3df4]/15 bg-[#fbfaff] px-4 text-sm font-semibold text-[#171044] outline-none placeholder:text-[#9189af] focus:border-[#6d3df4]/60 focus:ring-4 focus:ring-[#6d3df4]/10"
            />
          </div>

          {/* Mess Selection */}
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#7c70a8]">
              Select Mess
            </label>
            <select
              value={selectedMess}
              onChange={(e) => setSelectedMess(e.target.value)}
              className="h-12 w-full rounded-2xl border border-[#6d3df4]/15 bg-[#fbfaff] px-4 text-sm font-black text-[#171044] outline-none focus:border-[#6d3df4]/60 focus:ring-4 focus:ring-[#6d3df4]/10"
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
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#7c70a8]">
              Role
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(['MEMBER', 'MANAGER'] as MembershipRole[]).map((r) => {
                const cfg = ROLE_CONFIG[r]
                const selected = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex min-h-[58px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-4 text-sm font-black transition active:scale-[0.98] ${
                      selected
                        ? 'border-[#6d3df4]/40 bg-[#f3efff] text-[#4c2cc5] shadow-[0_12px_28px_rgba(109,61,244,0.16)]'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-[#6d3df4]/25 hover:bg-[#faf8ff]'
                    }`}
                  >
                    <span style={{ color: selected ? cfg.textColor : undefined }}>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.6fr]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4c2cc5] to-[#6d3df4] px-4 font-black text-white shadow-[0_16px_35px_rgba(109,61,244,0.30)] transition hover:shadow-[0_20px_42px_rgba(109,61,244,0.42)] disabled:opacity-70"
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
        prev.map(m => m.user_id === memberId ? { ...m, role } : m)
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
      await apiClient.removeMember(member.mess_id, member.user_id);
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
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-500/25 bg-red-50 p-4 text-red-600">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xl">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c70a8]" size={22} />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[52px] w-full rounded-xl border border-[#d8e6f8] bg-white/80 py-3 pl-12 pr-4 text-[#172554] shadow-[0_12px_35px_rgba(65,103,153,0.10)] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 py-3 font-black text-white shadow-[0_16px_35px_rgba(47,128,237,0.30)] transition-all hover:shadow-[0_20px_42px_rgba(47,128,237,0.38)] active:scale-[0.98] md:w-auto"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
