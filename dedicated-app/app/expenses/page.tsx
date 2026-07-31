'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  CircleDollarSign,
  CookingPot,
  House,
  Landmark,
  Plus,
  Search,
  UserRound,
  UsersRound,
  WalletCards,
  Zap,
} from 'lucide-react'
import {
  ExpenseListItem,
  formatTaka,
  type ExpenseListRecord,
} from '@/components/mobile/expense-design'
import {
  ExpenseSegmentedControl,
  ExpenseDetailsCta,
  ExpenseSummaryCard,
  ExpenseSurface,
  MemberInitials,
} from '@/components/mobile/expense-ui'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useAuth } from '../providers'

type ExpenseSummary = {
  month?: string
  myView?: {
    foodBill?: number
    utilityBill?: number
    roomRent?: number
    total?: number
    transactionCount?: number
  }
  recentExpenses?: ExpenseListRecord[]
}

type ManagerMember = {
  member?: { id: string; name?: string; email?: string }
  totalCost?: number
  depositPaid?: number
  due?: number
  status?: string
}

type ManagerOverview = {
  totals?: {
    totalExpenses?: number
    totalUtility?: number
    fromDeposit?: number
    members?: number
  }
  members?: ManagerMember[]
}

type FundBalances = {
  messDepositBalance: number
  collectedFundBalance: number
}

type ViewMode = 'MY' | 'MANAGER'
type MemberFilter = 'ALL' | 'DUE' | 'PAID'
type MessageTone = 'SUCCESS' | 'ERROR'

function getStatus(member: ManagerMember) {
  if (Number(member.due ?? 0) <= 0) return 'PAID'
  if (Number(member.depositPaid ?? 0) > 0) return 'PARTIAL'
  return 'DUE'
}

