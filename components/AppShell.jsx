'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  TrendingUp, 
  PiggyBank, 
  Settings,
  Menu,
  X,
  ChevronDown,
  Wallet,
  Repeat,
  Key,
  Palette
} from 'lucide-react'
import { ThemeToggle } from './ui/ThemeToggle'
import { IconButton } from './ui/Button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'

// Separate component for settings sub-items that uses searchParams
function SettingsSubNav({ isSettingsActive, settingsExpanded, isRTL, t }) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')

  const settingsSubItems = [
    { id: 'general', name: t('settings.tabs.general'), icon: Palette, href: '/settings?tab=general' },
    { id: 'accounts', name: t('settings.tabs.accounts'), icon: Wallet, href: '/settings?tab=accounts' },
    { id: 'recurring', name: t('settings.tabs.recurring'), icon: Repeat, href: '/settings?tab=recurring' },
    { id: 'api', name: t('settings.tabs.api'), icon: Key, href: '/settings?tab=api' },
  ]

  return (
    <div className={cn(
      "overflow-hidden transition-all duration-300",
      settingsExpanded ? "max-h-64 opacity-100 mt-1" : "max-h-0 opacity-0"
    )}>
      <div className={cn(
        "space-y-1",
        isRTL ? "pr-4" : "pl-4"
      )}>
        {settingsSubItems.map((subItem) => {
          const SubIcon = subItem.icon
          const isSubActive = isSettingsActive && currentTab === subItem.id
          const isDefaultActive = isSettingsActive && !currentTab && subItem.id === 'general'
          const active = isSubActive || isDefaultActive
          
          return (
            <Link
              key={subItem.id}
              href={subItem.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-light-accent/10 dark:bg-dark-accent/20 text-light-accent dark:text-dark-accent'
                  : 'text-light-text-tertiary dark:text-dark-text-tertiary hover:bg-light-surface dark:hover:bg-dark-elevated hover:text-light-text-secondary dark:hover:text-dark-text-secondary'
              )}
            >
              <SubIcon className="w-4 h-4 flex-shrink-0" />
              {subItem.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function AppShell({ children }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState(pathname.startsWith('/settings'))
  const { t, isRTL } = useI18n()

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.transactions'), href: '/transactions', icon: Receipt },
    { name: t('nav.budget'), href: '/budget', icon: Target },
    { name: t('nav.analytics'), href: '/analytics', icon: TrendingUp },
    { name: t('nav.goals'), href: '/goals', icon: PiggyBank },
  ]

  const mobileNav = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.transactions'), href: '/transactions', icon: Receipt },
    { name: t('nav.budget'), href: '/budget', icon: Target },
    { name: t('nav.analytics'), href: '/analytics', icon: TrendingUp },
  ]

  const isSettingsActive = pathname === '/settings'

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col",
        isRTL ? "lg:right-0" : "lg:left-0"
      )}>
        <div className={cn(
          "flex flex-col flex-1 bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-xl",
          isRTL ? "border-l border-light-border dark:border-dark-border" : "border-r border-light-border dark:border-dark-border"
        )}>
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-light-border dark:border-dark-border">
            <Link href="/dashboard" className={cn(
              "flex items-center group",
              isRTL ? "space-x-reverse space-x-3" : "space-x-3"
            )}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-light-accent to-blue-600 dark:from-dark-accent dark:to-blue-500 flex items-center justify-center shadow-soft">
                <span className="text-xl font-bold text-white">M</span>
              </div>
              <span className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                Monity
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-light-accent dark:bg-dark-accent text-white shadow-soft'
                      : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface dark:hover:bg-dark-elevated hover:text-light-text-primary dark:hover:text-dark-text-primary'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}

            {/* Settings Section with Sub-items */}
            <div className="pt-2">
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className={cn(
                  'flex items-center justify-between w-full gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isSettingsActive && !settingsExpanded
                    ? 'bg-light-accent dark:bg-dark-accent text-white shadow-soft'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface dark:hover:bg-dark-elevated hover:text-light-text-primary dark:hover:text-dark-text-primary'
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  {t('nav.settings')}
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  settingsExpanded && "rotate-180"
                )} />
              </button>

              {/* Sub-items - wrapped in Suspense to prevent blocking */}
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

          {/* User Section */}
          <div className="border-t border-light-border dark:border-dark-border p-4">
            <div className="flex items-center justify-between">
              <UserButton afterSignOutUrl="/sign-in" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-xl border-b border-light-border dark:border-dark-border">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/dashboard" className={cn(
            "flex items-center",
            isRTL ? "space-x-reverse space-x-2" : "space-x-2"
          )}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-light-accent to-blue-600 dark:from-dark-accent dark:to-blue-500 flex items-center justify-center">
              <span className="text-base font-bold text-white">M</span>
            </div>
            <span className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Monity
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen pb-20 lg:pb-0",
        isRTL ? "lg:pr-72" : "lg:pl-72"
      )}>
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-xl border-t border-light-border dark:border-dark-border safe-area-bottom">
        <nav className="flex items-center justify-around h-16 px-2">
          {mobileNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors',
                  isActive
                    ? 'text-light-accent dark:text-dark-accent'
                    : 'text-light-text-tertiary dark:text-dark-text-tertiary'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
          {/* Settings in mobile nav */}
          <Link
            href="/settings"
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors',
              isSettingsActive
                ? 'text-light-accent dark:text-dark-accent'
                : 'text-light-text-tertiary dark:text-dark-text-tertiary'
            )}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">{t('nav.settings')}</span>
          </Link>
        </nav>
      </div>

    </div>
  )
}
