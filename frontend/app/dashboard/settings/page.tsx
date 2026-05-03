'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Bell, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
          {/* Profile Section */}
          <Card className="p-6 border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6">Profile Information</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="mt-2 w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input
                  type="email"
                  defaultValue="john@example.com"
                  className="mt-2 w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Role</label>
                <div className="mt-2 px-4 py-2 border border-border rounded-lg bg-input text-foreground">
                  User
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>

          {/* Security Section */}
          <Card className="p-6 border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6">Security</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Current Password</label>
                <div className="mt-2 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent outline-none pr-10"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="mt-2 w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="mt-2 w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-accent outline-none"
                />
              </div>

              <div className="pt-4">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Change Password
                </Button>
              </div>
            </div>
          </Card>

          {/* Notifications Section */}
          <Card className="p-6 border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6">Notifications</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    emailNotifications ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      emailNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive instant alerts</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    pushNotifications ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      pushNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <Bell size={20} className="text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">Smart Notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified about important updates and reminders
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border border-destructive/30 bg-destructive/5">
            <h2 className="text-lg font-semibold text-destructive mb-6">Danger Zone</h2>

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
