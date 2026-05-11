'use client'

import { useState, useEffect } from 'react'
import {
  Plus, X, User, Shield, Trash2, Loader2, UserMinus, Search, ChevronDown,
} from 'lucide-react'

import { apiClient, ApiError } from '@/lib/api-client'

type MembershipRole = 'MANAGER' | 'MEMBER'

interface Member {
  id: string
  mess_id: string
  user_id: string
  role: MembershipRole
  joined_at: string
  left_at: string | null
  is_active: boolean
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface Mess {
  id: string
  name: string
}

interface Member {
  id: string
  mess_id: string
  user_id: string
  role: MembershipRole
  joined_at: string
  left_at: string | null
  is_active: boolean
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface Mess {
  id: string
  name: string
}

interface EditRoleModalProps {
  member: Member
  onClose: () => void
  onSave: (memberId: string, role: MembershipRole) => Promise<void>
}

function EditRoleModal({ member, onClose, onSave }: EditRoleModalProps) {
  const [role, setRole] = useState<MembershipRole>(member.role)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      await onSave(member.id, role)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
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
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          background: 'linear-gradient(135deg, #0d1b2e 0%, #162035 60%, #1a2640 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Change Role</p>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>{member.user.name}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              style={{
                flex: 2,
                background: loading ? 'rgba(99,102,241,0.5)' : '#6366f1',
                border: 'none',
                borderRadius: '10px',
                padding: '11px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Saving...' : 'Save Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// // MemberCard and MembersSection remain the same (cleaned)
interface MemberCardProps {
  member: Member
  onEditRole: (member: Member) => void
  onRemove: (member: Member) => void
  removingId: string | null
}

function MemberCard({ member, onEditRole, onRemove, removingId }: MemberCardProps) {
  const cfg = ROLE_CONFIG[member.role]
  const isRemoving = removingId === member.id
  const bg = avatarColor(member.user_id)

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0d1b2e 0%, #162035 60%, #1a2640 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '14px',
        overflow: 'hidden',
        opacity: member.is_active ? 1 : 0.6,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      // onMouseEnter={(e) => {
      //   (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
      //   (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.35)'
      // }}
      // onMouseLeave={(e) => {
      //   (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      //   (e.currentTarget as HTMLElement).style.boxShadow = 'none'
      // }}
    >
      {/* Top Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: bg + '33',
          border: `2px solid ${bg}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 700,
          color: bg,
          flexShrink: 0
        }}>
          {getInitials(member.user.name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.user.name}
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.user.email}
          </p>
        </div>

        <div>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: member.is_active ? 'rgba(0,201,122,0.12)' : 'rgba(255,77,77,0.12)',
            border: `1px solid ${member.is_active ? 'rgba(0,201,122,0.25)' : 'rgba(255,77,77,0.25)'}`,
            borderRadius: '20px',
            padding: '3px 9px',
            fontSize: '11px',
            fontWeight: 700,
            color: member.is_active ? '#00c97a' : '#ff6b6b',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: member.is_active ? '#00c97a' : '#ff6b6b' }} />
            {member.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Role & Joined */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: cfg.color,
          border: `1px solid ${cfg.textColor}33`,
          borderRadius: '20px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 700,
          color: cfg.textColor
        }}>
          {cfg.icon} {cfg.label}
        </span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
          Joined {formatDate(member.joined_at)}
        </span>
      </div>

      {member.left_at && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserMinus size={12} style={{ color: 'rgba(255,107,107,0.7)' }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,107,107,0.7)' }}>
            Left on {formatDate(member.left_at)}
          </span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => onEditRole(member)}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            padding: '11px 8px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'rgba(165,180,252,0.8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
          }}
        >
          <ChevronDown size={13} /> Change Role
        </button>

        <button
          onClick={() => onRemove(member)}
          disabled={isRemoving}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            padding: '11px 8px',
            fontSize: '12px',
            fontWeight: 500,
            color: isRemoving ? 'rgba(248,113,113,0.4)' : 'rgba(248,113,113,0.8)',
            cursor: isRemoving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
          }}
        >
          {isRemoving ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          {isRemoving ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </div>
  )
}

