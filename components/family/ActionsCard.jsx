'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n-context'
import { 
  LogOut, 
  Download, 
  FileSpreadsheet,
  FileText,
  Settings
} from 'lucide-react'

export function ActionsCard({ household, onLeave, isOwner }) {
  const { t } = useI18n()

  const handleExport = async (format) => {
    // TODO: Implement export functionality
    console.log('Export to', format)
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[rgb(var(--border-primary))]">
        <h3 className="font-semibold text-[rgb(var(--text-primary))]">
          {t('family.quickActions')}
        </h3>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        {/* Export Options */}
        {isOwner && (
          <>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[rgb(var(--bg-tertiary))] transition-colors text-start"
            >
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  {t('family.exportPDF')}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('family.exportPDFDesc')}
                </p>
              </div>
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[rgb(var(--bg-tertiary))] transition-colors text-start"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  {t('family.exportExcel')}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('family.exportExcelDesc')}
                </p>
              </div>
            </button>
          </>
        )}

        {/* Leave Household - Danger Zone */}
        <div className="pt-4 mt-4 border-t border-[rgb(var(--border-primary))]">
          <p className="text-xs font-medium text-[rgb(var(--text-tertiary))] mb-2 uppercase tracking-wide">
            {t('settings.dangerZone')}
          </p>
          <button
            onClick={onLeave}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('family.leaveHousehold')}</span>
          </button>
        </div>
      </div>
    </Card>
  )
}
