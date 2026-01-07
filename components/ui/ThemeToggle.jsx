'use client'

import { useTheme } from '@/lib/theme-context'
import { useI18n } from '@/lib/i18n-context'
import { IconButton } from './Button'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle({ showLabel = false }) {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />
      case 'dark':
        return <Moon className="w-5 h-5" />
      case 'system':
        return <Monitor className="w-5 h-5" />
      default:
        return <Monitor className="w-5 h-5" />
    }
  }

  if (showLabel) {
    return (
      <button
        onClick={cycleTheme}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-light-text-primary dark:text-dark-text-primary hover:bg-light-surface dark:hover:bg-dark-surface transition-colors"
      >
        {getIcon()}
        <span className="flex-1 text-left">
          {theme === 'light' && t('settings.themeLight')}
          {theme === 'dark' && t('settings.themeDark')}
          {theme === 'system' && t('settings.themeSystem')}
        </span>
      </button>
    )
  }

  return (
    <IconButton
      onClick={cycleTheme}
      variant="ghost"
      aria-label={t('settings.toggleTheme')}
    >
      {getIcon()}
    </IconButton>
  )
}

