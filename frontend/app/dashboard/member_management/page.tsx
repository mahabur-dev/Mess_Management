'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Mail, Plus, Search, Loader2, User, X, Trash2, Shield, UserCog, ChevronDown, ChevronUp, MoreHorizontal, Phone, Users, Pencil, Ban, CheckCircle, DoorOpen, DollarSign, Building, UserPlus } from 'lucide-react';
import { apiClient, ApiError, type MemberJoinRequest, type Mess as ApiMess } from '@/lib/api-client';
import { DashboardHeader } from '@/components/dashboard-header';
import { EnterpriseButton } from '@/components/ui/enterprise-button';
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer';
import { EnterpriseDrawerAction, EnterpriseDrawerFooter } from '@/components/ui/enterprise-drawer-footer';
import { EnterpriseSelect } from '@/components/ui/enterprise-select';
import { EnterpriseTableActionCell, EnterpriseTableActionHeader } from '@/components/ui/enterprise-table-actions';

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
    color: 'var(--primary)',
    textColor: 'var(--primary)',
    bgColor: 'color-mix(in srgb, var(--primary) 10%, transparent)',
  },
  MEMBER: {
    label: 'Member',
    icon: <User size={12} />,
    color: 'var(--primary)',
    textColor: 'var(--primary)',
    bgColor: 'color-mix(in srgb, var(--primary) 10%, transparent)',
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

const AVATAR_COLORS = ['var(--primary)'];

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
    <EnterpriseDetailsDrawer
      open
      onOpenChange={(open) => !open && onClose()}
      eyebrow="Members"
      title="Change member role"
      description={member.user.email}
      headerIcon={<UserCog className="size-5" />}
      footer={<EnterpriseDrawerFooter><EnterpriseDrawerAction tone="secondary" onClick={onClose} disabled={loading}>Cancel</EnterpriseDrawerAction><EnterpriseDrawerAction priority="primary" tone="primary" onClick={handleSave} disabled={loading}>{loading && <Loader2 size={15} className="animate-spin" />}{loading ? 'Saving...' : 'Save Role'}</EnterpriseDrawerAction></EnterpriseDrawerFooter>}
    >
        <div className="space-y-5">
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg font-semibold"
              style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: avatarColor(member.user_id) }}
            >
              {getInitials(member.user.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">{member.user.name}</h3>
              <p className="truncate text-sm font-semibold text-muted-foreground">{member.user.email}</p>
            </div>
          </div>

          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
                  className={`flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition active:scale-[0.98] ${
                    selected
                      ? 'border-border bg-muted text-primary '
                      : 'border-border bg-background text-muted-foreground hover:border-primary hover:bg-muted'
                  }`}
                >
                  <span style={{ color: selected ? cfg.textColor : undefined }}>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
    </EnterpriseDetailsDrawer>
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
    <EnterpriseDetailsDrawer
      open
      onOpenChange={(open) => !open && onClose()}
      eyebrow="Members"
      title="Edit member"
      description={member.user.email}
      headerIcon={<Pencil className="size-5" />}
      footer={<EnterpriseDrawerFooter><EnterpriseDrawerAction tone="secondary" onClick={onClose} disabled={loading}>Cancel</EnterpriseDrawerAction><EnterpriseDrawerAction priority="primary" tone="primary" onClick={handleSave} disabled={loading}>{loading && <Loader2 size={15} className="animate-spin" />}{loading ? 'Saving...' : 'Save Changes'}</EnterpriseDrawerAction></EnterpriseDrawerFooter>}
    >
        <div className="space-y-5">
          {/* Member Info */}
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg font-semibold"
              style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: avatarColor(member.user_id) }}
            >
              {getInitials(member.user.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">{member.user.name}</h3>
              <p className="truncate text-sm font-semibold text-muted-foreground">{member.user.email}</p>
            </div>
          </div>

          {/* Room Selection */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <DoorOpen size={12} className="mr-1 inline" />
              Room Assignment
            </label>
            <EnterpriseSelect value={roomNo} onValueChange={setRoomNo} placeholder="Select room (optional)" options={availableRooms.map((room) => ({ value: room, label: room }))} />
          </div>

          {/* Financial Fields */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
                className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
                className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Membership Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition active:scale-[0.98] ${
                  isActive
                    ? 'border-primary/40 bg-primary/10 text-primary '
                    : 'border-border bg-background text-muted-foreground hover:border-primary hover:bg-muted'
                }`}
              >
                <CheckCircle size={16} />
                Active
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition active:scale-[0.98] ${
                  !isActive
                    ? 'border-destructive/30 bg-destructive/10 text-destructive '
                    : 'border-border bg-background text-muted-foreground hover:border-primary hover:bg-muted'
                }`}
              >
                <Ban size={16} />
                Inactive
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              {error}
            </div>
          )}
        </div>
    </EnterpriseDetailsDrawer>
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
    <EnterpriseDetailsDrawer
      open
      onOpenChange={(open) => !open && onClose()}
      eyebrow="Members"
      title="Add new member"
      description="Invite a member and set their room assignment."
      headerIcon={<UserPlus className="size-5" />}
      footer={<EnterpriseDrawerFooter><EnterpriseDrawerAction className="hidden sm:inline-flex" tone="secondary" onClick={onClose} disabled={loading}>Cancel</EnterpriseDrawerAction><EnterpriseDrawerAction priority="primary" tone="primary" type="submit" form="add-member-form" disabled={loading}>{loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}{loading ? 'Adding...' : 'Add Member'}</EnterpriseDrawerAction></EnterpriseDrawerFooter>}
    >
        <form id="add-member-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
          </div>

          {/* Selected Mess */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Selected Mess
            </label>
            <div className="flex h-[48px] w-full items-center rounded-xl border border-border bg-muted px-4 text-sm font-bold text-foreground">
              {activeMess?.name || 'No mess available'}
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Select Room
            </label>
            <EnterpriseSelect
              value={selectedRoom}
              onValueChange={setSelectedRoom}
              disabled={availableRooms.length === 0}
              placeholder={availableRooms.length === 0 ? 'No seat-available room' : 'Choose room'}
              options={availableRooms.map((room) => ({ value: room.roomName, label: `${room.roomName}${typeof room.availableSeats === 'number' ? ` (${room.availableSeats} seat left)` : ''}` }))}
            />
            {availableRooms.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                All configured rooms are currently full. Add the member without a room or free up a seat first.
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="mb-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
                        ? 'border-border bg-muted text-primary '
                        : 'border-border bg-background text-muted-foreground hover:border-primary hover:bg-muted'
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
            <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              {error}
            </div>
          )}
        </form>
    </EnterpriseDetailsDrawer>
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
    <div className="rounded-xl border border-border bg-background  transition-all hover:border-primary ">
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold"
          style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: avatarBg }}
        >
          {getInitials(member.user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{member.user.name}</h3>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
          <p className="truncate text-xs font-semibold text-muted-foreground">{member.user.email}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-primary"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Mail size={13} className="shrink-0 text-primary" />
              <span className="truncate">{member.user.email}</span>
            </div>
            {member.user.phone && (
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Phone size={13} className="shrink-0 text-primary" />
                <span>{member.user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <CalendarDays size={13} className="shrink-0 text-primary" />
              <span>Joined {formatDate(member.joined_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="shrink-0 text-primary">🏠</span>
              <span className="truncate">{member.mess.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/100" />
              Active
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => onEditMember(member)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted text-xs font-bold text-primary transition hover:border-primary hover:bg-muted active:scale-[0.98]"
            >
              <Pencil size={14} />
              Edit
            </button>
            <button
              onClick={() => onEditRole(member)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted text-xs font-bold text-primary transition hover:border-primary hover:bg-muted active:scale-[0.98]"
            >
              <UserCog size={14} />
              Role
            </button>
            <button
              onClick={() => onRemove(member)}
              disabled={isRemoving}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-xs font-bold text-destructive transition hover:border-destructive/30 hover:bg-destructive/10 active:scale-[0.98] disabled:opacity-60"
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

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} className="ml-0.5" /> : <ChevronDown size={14} className="ml-0.5" />;
  };

  return (
    <div className="dashboard-table-frame">
      <div className="overflow-x-auto monthly-bills-table-scroll pb-2">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <button
                  onClick={() => toggleSort('name')}
                  className="inline-flex items-center gap-0.5 transition hover:text-primary"
                >
                  Member
                  {renderSortIcon('name')}
                </button>
              </th>
              <th className="hidden whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:table-cell">
                Email & Phone
              </th>
              <th className="hidden whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground lg:table-cell">
                Mess
              </th>
              <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <button
                  onClick={() => toggleSort('role')}
                  className="inline-flex items-center gap-0.5 transition hover:text-primary"
                >
                  Role
                  {renderSortIcon('role')}
                </button>
              </th>
              <th className="hidden whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:table-cell">
                <button
                  onClick={() => toggleSort('joined_at')}
                  className="inline-flex items-center gap-0.5 transition hover:text-primary"
                >
                  Joined
                  {renderSortIcon('joined_at')}
                </button>
              </th>
              <th className="hidden whitespace-nowrap px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:table-cell">
                Status
              </th>
              <EnterpriseTableActionHeader />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((member) => {
              const cfg = ROLE_CONFIG[member.role];
              const isRemoving = removingId === member.id;
              const avatarBg = avatarColor(member.user_id);

              return (
                <tr
                  key={member.id}
                  className="transition hover:bg-muted group"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold"
                        style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: avatarBg }}
                      >
                        {getInitials(member.user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          {member.user.name}
                        </p>
                        <p className="truncate text-xs font-semibold text-muted-foreground md:hidden">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3.5 md:table-cell">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-muted-foreground">
                        {member.user.email}
                      </p>
                      {member.user.phone && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          <Phone size={11} />
                          {member.user.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3.5 lg:table-cell">
                    <span className="inline-flex items-center rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-bold text-primary">
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
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <CalendarDays size={13} className="text-primary" />
                      {formatDate(member.joined_at)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3.5 sm:table-cell">
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/100" />
                        Active
                      </span>
                    </div>
                  </td>
                  <EnterpriseTableActionCell className="py-3.5" contentClassName="gap-1.5">
                      <button
                        onClick={() => onEditMember(member)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-primary transition hover:border-primary hover:bg-muted sm:h-9 sm:w-9"
                        title="Edit Member"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => onEditRole(member)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-primary transition hover:border-primary hover:bg-muted sm:h-9 sm:w-9"
                        title="Change Role"
                      >
                        <UserCog size={15} />
                      </button>
                      <button
                        onClick={() => onRemove(member)}
                        disabled={isRemoving}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive transition hover:border-destructive/30 hover:bg-destructive/10 disabled:opacity-60 sm:h-9 sm:w-9"
                        title="Remove Member"
                      >
                        {isRemoving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                  </EnterpriseTableActionCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Users size={48} className="mb-3 text-muted-foreground" />
          <p className="text-sm font-bold text-muted-foreground">No members found</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
function MemberJoinRequestsPanel({
  requests,
  reviewingId,
  onReview,
}: {
  requests: MemberJoinRequest[];
  reviewingId: string | null;
  onReview: (requestId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
}) {
  if (requests.length === 0) return null;

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-background ">
      <div className="relative overflow-hidden border-b border-border  bg-muted via-white  px-5 py-5">
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <span className="relative grid h-11 w-11 place-items-center rounded-xl r bg-primary  text-primary-foreground ">
              <UserPlus size={20} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground ring-2 ring-background">
                {requests.length}
              </span>
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Pending Approval</p>
              <h2 className="text-base font-semibold text-foreground">Member Join Requests</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                Review who wants to join your mess
              </p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary sm:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary/100" />
            </span>
            {requests.length} Pending {requests.length === 1 ? 'Request' : 'Requests'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
        {requests.map((request) => {
          const isReviewing = reviewingId === request.id;
          const color = avatarColor(request.requester_id);
          const requestedAt = new Date(request.created_at);
          const dateLabel = requestedAt.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const timeLabel = requestedAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={request.id}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors duration-200 hover:border-primary"
            >
              <div className="absolute inset-x-0 top-0 h-1  bg-primary   opacity-70 transition-opacity group-hover:opacity-100" />

              <div className="flex flex-1 flex-col p-4 pt-5 sm:p-5 sm:pt-6">
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold  ring-2 ring-background"
                      style={{
                        background: 'var(--muted)',
                        border: '1px solid var(--border)',
                        color,
                      }}
                    >
                      {getInitials(request.requester?.name || 'User')}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary-foreground/30 bg-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-background" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-semibold text-foreground group-hover:text-primary">
                      {request.requester?.name || 'Unknown User'}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold text-muted-foreground">
                      <Mail size={11} className="shrink-0 text-primary" />
                      <span className="truncate">{request.requester?.email || 'No email'}</span>
                    </p>
                    {request.requester?.phone && (
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold text-muted-foreground">
                        <Phone size={11} className="shrink-0 text-primary" />
                        <span className="truncate">{request.requester.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-[11px] font-bold text-primary">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="truncate">{request.mess?.name || 'Selected mess'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                    <CalendarDays size={11} className="text-primary" />
                    {dateLabel} · {timeLabel}
                  </span>
                </div>

                <div className="mt-5 border-t border-dashed border-border" />

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onReview(request.id, 'APPROVED')}
                    disabled={isReviewing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 text-xs font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10 active:scale-[0.98] disabled:opacity-60"
                  >
                    {isReviewing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={15} />}
                    <span>Accept</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReview(request.id, 'REJECTED')}
                    disabled={isReviewing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 text-xs font-semibold text-destructive  transition hover:border-destructive/30 hover:bg-destructive/10  active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-none"
                  >
                    <X size={15} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MembersSection({ organizerId }: MembersSectionProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [activeMess, setActiveMess] = useState<Mess | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingMemberEdit, setEditingMemberEdit] = useState<Member | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [joinRequests, setJoinRequests] = useState<MemberJoinRequest[]>([]);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
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
    loadJoinRequests();
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

  async function loadJoinRequests() {
    try {
      const response = await apiClient.getManagedMemberJoinRequests({
        page: 1,
        limit: 50,
        status: 'PENDING',
      });
      setJoinRequests(Array.isArray(response.data) ? response.data : []);
    } catch {
      setJoinRequests([]);
    }
  }

  async function handleReviewJoinRequest(requestId: string, status: 'APPROVED' | 'REJECTED') {
    setReviewingRequestId(requestId);
    setError(null);

    try {
      await apiClient.reviewMemberJoinRequest(requestId, { status });
      await loadJoinRequests();
      if (status === 'APPROVED') await loadMembers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to review member request');
    } finally {
      setReviewingRequestId(null);
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
  <div className="min-h-screen bg-background">
    <DashboardHeader title="Members" description="Manage your mess members and roles" />

    <div className="px-4 py-5 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xl">✕</button>
        </div>
      )}

      <MemberJoinRequestsPanel
        requests={joinRequests}
        reviewingId={reviewingRequestId}
        onReview={handleReviewJoinRequest}
      />

      {/* Search + Filters + Add Member row */}
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or mess..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[48px] w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm font-semibold text-foreground  outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
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
                    ? 'border-border bg-muted text-primary '
                    : 'border-border bg-background text-muted-foreground hover:border-primary hover:bg-muted'
                }`}
              >
                {r === 'ALL' ? 'All' : ROLE_CONFIG[r].label}
              </button>
            ))}
          </div>
        </div>

        <EnterpriseButton
          onClick={() => setShowAddModal(true)}
          disabled={!activeMess}
          size="lg"
          className="w-full md:w-auto"
        >
          <Plus size={20} />
          Add Member
        </EnterpriseButton>
      </div>

      {/* Mobile role filter (scrollable pills) */}
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-2 sm:hidden">
        {(['ALL', 'MEMBER', 'MANAGER'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition active:scale-[0.97] ${
              filterRole === r
                ? 'border-border bg-muted text-primary '
                : 'border-border bg-background text-muted-foreground hover:border-primary hover:bg-muted'
            }`}
          >
            {r === 'ALL' ? 'All' : ROLE_CONFIG[r].label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
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
                <Users size={48} className="mb-3 text-muted-foreground" />
                <p className="text-sm font-bold text-muted-foreground">No members found</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">Try adjusting your search or filter</p>
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
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 ">
          <p className="text-xs font-bold text-muted-foreground">
            Showing <span className="text-foreground">{filtered.length}</span> of{' '}
            <span className="text-foreground">{members.length}</span> members
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {members.filter(m => m.role === 'MEMBER').length} Members
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
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