function MemberStatus({ member }: { member: ManagerMember }) {
  const status = getStatus(member)
  const styles = {
    PAID: 'bg-[#eaf7ec] text-[#15953a]',
    PARTIAL: 'bg-[#fff2e6] text-[#e36c0a]',
    DUE: 'bg-[#ffebeb] text-[#e02d37]',
  } as const
  const label = status === 'PAID' ? 'Paid' : status === 'PARTIAL' ? 'Partial' : 'Due'
  return <span className={`rounded-full px-2.5 py-1 text-caption font-bold ${styles[status]}`}>{label}</span>
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const [month] = useState(new Date().toISOString().slice(0, 7))
  const [view, setView] = useState<ViewMode>('MY')
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [managerData, setManagerData] = useState<ManagerOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<MessageTone>('ERROR')
  const [search, setSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('ALL')
  const [fundBalances, setFundBalances] = useState<FundBalances | null>(null)
  const [collectedAmount, setCollectedAmount] = useState('')
  const [collectedNote, setCollectedNote] = useState('')
  const [fundBusy, setFundBusy] = useState(false)

  useEffect(() => {
    if (!messId) return
    let active = true
    setLoading(true)
    setMessage('')
    setMessageTone('ERROR')

    api
      .getExpenseSummary(messId, `${month}-01`)
      .then((response) => {
        if (active) setSummary(response.data as ExpenseSummary)
      })
      .catch((error) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Failed to load expense summary.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [messId, month])

  useEffect(() => {
    if (!messId || !isManager || view !== 'MANAGER' || managerData) return
    let active = true
    setLoading(true)

    Promise.allSettled([
      api.getManagerMemberExpenses(messId, `${month}-01`),
      api.getFundBalances(messId),
    ])
      .then(([memberResult, balanceResult]) => {
        if (!active) return
        if (memberResult.status === 'fulfilled') {
          setManagerData(memberResult.value.data as ManagerOverview)
        }
        if (balanceResult.status === 'fulfilled') {
          setFundBalances(balanceResult.value.data)
        }
        const errors = [memberResult, balanceResult]
          .filter((result) => result.status === 'rejected')
          .map((result) =>
            result.status === 'rejected' && result.reason instanceof Error
              ? result.reason.message
              : 'Part of the manager expense overview could not be loaded.',
          )
        if (errors.length) {
          setMessageTone('ERROR')
          setMessage(errors.join(' '))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isManager, managerData, messId, month, view])

  async function addCollectedFund() {
    setMessage('')
    setMessageTone('ERROR')
    const amount = Number(collectedAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a valid collected fund amount.')
      return
    }

    setFundBusy(true)
    try {
      const response = await api.createCollectedFund({
        messId,
        amount,
        date: new Date().toISOString().slice(0, 10),
        note: collectedNote.trim() || undefined,
      })
      setFundBalances(response.data.balances)
      setCollectedAmount('')
      setCollectedNote('')
      setMessageTone('SUCCESS')
      setMessage('Collected fund recorded successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to record collected fund.')
    } finally {
      setFundBusy(false)
    }
  }

  const my = summary?.myView
  const manager = managerData?.totals
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (managerData?.members ?? []).filter((item) => {
      const status = getStatus(item)
      const matchesFilter = memberFilter === 'ALL' || (memberFilter === 'DUE' ? status !== 'PAID' : status === 'PAID')
      const searchable = `${item.member?.name ?? ''} ${item.member?.email ?? ''}`.toLowerCase()
      return matchesFilter && (!query || searchable.includes(query))
    })
  }, [managerData?.members, memberFilter, search])

  return (
    <MobileShell showBottomNavigation>
      <TopScreen
        title={view === 'MANAGER' ? 'Manage Expenses' : 'Expense Management'}
        subtitle={view === 'MANAGER' ? 'Monitor member costs and dues' : user?.memberships?.[0]?.mess?.name ?? 'Mess expenses'}
        backHref="/"
      />

      <div className="screen expense-screen">
        {isManager ? (
          <ExpenseSegmentedControl
            value={view}
            onChange={(value) => setView(value as ViewMode)}
            options={[
              { value: 'MY', label: 'My View', icon: UserRound },
              { value: 'MANAGER', label: 'Manager View', icon: UsersRound },
            ]}
          />
        ) : null}

        {message ? (
          <div
            className={
              messageTone === 'SUCCESS'
                ? 'rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]'
                : 'rounded-2xl border border-[#f4c7c7] bg-[#fff5f5] px-4 py-3 text-label font-semibold text-[#b42318]'
            }
          >
            {message}
          </div>
        ) : null}

        {view === 'MY' ? (
          <>
            <ExpenseSurface title="This Month Overview">
              <div className="expense-summary-grid">
                <ExpenseSummaryCard icon={CookingPot} label="Food" value={loading ? <LoadingIndicator size="sm" label="Loading food expenses" /> : formatTaka(my?.foodBill)} />
                <ExpenseSummaryCard icon={Zap} label="Utility" value={loading ? <LoadingIndicator size="sm" label="Loading utility expenses" /> : formatTaka(my?.utilityBill)} accent="blue" />
                <ExpenseSummaryCard icon={House} label="Rent" value={loading ? <LoadingIndicator size="sm" label="Loading rent" /> : formatTaka(my?.roomRent)} accent="violet" />
                <ExpenseSummaryCard icon={WalletCards} label="Total" value={loading ? <LoadingIndicator size="sm" label="Loading total expenses" /> : formatTaka(my?.total)} caption={`${my?.transactionCount ?? 0} txns`} accent="green" />
              </div>

              <ExpenseDetailsCta href="/monthly-bill" title="Total Expenses This Month" subtitle="Food, utility and rent" buttonLabel="Details" />
            </ExpenseSurface>

            <ExpenseSurface
              title="Recent Expenses"
              aside={<span className="text-caption font-bold text-[#65838b]">This month</span>}
            >
              <div className="flush-list flush-list--home-panel">
                {(summary?.recentExpenses ?? []).map((item) => (
                  <ExpenseListItem
                    key={item.id}
                    item={item}
                    href={`/expense-details?expenseId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                    variant="horizontal"
                  />
                ))}
                {!loading && !summary?.recentExpenses?.length ? <div className="expense-empty-state mx-3">No expenses found for this month.</div> : null}
              </div>
            </ExpenseSurface>

            {!isManager ? (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/add-expense" className="expense-primary-action">
                  <Plus size={18} /> Add Personal Expense
                </Link>
                <Link href="/add-utility" className="expense-secondary-action">
                  <Zap size={18} /> Add Personal Utility
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <ExpenseSurface>
              <div>
                <label className="relative block">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65838b]" size={18} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-12 w-full rounded-[15px] border border-[#dce5ec] bg-white pl-11 pr-3 text-label font-medium text-[#123748] outline-none placeholder:text-[#8293a5] focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
                    placeholder="Search member by name or email"
                  />
                </label>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {([
                  ['ALL', 'All'],
                  ['DUE', 'With Due'],
                  ['PAID', 'Fully Paid'],
                ] as Array<[MemberFilter, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMemberFilter(value)}
                    className={`h-9 rounded-full border text-caption font-bold ${memberFilter === value ? 'border-[#008d8c] bg-[#008d8c] text-white' : 'border-[#dce5ec] bg-white text-[#65838b]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <ExpenseSummaryCard icon={CircleDollarSign} label="Total" value={formatTaka(manager?.totalExpenses)} />
                <ExpenseSummaryCard icon={Zap} label="Utility" value={formatTaka(manager?.totalUtility)} accent="blue" />
                <ExpenseSummaryCard icon={Landmark} label="Deposit" value={formatTaka(manager?.fromDeposit)} accent="green" />
                <ExpenseSummaryCard icon={UsersRound} label="Members" value={manager?.members ?? 0} accent="violet" />
              </div>
            </ExpenseSurface>

            <ExpenseSurface title="Available Funds">
              <div className="grid grid-cols-2 gap-2.5">
                <ExpenseSummaryCard
                  icon={Landmark}
                  label="Mess Deposit"
                  value={formatTaka(fundBalances?.messDepositBalance)}
                  accent="green"
                />
                <ExpenseSummaryCard
                  icon={UsersRound}
                  label="Collected Fund"
                  value={formatTaka(fundBalances?.collectedFundBalance)}
                  accent="violet"
                />
              </div>
              <div className="mt-4 grid gap-2.5">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={collectedAmount}
                  onChange={(event) => setCollectedAmount(event.target.value)}
                  className="h-12 rounded-[15px] border border-[#dce5ec] bg-white px-4 text-label font-medium text-[#123748] outline-none focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
                  placeholder="Collected fund amount"
                />
                <input
                  value={collectedNote}
                  onChange={(event) => setCollectedNote(event.target.value.slice(0, 250))}
                  className="h-12 rounded-[15px] border border-[#dce5ec] bg-white px-4 text-label font-medium text-[#123748] outline-none focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
                  placeholder="Collection note (optional)"
                />
                <button
                  type="button"
                  onClick={() => void addCollectedFund()}
                  disabled={fundBusy}
                  className="expense-secondary-action disabled:opacity-60"
                >
                  <Plus size={18} /> {fundBusy ? 'Recording...' : 'Record Collected Fund'}
                </button>
              </div>
            </ExpenseSurface>

            <ExpenseSurface title="Member Overview" aside={<span className="text-caption font-bold text-[#65838b]">{filteredMembers.length} shown</span>}>
              <div className="-mx-3 overflow-hidden rounded-[16px] border border-[#edf1f4]">
                {filteredMembers.map((item, index) => (
                  <div key={item.member?.id ?? index} className="flex items-center gap-3 border-b border-[#edf1f4] bg-white px-3 py-3 last:border-b-0">
                    <MemberInitials name={item.member?.name} accent={index % 2 ? 'blue' : 'teal'} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-label font-bold text-[#123748]">{item.member?.name ?? 'Member'}</div>
                      <div className="mt-0.5 truncate text-caption font-medium text-[#65838b]">{item.member?.email ?? 'No email'}</div>
                    </div>
                    <div className="hidden text-right min-[380px]:block">
                      <div className="text-caption font-semibold text-[#65838b]">Total</div>
                      <div className="text-label font-bold text-[#008d8c]">{formatTaka(item.totalCost)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-label font-bold ${Number(item.due ?? 0) > 0 ? 'text-[#e02d37]' : 'text-[#65838b]'}`}>{formatTaka(item.due)}</div>
                      <MemberStatus member={item} />
                    </div>
                  </div>
                ))}
                {!loading && !filteredMembers.length ? <div className="expense-empty-state">No matching members found.</div> : null}
              </div>
            </ExpenseSurface>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/add-expense" className="expense-primary-action">
                <Plus size={18} /> Add Expense
              </Link>
              <Link href="/add-utility" className="expense-secondary-action">
                <Zap size={18} /> Add Utility
              </Link>
            </div>
          </>
        )}
      </div>
    </MobileShell>
  )
}
