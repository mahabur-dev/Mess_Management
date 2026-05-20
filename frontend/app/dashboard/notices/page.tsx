'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiClient, type Mess, type Notice, type NoticeType } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { Bell, Pin, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

const noticeTypes: NoticeType[] = ['MEAL', 'PAYMENT', 'EMERGENCY', 'MEETING', 'RULE_UPDATE', 'GENERAL']

export default function NoticesPage() {
  const [messes, setMesses] = useState<Mess[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<NoticeType>('GENERAL')
  const { user } = useAuth()
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ORGANIZER'

  async function load() {
    const messRes = await apiClient.getMesses().catch(() => null)
    const list = Array.isArray(messRes?.data)
      ? messRes.data
      : messRes?.data
        ? [messRes.data]
        : ((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])
    setMesses(list)
    if (list[0]) {
      const noticeRes = await apiClient.getNoticesByMess(list[0].id).catch(() => null)
      setNotices(Array.isArray(noticeRes?.data) ? noticeRes.data : [])
    }
  }

  useEffect(() => {
    load()
  }, [user?.role])

  async function publish() {
    if (!activeMess || !title.trim() || !body.trim()) return
    await apiClient.createNotice({ messId: activeMess.id, title, body, type })
    setTitle('')
    setBody('')
    await load()
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Notice Board" description="Post meal, payment, meeting and emergency notices" />
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[380px_1fr] lg:p-8">
        {isManager && <Card className="app-card h-fit p-5">
          <h2 className="mb-4 text-lg font-black">Create Notice</h2>
          <div className="space-y-4">
            <input className="soft-input w-full" placeholder="Notice title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="soft-input w-full" value={type} onChange={(e) => setType(e.target.value as NoticeType)}>
              {noticeTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
            <textarea className="min-h-28 w-full rounded-lg border border-border bg-white p-3 text-sm outline-none focus:border-[#6f3df4] focus:ring-2 focus:ring-[#6f3df4]/15" placeholder="Write notice..." value={body} onChange={(e) => setBody(e.target.value)} />
            <Button disabled={!activeMess} onClick={publish} className="gradient-button w-full rounded-lg font-bold">
              <Plus size={16} className="mr-2" /> Publish Notice
            </Button>
          </div>
        </Card>}

        <div className={`grid gap-4 md:grid-cols-2 ${isManager ? '' : 'lg:col-span-2'}`}>
          {notices.length === 0 && <Card className="app-card p-5 text-sm font-semibold text-muted-foreground">No notices yet.</Card>}
          {notices.map((notice) => (
            <Card key={notice.id} className="app-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]"><Bell size={18} /></span>
                {notice.is_pinned && <Pin size={16} className="text-[#f59e0b]" />}
              </div>
              <p className="text-xs font-black text-[#6f3df4]">{notice.type}</p>
              <h3 className="mt-2 text-lg font-black">{notice.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{notice.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
