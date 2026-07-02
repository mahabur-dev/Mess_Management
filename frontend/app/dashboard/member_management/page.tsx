'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Mail, Plus, Search, Loader2, User, X, Trash2, Shield, UserCog, ChevronDown, ChevronUp, MoreHorizontal, Phone, Users, Pencil, Ban, CheckCircle, DoorOpen, DollarSign, Building } from 'lucide-react';
import { apiClient, ApiError, type Mess as ApiMess } from '@/lib/api-client';
import { DashboardHeader } from '@/components/dashboard-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Types & Interfaces ─────────────────────────────────────────────────────
type MembershipRole = 'MANAGER' | 'MEMBER';

interface MessRoom {
  roomName: string;
  perPerson?: number | null;
  roomPrice?: number | null;
  occupiedSeats?: number | null;
  availableSeats?: number | null;
  isFull?: boolean | null;
}

interface Mess {
  id: string;
  name: string;
  rooms?: MessRoom[] | null;
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
  room_no?: string | null;
  monthly_rent?: string | null;
  deposit_amount?: string | null;

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

interface EditRoleModalProps {
  member: Member;
  onClose: () => void;
  onSave: (memberId: string, role: MembershipRole, messId: string) => Promise<void>;
}

interface EditMemberModalProps {
  member: Member;
  activeMess: Mess | null;
  onClose: () => void;
  onSave: (memberId: string, data: EditMemberData) => Promise<void>;
}

interface EditMemberData {
  roomNo?: string;
  monthlyRent?: number;
  depositAmount?: number;
  isActive?: boolean;
  role?: MembershipRole;
}

interface AddMemberModalProps {
  activeMess: Mess | null;
  members: Member[];
  onClose: () => void;
  onAdd: (data: { email: string; role: MembershipRole; messId: string; roomNo?: string }) => Promise<void>;
}

// ─── ROLE_CONFIG ───────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<MembershipRole, { label: string; icon: React.ReactNode; color: string; textColor: string; bgColor: string }> = {
  MANAGER: {
    label: 'Manager',
    icon: <Shield size={12} />,
    color: '#6d28d922',
    textColor: '#6d28d9',
    bgColor: '#f5f3ff',
  },
  MEMBER: {
    label: 'Member',
    icon: <User size={12} />,
    color: '#0f766e1a',
    textColor: '#0f766e',
    bgColor: '#f0fdfa',
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

  // ─── Edit Member Modal ─────────────────────────────────────────────────────
function EditMemberModal({ member, activeMess, onClose, onSave }: EditMemberModalProps) {
  const [roomNo, setRoomNo] = useState<string>((member as any).room_no || '');
  const [monthlyRent, setMonthlyRent] = useState<string>((member as any).monthly_rent || '');
  const [depositAmount, setDepositAmount] = useState<string>((member as any).deposit_amount || '');
  const [isActive, setIsActive] = useState<boolean>(member.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!member.mess_id) return setError('No mess ID found');

    setError('');
    setLoading(true);

    try {
      const data: EditMemberData = {};
      if (roomNo.trim()) data.roomNo = roomNo.trim();
      if (monthlyRent) data.monthlyRent = Number(monthlyRent);
      if (depositAmount) data.depositAmount = Number(depositAmount);
      data.isActive = isActive;

      await onSave(member.user_id, data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  // Calculate room occupancy info
  const roomOccupancy = React.useMemo(() => {
    const rooms = activeMess?.rooms ?? [];
    return rooms.reduce<Record<string, { total: number; occupied: number }>>((acc, room) => {
      if (room.roomName) {
        acc[room.roomName] = { total: Number(room.perPerson ?? 1), occupied: 0 };
      }
      return acc;
    }, {});
  }, [activeMess]);

  // Calculate auto-rent for preview
  const selectedRoomRent = React.useMemo(() => {
    const rooms = activeMess?.rooms ?? [];
    const room = rooms.find(r => r.roomName === roomNo);
    if (!room || !room.roomPrice || !room.perPerson) return null;
    return Math.round(Number(room.roomPrice) / Number(room.perPerson));
  }, [roomNo, activeMess]);

  useEffect(() => {
    if (selectedRoomRent !== null && selectedRoomRent !== Number(monthlyRent)) {
      setMonthlyRent(String(selectedRoomRent));
    }
  }, [selectedRoomRent]);

  const availableRooms = activeMess?.rooms?.map(r => r.roomName) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#120a33]/65 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_28px_80px_rgba(65,103,153,0.26)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
        <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#2f80ed]/14 blur-2xl" />

        <div className="relative flex items-center justify-between border-b border-[#d8e6f8] px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Member Management</p>
            <h2 className="mt-1 text-xl font-black text-[#172554]">Edit Member</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e6f8] bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#dcebff]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative max-h-[calc(100vh-120px)] overflow-y-auto p-5 sm:p-6">
          {/* Member Info */}
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

          {/* Room Selection */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
              <DoorOpen size={12} className="mr-1 inline" />
              Room Assignment
            </label>
            <Select value={roomNo} onValueChange={setRoomNo}>
              <SelectTrigger className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] shadow-none outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10">
                <SelectValue placeholder="Select room (optional)" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-[#d8e6f8] bg-white shadow-[0_20px_45px_rgba(65,103,153,0.18)]">
                {availableRooms.map((room) => (
                  <SelectItem
                    key={room}
                    value={room}
                    className="rounded-lg px-3 py-2 text-sm font-bold text-[#172554] focus:bg-[#edf5ff] focus:text-[#2f80ed]"
                  >
                    {room}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Financial Fields */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                <DollarSign size={12} className="mr-1 inline" />
                Monthly Rent
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                placeholder="0.00"
                className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                <Building size={12} className="mr-1 inline" />
                Deposit Amount
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
              Membership Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition active:scale-[0.98] ${
                  isActive
                    ? 'border-emerald-500/40 bg-emerald-50 text-emerald-600 shadow-[0_8px_20px_rgba(16,185,129,0.16)]'
                    : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-[#a9ccfb] hover:bg-[#edf5ff]'
                }`}
              >
                <CheckCircle size={16} />
                Active
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition active:scale-[0.98] ${
                  !isActive
                    ? 'border-red-500/40 bg-red-50 text-red-600 shadow-[0_8px_20px_rgba(239,68,68,0.16)]'
                    : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-[#a9ccfb] hover:bg-[#edf5ff]'
                }`}
              >
                <Ban size={16} />
                Inactive
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ activeMess, members, onClose, onAdd }: AddMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MembershipRole>('MEMBER')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableRooms = React.useMemo(() => {
    const roomOccupancy = members.reduce<Record<string, number>>((acc, member) => {
      if (!member.is_active || member.mess_id !== activeMess?.id || !member.room_no) return acc;
      acc[member.room_no] = (acc[member.room_no] ?? 0) + 1;
      return acc;
    }, {});

    return (activeMess?.rooms ?? [])
      .map((room) => {
        const totalSeats = Number(room.perPerson ?? 0);
        const occupiedSeats = Number(room.occupiedSeats ?? roomOccupancy[room.roomName] ?? 0);
        const availableSeats =
          room.availableSeats ?? (totalSeats > 0 ? Math.max(totalSeats - occupiedSeats, 0) : null);

        return {
          ...room,
          occupiedSeats,
          availableSeats,
          isFull: room.isFull ?? (availableSeats !== null ? availableSeats <= 0 : false),
        };
      })
      .filter((room) => !room.isFull);
  }, [activeMess, members]);

  useEffect(() => {
    if (selectedRoom && !availableRooms.some((room) => room.roomName === selectedRoom)) {
      setSelectedRoom('');
    }
  }, [availableRooms, selectedRoom]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return setError('Email is required')
    if (!activeMess?.id) return setError('No active mess found')

    setError('')
    setLoading(true)

    try {
      await onAdd({
        email: email.trim(),
        role,
        messId: activeMess.id,
        roomNo: selectedRoom || undefined,
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
      <div className="relative max-h-[calc(100vh-32px)] w-full max-w-[480px] overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_28px_80px_rgba(65,103,153,0.26)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
        <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#2f80ed]/12 blur-2xl" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-[#d8e6f8] px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Members</p>
            <h2 className="mt-1 text-xl font-black text-[#172554]">Add New Member</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e6f8] bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#dcebff]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative max-h-[calc(100vh-120px)] overflow-y-auto p-5 sm:p-6">
          {/* Email Input */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
            />
          </div>

          {/* Selected Mess */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
              Selected Mess
            </label>
            <div className="flex h-[48px] w-full items-center rounded-xl border border-[#d8e6f8] bg-[#f8faff] px-4 text-sm font-bold text-[#172554]">
              {activeMess?.name || 'No mess available'}
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
              Select Room
            </label>
            <Select
              value={selectedRoom}
              onValueChange={setSelectedRoom}
              disabled={availableRooms.length === 0}
            >
              <SelectTrigger className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] shadow-none outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10">
                <SelectValue placeholder={availableRooms.length === 0 ? 'No seat-available room' : 'Choose room'} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-[#d8e6f8] bg-white shadow-[0_20px_45px_rgba(65,103,153,0.18)]">
                {availableRooms.map((room) => (
                  <SelectItem
                    key={room.roomName}
                    value={room.roomName}
                    className="rounded-lg px-3 py-2 text-sm font-bold text-[#172554] focus:bg-[#edf5ff] focus:text-[#2f80ed]"
                  >
                    {room.roomName}
                    {typeof room.availableSeats === 'number' ? ` (${room.availableSeats} seat left)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableRooms.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-[#8a9bb5]">
                All configured rooms are currently full. Add the member without a room or free up a seat first.
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
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
                    className={`flex min-h-[62px] flex-col items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition active:scale-[0.98] ${
                      selected
                        ? 'border-[#2f80ed]/40 bg-[#e7f1ff] text-[#2f80ed] shadow-[0_8px_20px_rgba(47,128,237,0.16)]'
                        : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-[#a9ccfb] hover:bg-[#f8faff]'
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
            <div className="mb-5 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

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
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 font-black text-white shadow-[0_16px_35px_rgba(47,128,237,0.30)] transition hover:shadow-[0_20px_42px_rgba(47,128,237,0.38)] disabled:opacity-70"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

  // ─── Mobile Member Row (card-style for small screens) ──────────────────────
function MobileMemberRow({ 
  member, 
  onEditMember,
  onEditRole, 
  onRemove, 
  removingId 
}: { 
  member: Member;
  onEditMember: (member: Member) => void;
  onEditRole: (member: Member) => void;
  onRemove: (member: Member) => void;
  removingId: string | null;
}) {
  const cfg = ROLE_CONFIG[member.role];
  const isRemoving = removingId === member.id;
  const avatarBg = avatarColor(member.user_id);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[#e6ebf4] bg-white shadow-sm transition-all hover:border-[#a9ccfb] hover:shadow-md">
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black"
          style={{ backgroundColor: `${avatarBg}18`, borderColor: `${avatarBg}55`, color: avatarBg }}
        >
          {getInitials(member.user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-black text-[#172554]">{member.user.name}</h3>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
          <p className="truncate text-xs font-semibold text-[#6b7a99]">{member.user.email}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e6ebf4] text-[#6b7a99] transition hover:bg-[#edf5ff] hover:text-[#2f80ed]"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#e6ebf4] px-4 py-3">
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7a99]">
              <Mail size={13} className="shrink-0 text-[#2f80ed]" />
              <span className="truncate">{member.user.email}</span>
            </div>
            {member.user.phone && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7a99]">
                <Phone size={13} className="shrink-0 text-[#58d68d]" />
                <span>{member.user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7a99]">
              <CalendarDays size={13} className="shrink-0 text-[#ffb84d]" />
              <span>Joined {formatDate(member.joined_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7a99]">
              <span className="shrink-0 text-[#2f80ed]">🏠</span>
              <span className="truncate">{member.mess.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => onEditMember(member)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#2f80ed]/20 bg-[#e7f1ff] text-xs font-bold text-[#2f80ed] transition hover:border-[#2f80ed]/40 hover:bg-[#dcebff] active:scale-[0.98]"
            >
              <Pencil size={14} />
              Edit
            </button>
            <button
              onClick={() => onEditRole(member)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#2f80ed]/20 bg-[#e7f1ff] text-xs font-bold text-[#2f80ed] transition hover:border-[#2f80ed]/40 hover:bg-[#dcebff] active:scale-[0.98]"
            >
              <UserCog size={14} />
              Role
            </button>
            <button
              onClick={() => onRemove(member)}
              disabled={isRemoving}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#ff4d4f]/20 bg-[#fff0f0] text-xs font-bold text-[#ff4d4f] transition hover:border-[#ff4d4f]/40 hover:bg-[#ffe5e5] active:scale-[0.98] disabled:opacity-60"
            >
              {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {isRemoving ? 'Removing' : 'Remove'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Desktop Table ──────────────────────────────────────────────────────────
function MembersTable({ 
  members, 
  onEditMember,
  onEditRole, 
  onRemove, 
  removingId 
}: { 
  members: Member[];
  onEditMember: (member: Member) => void;
  onEditRole: (member: Member) => void;
  onRemove: (member: Member) => void;
  removingId: string | null;
}) {
  const [sortField, setSortField] = useState<'name' | 'role' | 'joined_at'>('joined_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = [...members].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.user.name.localeCompare(b.user.name);
    else if (sortField === 'role') cmp = a.role.localeCompare(b.role);
    else cmp = new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} className="ml-0.5" /> : <ChevronDown size={14} className="ml-0.5" />;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
      <div className="overflow-x-auto monthly-bills-table-scroll pb-2">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
              <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">
                <button
                  onClick={() => toggleSort('name')}
                  className="inline-flex items-center gap-0.5 transition hover:text-[#2f80ed]"
                >
                  Member
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="hidden whitespace-nowrap px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99] md:table-cell">
                Email & Phone
              </th>
              <th className="hidden whitespace-nowrap px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99] lg:table-cell">
                Mess
              </th>
              <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">
                <button
                  onClick={() => toggleSort('role')}
                  className="inline-flex items-center gap-0.5 transition hover:text-[#2f80ed]"
                >
                  Role
                  <SortIcon field="role" />
                </button>
              </th>
              <th className="hidden whitespace-nowrap px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99] sm:table-cell">
                <button
                  onClick={() => toggleSort('joined_at')}
                  className="inline-flex items-center gap-0.5 transition hover:text-[#2f80ed]"
                >
                  Joined
                  <SortIcon field="joined_at" />
                </button>
              </th>
              <th className="hidden whitespace-nowrap px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99] sm:table-cell">
                Status
              </th>
              <th className="whitespace-nowrap px-4 py-4 text-right text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6ebf4]">
            {sorted.map((member) => {
              const cfg = ROLE_CONFIG[member.role];
              const isRemoving = removingId === member.id;
              const avatarBg = avatarColor(member.user_id);

              return (
                <tr
                  key={member.id}
                  className="transition hover:bg-[#f8faff] group"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black"
                        style={{ backgroundColor: `${avatarBg}18`, borderColor: `${avatarBg}55`, color: avatarBg }}
                      >
                        {getInitials(member.user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#172554]">
                          {member.user.name}
                        </p>
                        <p className="truncate text-xs font-semibold text-[#6b7a99] md:hidden">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3.5 md:table-cell">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#6b7a99]">
                        {member.user.email}
                      </p>
                      {member.user.phone && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#8a9bb5]">
                          <Phone size={11} />
                          {member.user.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3.5 lg:table-cell">
                    <span className="inline-flex items-center rounded-lg border border-[#d8e6f8] bg-[#edf5ff] px-2.5 py-1 text-xs font-bold text-[#2f80ed]">
                      {member.mess.name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3.5 sm:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7a99]">
                      <CalendarDays size={13} className="text-[#ffb84d]" />
                      {formatDate(member.joined_at)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3.5 sm:table-cell">
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEditMember(member)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#2f80ed]/15 bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#2f80ed]/40 hover:bg-[#dcebff] sm:h-9 sm:w-9"
                        title="Edit Member"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => onEditRole(member)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#2f80ed]/15 bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#2f80ed]/40 hover:bg-[#dcebff] sm:h-9 sm:w-9"
                        title="Change Role"
                      >
                        <UserCog size={15} />
                      </button>
                      <button
                        onClick={() => onRemove(member)}
                        disabled={isRemoving}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#ff4d4f]/15 bg-[#fff0f0] text-[#ff4d4f] transition hover:border-[#ff4d4f]/40 hover:bg-[#ffe5e5] disabled:opacity-60 sm:h-9 sm:w-9"
                        title="Remove Member"
                      >
                        {isRemoving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Users size={48} className="mb-3 text-[#d8e6f8]" />
          <p className="text-sm font-bold text-[#6b7a99]">No members found</p>
          <p className="mt-1 text-xs font-semibold text-[#8a9bb5]">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MembersSection({ organizerId }: MembersSectionProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [activeMess, setActiveMess] = useState<Mess | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingMemberEdit, setEditingMemberEdit] = useState<Member | null>(null);
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

  useEffect(() => {
    loadActiveMess();
  }, []);

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

  async function loadActiveMess() {
    try {
      const response = await apiClient.getMesses();
      const messData = Array.isArray(response.data) ? response.data[0] : response.data;
      setActiveMess((messData as ApiMess | undefined) ? {
        id: messData.id,
        name: messData.name,
        rooms: messData.rooms ?? [],
      } : null);
    } catch {
      setActiveMess(null);
    }
  }

  // Handle Add Member
  async function handleAddMember(data: { email: string; role: MembershipRole; messId: string; roomNo?: string }) {
    try {
      await apiClient.addMember(data.messId, {
        email: data.email,
        role: data.role,
        roomNo: data.roomNo,
      });
      setShowAddModal(false);
      loadMembers(); // Refresh
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to add member';
      setError(errorMsg);
    }
  }

  // Handle Change Role (Single Manager Rule: promotes member → demotes current manager)
  async function handleEditRole(memberId: string, role: MembershipRole, messId: string) {
    try {
      await apiClient.updateMemberRole(messId, memberId, role);
      
      // Refresh from server to get accurate state after manager demotion
      await loadMembers();
      
      setEditingMember(null);
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to update role';
      setError(errorMsg);
    }
  }

  // Handle Full Edit Member (Single Manager Rule: promotes member → demotes current manager)
  async function handleEditMember(memberId: string, data: EditMemberData) {
    if (!activeMess?.id) return;

    try {
      await apiClient.updateMember(activeMess.id, memberId, {
        role: data.role,
        isActive: data.isActive,
        roomNo: data.roomNo,
        monthlyRent: data.monthlyRent,
        depositAmount: data.depositAmount,
      });

      setMembers(prev => {
        // If promoting a member to MANAGER, demote the existing manager to MEMBER
        if (data.role === 'MANAGER') {
          const newManagerUserId = memberId;
          return prev.map(m => {
            // Demote current manager (different user) to MEMBER
            if (m.user_id !== newManagerUserId && m.role === 'MANAGER' && m.mess_id === activeMess.id) {
              return { ...m, role: 'MEMBER' as MembershipRole };
            }
            // Update the target user
            if (m.user_id === memberId) {
              return {
                ...m,
                role: data.role || m.role,
                is_active: data.isActive ?? m.is_active,
                ...(data.roomNo ? { room_no: data.roomNo } : {}),
              };
            }
            return m;
          });
        }
        // Normal update
        return prev.map(m =>
          m.user_id === memberId
            ? {
                ...m,
                role: data.role || m.role,
                is_active: data.isActive ?? m.is_active,
                ...(data.roomNo ? { room_no: data.roomNo } : {}),
              }
            : m
        );
      });
      setEditingMemberEdit(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update member');
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
  <div className="min-h-screen bg-[#fafcff]">
    <DashboardHeader title="Members" description="Manage your mess members and roles" />

    <div className="px-4 py-5 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-500/25 bg-red-50 p-4 text-red-600">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xl">✕</button>
        </div>
      )}

      {/* Search + Filters + Add Member row */}
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c70a8]" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or mess..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white py-3 pl-11 pr-4 text-sm font-semibold text-[#172554] shadow-sm outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
            />
          </div>

          {/* Role filter pills (desktop) */}
          <div className="hidden items-center gap-1.5 sm:flex">
            {(['ALL', 'MEMBER', 'MANAGER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition active:scale-[0.97] ${
                  filterRole === r
                    ? 'border-[#2f80ed]/40 bg-[#e7f1ff] text-[#2f80ed] shadow-sm'
                    : 'border-[#e6ebf4] bg-white text-[#6b7a99] hover:border-[#a9ccfb] hover:bg-[#f8faff]'
                }`}
              >
                {r === 'ALL' ? 'All' : ROLE_CONFIG[r].label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          disabled={!activeMess}
          className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 py-3 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] transition-all hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)] active:scale-[0.98] md:w-auto"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      {/* Mobile role filter (scrollable pills) */}
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-2 sm:hidden">
        {(['ALL', 'MEMBER', 'MANAGER'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition active:scale-[0.97] ${
              filterRole === r
                ? 'border-[#2f80ed]/40 bg-[#e7f1ff] text-[#2f80ed] shadow-sm'
                : 'border-[#e6ebf4] bg-white text-[#6b7a99] hover:border-[#a9ccfb] hover:bg-[#f8faff]'
            }`}
          >
            {r === 'ALL' ? 'All' : ROLE_CONFIG[r].label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#2f80ed]" />
        </div>
      ) : (
        <>
          {/* Mobile: Card-style rows */}
          <div className="space-y-3 sm:hidden">
            {filtered.map((member) => (
              <MobileMemberRow
                key={member.id}
                member={member}
                onEditMember={setEditingMemberEdit}
                onEditRole={setEditingMember}
                onRemove={handleRemove}
                removingId={removingId}
              />
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <Users size={48} className="mb-3 text-[#d8e6f8]" />
                <p className="text-sm font-bold text-[#6b7a99]">No members found</p>
                <p className="mt-1 text-xs font-semibold text-[#8a9bb5]">Try adjusting your search or filter</p>
              </div>
            )}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block">
            <MembersTable
              members={filtered}
              onEditMember={setEditingMemberEdit}
              onEditRole={setEditingMember}
              onRemove={handleRemove}
              removingId={removingId}
            />
          </div>
        </>
      )}

      {/* Member count summary */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[#e6ebf4] bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-bold text-[#6b7a99]">
            Showing <span className="text-[#172554]">{filtered.length}</span> of{' '}
            <span className="text-[#172554]">{members.length}</span> members
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs font-bold text-[#6b7a99]">
              <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
              {members.filter(m => m.role === 'MEMBER').length} Members
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-[#6b7a99]">
              <span className="h-2 w-2 rounded-full bg-[#6d28d9]" />
              {members.filter(m => m.role === 'MANAGER').length} Managers
            </span>
          </div>
        </div>
      )}
    </div>

    {/* Modals */}
    {showAddModal && (
      <AddMemberModal activeMess={activeMess} members={members} onClose={() => setShowAddModal(false)} onAdd={handleAddMember} />
    )}
    {editingMember && (
      <EditRoleModal member={editingMember} onClose={() => setEditingMember(null)} onSave={handleEditRole} />
    )}
    {editingMemberEdit && (
      <EditMemberModal member={editingMemberEdit} activeMess={activeMess} onClose={() => setEditingMemberEdit(null)} onSave={handleEditMember} />
    )}
  </div>
)
}
