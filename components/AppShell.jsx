'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  TrendingUp, 
  PiggyBank, 
  Settings,
  ChevronDown,
  Users,
  Sparkles,
  Menu,
  X
} from 'lucide-react'
import { ThemeToggle } from './ui/ThemeToggle'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'

function SettingsSubNav({ isSettingsActive, settingsExpanded, isRTL, t }) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')

  const settingsSubItems = [
    { id: 'general', name: t('settings.tabs.general'), href: '/settings?tab=general' },
    { id: 'accounts', name: t('settings.tabs.accounts'), href: '/settings?tab=accounts' },
    { id: 'recurring', name: t('settings.tabs.recurring'), href: '/settings?tab=recurring' },
    { id: 'api', name: t('settings.tabs.api'), href: '/settings?tab=api' },
  ]

  if (!settingsExpanded) return null

  return (
    <div className={cn("mt-1 space-y-0.5", isRTL ? "pr-8" : "pl-8")}>
      {settingsSubItems.map((subItem) => {
        const isSubActive = isSettingsActive && currentTab === subItem.id
        const isDefaultActive = isSettingsActive && !currentTab && subItem.id === 'general'
        const active = isSubActive || isDefaultActive
        
        return (
          <Link
            key={subItem.id}
            href={subItem.href}
            prefetch={true}
            className={cn(
              'block px-3 py-2 rounded-md text-sm transition-colors',
              active
                ? 'text-[rgb(var(--accent))] bg-[rgb(var(--accent))]/5 font-medium'
                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
            )}
          >
            {subItem.name}
          </Link>
        )
      })}
    </div>
  )
}

export default function AppShell({ children }) {
  const pathname = usePathname()
  const [settingsExpanded, setSettingsExpanded] = useState(pathname.startsWith('/settings'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t, isRTL } = useI18n()

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.transactions'), href: '/transactions', icon: Receipt },
    { name: t('nav.budget'), href: '/budget', icon: Target },
    { name: t('nav.goals'), href: '/goals', icon: PiggyBank },
    { name: t('nav.family'), href: '/family', icon: Users },
    { name: t('nav.analytics'), href: '/analytics', icon: TrendingUp },
    { name: t('nav.insights'), href: '/insights', icon: Sparkles },
  ]

  const mobileNav = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.transactions'), href: '/transactions', icon: Receipt },
    { name: t('nav.budget'), href: '/budget', icon: Target },
    { name: t('nav.goals'), href: '/goals', icon: PiggyBank },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ]

  const isSettingsActive = pathname === '/settings'

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:w-56 lg:flex-col",
        isRTL ? "lg:right-0 lg:border-l" : "lg:left-0 lg:border-r",
        "border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))]"
      )}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-[rgb(var(--border-primary))]">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image 
                src="/MonityLogo.svg" 
                alt="Monity" 
                width={40} 
                height={40} 
                className="rounded-lg"
              />
              <span className="text-lg font-semibold text-[rgb(var(--text-primary))]">Monity</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'text-[rgb(var(--accent))] bg-[rgb(var(--accent))]/5'
                      : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}

            {/* Settings with submenu */}
            <div className="pt-4 mt-4 border-t border-[rgb(var(--border-secondary))]">
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isSettingsActive
                    ? 'text-[rgb(var(--accent))] bg-[rgb(var(--accent))]/5'
                    : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  {t('nav.settings')}
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  settingsExpanded && "rotate-180"
                )} />
              </button>
              <Suspense fallback={null}>
                <SettingsSubNav 
                  isSettingsActive={isSettingsActive} 
                  settingsExpanded={settingsExpanded} 
                  isRTL={isRTL} 
                  t={t} 
                />
              </Suspense>
            </div>
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-[rgb(var(--border-primary))]">
            <div className="flex items-center justify-between">
              <UserButton afterSignOutUrl="/sign-in" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-[rgb(var(--bg-secondary))] border-b border-[rgb(var(--border-primary))] safe-area-top">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image 
              src="/MonityLogo.svg" 
              alt="Monity" 
              width={36} 
              height={36} 
              className="rounded-lg"
            />
            <span className="text-lg font-semibold text-[rgb(var(--text-primary))]">Monity</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen pb-20 lg:pb-0",
        isRTL ? "lg:mr-56" : "lg:ml-56"
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[rgb(var(--bg-secondary))] border-t border-[rgb(var(--border-primary))] safe-area-bottom">
        <div className="flex items-stretch h-16">
          {mobileNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href === '/settings' && pathname.startsWith('/settings'))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 touch-target',
                  isActive
                    ? 'text-[rgb(var(--accent))]'
                    : 'text-[rgb(var(--text-tertiary))]'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
