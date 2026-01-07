'use client'

import { useI18n } from '@/lib/i18n-context'
import { Select } from './Input'
import { Globe } from 'lucide-react'

export function LanguageSelector() {
  const { locale, changeLocale, locales, t } = useI18n()

  const handleChange = (e) => {
    changeLocale(e.target.value)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-light-accent-light dark:bg-dark-accent-light flex items-center justify-center flex-shrink-0">
        <Globe className="w-5 h-5 text-light-accent dark:text-dark-accent" />
      </div>
      <div className="flex-1">
        <Select
          label={t('settings.selectLanguage')}
          value={locale}
          onChange={handleChange}
        >
          {Object.values(locales).map((loc) => (
            <option key={loc.code} value={loc.code}>
              {loc.name} ({loc.currency})
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}

