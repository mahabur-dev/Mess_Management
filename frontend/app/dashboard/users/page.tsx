'use client'

import { useAuth } from '@/app/context/auth-context'
import { DashboardHeader } from '@/components/dashboard-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { EnterpriseIconButton } from '@/components/ui/enterprise-icon-button'
import {
  EnterpriseTableActionCell,
  EnterpriseTableActionHeader,
} from '@/components/ui/enterprise-table-actions'
import { apiClient, type User } from '@/lib/api-client'
import { Users, Mail, Shield, UserRound, Search, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import { toast } from 'sonner'

const AVATAR_COLORS = ['var(--primary)']

const avatarColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const ROLE_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ADMIN: { label: 'Admin', bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
  MANAGER: { label: 'Manager', bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
  MEMBER: { label: 'Member', bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
}

type DeleteIntent =
  | { kind: 'single'; users: User[] }
  | { kind: 'bulk'; users: User[] }
  | null

const DELETE_CONCURRENCY = 4

function SelectionCheckbox(props: ComponentProps<typeof Checkbox>) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center">
      <Checkbox
        className="size-5 rounded-[5px] border-2 border-primary/60 bg-background shadow-none data-[state=checked]:border-primary data-[state=checked]:bg-primary disabled:border-border disabled:bg-muted"
        {...props}
      />
    </span>
  )
}

async function deleteUsersWithLimit(users: User[]) {
  const succeeded: User[] = []
  const failed: User[] = []

  for (let index = 0; index < users.length; index += DELETE_CONCURRENCY) {
    const batch = users.slice(index, index + DELETE_CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map((user) => apiClient.deleteUser(user.id)),
    )

    results.forEach((result, resultIndex) => {
      const target = batch[resultIndex]
      if (result.status === 'fulfilled') succeeded.push(target)
      else failed.push(target)
    })
  }

  return { succeeded, failed }
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteIntent, setDeleteIntent] = useState<DeleteIntent>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    apiClient.getUsers({ limit: 100 })
      .then((response) => setUsers(Array.isArray(response.data) ? response.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((u) => (
      u.name.toLowerCase().includes(term)
      || u.email.toLowerCase().includes(term)
      || u.role.toLowerCase().includes(term)
    ))
  }, [search, users])

  const selectableFiltered = filtered.filter((candidate) => candidate.id !== currentUser?.id)
  const selectedUsers = users.filter((candidate) => selectedIds.has(candidate.id))
  const allFilteredSelected = selectableFiltered.length > 0
    && selectableFiltered.every((candidate) => selectedIds.has(candidate.id))
  const someFilteredSelected = selectableFiltered.some((candidate) => selectedIds.has(candidate.id))

  const toggleUser = (userId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(userId)
      else next.delete(userId)
      return next
    })
  }

  const toggleFiltered = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      selectableFiltered.forEach((candidate) => {
        if (checked) next.add(candidate.id)
        else next.delete(candidate.id)
      })
      return next
    })
  }

  const requestSingleDelete = (target: User) => {
    if (target.id === currentUser?.id) return
    setDeleteIntent({ kind: 'single', users: [target] })
  }

  const requestBulkDelete = () => {
    if (selectedUsers.length === 0) return
    setDeleteIntent({ kind: 'bulk', users: selectedUsers })
  }

  const handleDelete = async () => {
    if (!deleteIntent || deleting) return
    setDeleting(true)

    try {
      const { succeeded, failed } = await deleteUsersWithLimit(deleteIntent.users)
      const succeededIds = new Set(succeeded.map((candidate) => candidate.id))

      if (succeeded.length > 0) {
        setUsers((current) => current.filter((candidate) => !succeededIds.has(candidate.id)))
        setSelectedIds((current) => {
          const next = new Set(current)
          succeededIds.forEach((id) => next.delete(id))
          return next
        })
      }

      if (failed.length === 0) {
        toast.success(
          succeeded.length === 1
            ? `${succeeded[0].name} was deleted successfully.`
            : `${succeeded.length} users were deleted successfully.`,
        )
      } else if (succeeded.length > 0) {
        toast.error(`${succeeded.length} deleted; ${failed.length} could not be deleted.`)
      } else {
        toast.error(
          failed.length === 1
            ? 'This user could not be deleted. Check whether manager ownership must be transferred first.'
            : 'The selected users could not be deleted. Check their manager ownership and try again.',
        )
      }

      setDeleteIntent(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Users" description="Super admin user management" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl r bg-primary/10  ">
              <Users size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">All Users</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="destructive"
              className="h-[45px] rounded-xl px-4 font-semibold"
              disabled={selectedUsers.length === 0}
              onClick={requestBulkDelete}
            >
              <Trash2 size={16} />
              {selectedUsers.length > 0
                ? `Delete selected (${selectedUsers.length})`
                : 'Bulk delete'}
            </Button>
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-[45px] w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                placeholder="Search by name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="dashboard-table-frame">
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="w-12 px-5 py-4 text-left">
                    <SelectionCheckbox
                      aria-label="Select all visible users"
                      checked={allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false}
                      disabled={selectableFiltered.length === 0}
                      onCheckedChange={(checked) => toggleFiltered(checked === true)}
                    />
                  </th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">User</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Email</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Role</th>
                  <EnterpriseTableActionHeader size="compact" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                        <Loader2 size={18} className="animate-spin text-primary" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={40} className="text-muted-foreground" />
                        <p className="text-sm font-bold text-muted-foreground">No users found.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && filtered.map((u) => {
                  const bgColor = avatarColor(u.name)
                  const roleCfg = ROLE_BADGES[u.role] || ROLE_BADGES.MEMBER
                  const isCurrentUser = u.id === currentUser?.id
                  return (
                    <tr key={u.id} className="transition hover:bg-muted">
                      <td className="w-12 px-5 py-4">
                        <SelectionCheckbox
                          aria-label={isCurrentUser ? 'Current account cannot be selected' : `Select ${u.name}`}
                          checked={selectedIds.has(u.id)}
                          disabled={isCurrentUser}
                          onCheckedChange={(checked) => toggleUser(u.id, checked === true)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold"
                            style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: bgColor }}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground">{u.name}</p>
                            <p className="text-xs font-semibold text-muted-foreground sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-4 sm:table-cell">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <Mail size={14} className="text-primary shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border}`}>
                          {u.role === 'ADMIN' ? <Shield size={12} /> : <UserRound size={12} />}
                            {roleCfg.label}
                          </span>
                        </div>
                      </td>
                      <EnterpriseTableActionCell size="compact">
                        <EnterpriseIconButton
                          label={isCurrentUser ? 'You cannot delete your current account here' : `Delete ${u.name}`}
                          tone="danger"
                          disabled={isCurrentUser}
                          onClick={() => requestSingleDelete(u)}
                        >
                          <Trash2 size={16} />
                        </EnterpriseIconButton>
                      </EnterpriseTableActionCell>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 p-4 sm:hidden">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Users size={40} className="mb-2 text-muted-foreground" />
                <p className="text-sm font-bold text-muted-foreground">No users found.</p>
              </div>
            )}
            {!loading && filtered.map((u) => {
              const bgColor = avatarColor(u.name)
              const roleCfg = ROLE_BADGES[u.role] || ROLE_BADGES.MEMBER
              const isCurrentUser = u.id === currentUser?.id
              return (
                <div key={u.id} className="rounded-xl border border-border bg-background p-4  transition hover:border-primary">
                  <div className="flex items-center gap-3">
                    <SelectionCheckbox
                      aria-label={isCurrentUser ? 'Current account cannot be selected' : `Select ${u.name}`}
                      checked={selectedIds.has(u.id)}
                      disabled={isCurrentUser}
                      onCheckedChange={(checked) => toggleUser(u.id, checked === true)}
                    />
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold"
                      style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: bgColor }}
                    >
                      {getInitials(u.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground">{u.name}</p>
                      <p className="truncate text-xs font-semibold text-muted-foreground">{u.email}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border}`}>
                      {u.role === 'ADMIN' ? <Shield size={11} /> : <UserRound size={11} />}
                      {roleCfg.label}
                    </span>
                    <EnterpriseIconButton
                      label={isCurrentUser ? 'You cannot delete your current account here' : `Delete ${u.name}`}
                      tone="danger"
                      disabled={isCurrentUser}
                      onClick={() => requestSingleDelete(u)}
                    >
                      <Trash2 size={15} />
                    </EnterpriseIconButton>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="border-t-2 border-border bg-muted px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground">
                  Showing <span className="text-foreground">{filtered.length}</span> of <span className="text-foreground">{users.length}</span> users
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={Boolean(deleteIntent)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteIntent(null)
        }}
      >
        <AlertDialogContent className="dashboard-portal-surface rounded-2xl border-[var(--dashboard-line)] bg-[var(--dashboard-surface)]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteIntent?.kind === 'bulk'
                ? `Delete ${deleteIntent.users.length} users?`
                : `Delete ${deleteIntent?.users[0]?.name ?? 'this user'}?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              {deleteIntent?.kind === 'bulk'
                ? 'The selected accounts will be permanently deactivated and anonymized. Any account that is the only manager of an active mess will be kept and reported as failed.'
                : 'This account will be permanently deactivated and anonymized. This action cannot be undone. If this user is the only manager of an active mess, assign another manager first.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {deleting ? 'Deleting...' : deleteIntent?.kind === 'bulk' ? 'Delete users' : 'Delete user'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
