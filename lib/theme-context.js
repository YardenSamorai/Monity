'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Default values for SSR
const defaultThemeValue = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
}

const ThemeContext = createContext(defaultThemeValue)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('system')
  const [resolvedTheme, setResolvedTheme] = useState('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get saved theme or default to system
    const saved = localStorage.getItem('theme') || 'system'
    setThemeState(saved)
    applyTheme(saved)
  }, [])

  const applyTheme = (newTheme) => {
    const root = document.documentElement
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.remove('light', 'dark')
      root.classList.add(systemTheme)
      setResolvedTheme(systemTheme)
    } else {
      root.classList.remove('light', 'dark')
      root.classList.add(newTheme)
      setResolvedTheme(newTheme)
    }
  }

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('system')
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div className="bg-light-bg dark:bg-dark-bg">{children}</div>
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return default values if context is not available (SSR)
  if (!context) {
    return defaultThemeValue
  }
  return context
}

