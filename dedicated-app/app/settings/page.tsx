'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, KeyRound, LoaderCircle, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'
import { useDialogFocus } from '@/hooks/use-dialog-focus'
import { useAuth } from '../providers'

export default function SettingsPage() {
  const { locale } = useLocale()
  const { logout } = useAuth()
  const navigation = useTranslations('navigation')
  const auth = useTranslations('auth')
  const profile = useTranslations('profile')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const deleteDialogRef = useRef<HTMLDivElement>(null)
  const keepAccountRef = useRef<HTMLButtonElement>(null)

  useDialogFocus({
    open: deleteDialogOpen,
    containerRef: deleteDialogRef,
    initialFocusRef: keepAccountRef,
    onClose: () => {
      if (!deletingAccount) setDeleteDialogOpen(false)
    },
  })

  async function handleDeleteAccount() {
    if (deletingAccount) return
    setDeletingAccount(true)
    setDeleteError('')
    try {
      await api.deleteAccount()
      await logout()
    } catch (error) {
      setDeleteError(localizedErrorMessage(error, locale, profile('deleteAccountFailed')))
      setDeletingAccount(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={navigation('settings')} subtitle={profile('accountPreferences')} backHref="/" />
      <div className="screen space-y-4">
        <section className="ui-card overflow-hidden" style={{ padding: 0 }}>
          <div className="flex items-center gap-3 border-b border-[#e4eaec] px-4 py-3.5">
            <div className="ui-icon-tile ui-icon-tile--lg bg-[#dff4f3] text-[#008d8c]" aria-hidden="true"><ShieldCheck size={24} /></div>
            <div>
              <div className="ui-body font-semibold">{profile('accountSecurity')}</div>
              <div className="ui-caption mt-0.5">{profile('manageProfilePassword')}</div>
            </div>
          </div>
          <Link href={appHref('/edit-profile')} className="flex items-center gap-3 border-b border-[#e4eaec] px-4 py-3.5 transition-colors active:bg-[#edfafa]" aria-label={profile('editProfile')}>
            <div className="ui-icon-tile ui-icon-tile--md bg-[#edfafa] text-[#008d8c]" aria-hidden="true"><UserRound size={19} /></div>
            <div className="min-w-0 flex-1"><div className="ui-label">{profile('title')}</div><div className="ui-caption mt-0.5">{profile('profileRowDescription')}</div></div>
            <ChevronRight size={18} className="shrink-0 text-[#78a4a9]" aria-hidden="true" />
          </Link>
          <Link href={appHref('/change-password')} className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-[#edfafa]" aria-label={profile('changePassword')}>
            <div className="ui-icon-tile ui-icon-tile--md bg-[#edfafa] text-[#008d8c]" aria-hidden="true"><KeyRound size={19} /></div>
            <div className="min-w-0 flex-1"><div className="ui-label">{auth('password')}</div><div className="ui-caption mt-0.5">{profile('passwordRowDescription')}</div></div>
            <ChevronRight size={18} className="shrink-0 text-[#78a4a9]" aria-hidden="true" />
          </Link>
        </section>

        <section className="rounded-[18px] border border-[#f0b8b8] bg-[#fffafa] p-4" aria-labelledby="danger-zone-title">
          <div className="flex items-start gap-3">
            <div className="ui-icon-tile ui-icon-tile--md shrink-0 bg-[#fff0f0] text-[#b42318]" aria-hidden="true">
              <AlertTriangle size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="danger-zone-title" className="ui-body font-semibold text-[#7a271a]">
                {profile('dangerZone')}
              </h2>
              <p className="ui-caption mt-1 leading-5 text-[#8f4b43]">{profile('deleteAccountDescription')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteError('')
              setDeleteDialogOpen(true)
            }}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-[#d92d20] bg-white text-label font-semibold text-[#b42318] transition-colors active:bg-[#fff0f0]"
          >
            <Trash2 size={17} aria-hidden="true" />
            {profile('deleteAccount')}
          </button>
        </section>
      </div>

      {deleteDialogOpen ? (
        <div
          ref={deleteDialogRef}
          className="fixed inset-0 z-[100] grid place-items-center bg-[#062b35]/45 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          aria-describedby="delete-account-description"
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget && !deletingAccount) setDeleteDialogOpen(false)
          }}
        >
          <section className="w-full max-w-sm rounded-[22px] bg-white p-5 shadow-[0_22px_60px_rgba(18,55,72,0.22)]">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff0f0] text-[#b42318]" aria-hidden="true">
              <Trash2 size={22} />
            </div>
            <h2 id="delete-account-title" className="mt-3 text-center text-title-sm font-semibold text-[#7a271a]">
              {profile('deleteAccountQuestion')}
            </h2>
            <p id="delete-account-description" className="mt-2 text-center text-caption font-medium leading-5 text-[#65838b]">
              {profile('deleteAccountWarning')}
            </p>

            {deleteError ? (
              <div className="ui-notice ui-notice--danger mt-4" role="alert">
                {deleteError}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                ref={keepAccountRef}
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deletingAccount}
                className="h-11 rounded-[14px] border border-[#c8d9df] bg-white text-label font-semibold text-[#365963] disabled:opacity-60"
              >
                {profile('keepAccount')}
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={deletingAccount}
                className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#b42318] text-label font-semibold text-white disabled:opacity-60"
              >
                {deletingAccount ? (
                  <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 size={17} aria-hidden="true" />
                )}
                {deletingAccount ? profile('deletingAccount') : profile('confirmDeleteAccount')}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </MobileShell>
  )
}