// // ─── Main Component ───────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<MembershipRole, { label: string; icon: React.ReactNode; color: string; textColor: string }> = {
  MANAGER: { label: 'Manager', icon: <Shield size={11} />, color: '#6366f122', textColor: '#a5b4fc' },
  MEMBER: { label: 'Member', icon: <User size={11} />, color: 'rgba(255,255,255,0.07)', textColor: 'rgba(255,255,255,0.5)' },
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e']

function avatarColor(userId: string) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
interface AddMemberModalProps {
  onClose: () => void
  onAdd: (data: { email: string; role: MembershipRole; messId: string }) => Promise<void>
}

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
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'linear-gradient(135deg, #0d1b2e 0%, #162035 60%, #1a2640 100%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Mess Management</p>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#fff' }}>Add New Member</h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>User Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#fff' }}
            />
          </div>

          {/* Mess Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Select Mess</label>
            <select
              value={selectedMess}
              onChange={(e) => setSelectedMess(e.target.value)}
              style={{
                width: '100%', background: '#1a2640', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px',
                padding: '11px 14px', fontSize: '14px', outline: 'none',
              }}
            >
              <option value="" style={{ background: '#1a2640', color: '#aaa' }}>Select Mess</option>
              {messes.map((mess) => (
                <option key={mess.id} value={mess.id} style={{ background: '#1a2640', color: '#fff' }}>
                  {mess.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Role</label>
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
                      borderRadius: '10px', padding: '10px 6px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: selected ? cfg.textColor : 'rgba(255,255,255,0.35)' }}>{cfg.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: selected ? cfg.textColor : 'rgba(255,255,255,0.4)' }}>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', color: '#f87171' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', color: 'rgba(255,255,255,0.6)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, background: loading ? 'rgba(99,102,241,0.5)' : '#6366f1', border: 'none', borderRadius: '10px', padding: '11px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />}
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
interface MembersSectionProps {
  messId: string
}

export default function MembersSection({ messId }: MembersSectionProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<MembershipRole | 'ALL'>('ALL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMembers()
  }, [messId])

  async function loadMembers() {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getMembers(messId)
      setMembers(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to load members'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

 async function handleAddMember(data: { email: string; role: MembershipRole; messId: string }) {
  try {
    await apiClient.addMember(data.messId, {   // Sending messId from selected value
      email: data.email,
      role: data.role,
    })
    await loadMembers()   // Refresh current list (optional: you can reload specific mess)
  } catch (err) {
    const errorMsg = err instanceof ApiError ? err.message : 'Failed to add member'
    setError(errorMsg)
    throw err
  }
}
  async function handleEditRole(memberId: string, role: MembershipRole) {
    try {
      setError(null)
      await apiClient.updateMemberRole(messId, memberId, role)
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m))
      )
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to update role'
      setError(errorMsg)
      throw err
    }
  }

  async function handleRemove(member: Member) {
    setRemovingId(member.id)
    try {
      setError(null)
      await apiClient.removeMember(messId, member.id)
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? { ...m, is_active: false, left_at: new Date().toISOString() }
            : m
        )
      )
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Failed to remove member'
      setError(errorMsg)
    } finally {
      setRemovingId(null)
    }
  }

  const filtered = members.filter((m) => {
    const matchSearch = 
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'ALL' || m.role === filterRole
    return matchSearch && matchRole
  })

  const activeCount = members.filter((m) => m.is_active).length

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
              Mess Management
            </p>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>Members</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              {activeCount} active · {members.length} total
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#6366f1',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Add Member
          </button>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '14px',
                paddingTop: '10px',
                paddingBottom: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#fff',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            {(['ALL', 'MANAGER', 'MEMBER'] as const).map((r) => {
              const active = filterRole === r
              const cfg = r !== 'ALL' ? ROLE_CONFIG[r] : null
              return (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  style={{
                    background: active ? (cfg ? cfg.color : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? (cfg ? cfg.textColor + '55' : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: active ? (cfg ? cfg.textColor : '#fff') : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                  }}
                >
                  {r === 'ALL' ? 'All' : ROLE_CONFIG[r].label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '14px' }}>
            <Loader2 size={32} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }} className="animate-spin" />
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)' }}>Loading members...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '14px' }}>
            <User size={32} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '12px' }} />
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)' }}>No members found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onEditRole={setEditingMember}
                onRemove={handleRemove}
                removingId={removingId}
              />
            ))}
          </div>
        )}
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
    </>
  )
}