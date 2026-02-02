'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Card } from './Card'
import { Button } from './Button'
import { X, Download } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useMemo } from 'react'

export function QRCodeModal({ isOpen, onClose, value, title, description, webhookUrl }) {
  const { t } = useI18n()

  if (!isOpen || !value) return null
  
  // Get webhook URL from props or construct it
  const appWebhookUrl = webhookUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/shortcut` : '')

  const handleDownload = async () => {
    try {
      const svg = document.getElementById('qrcode-svg')
      if (!svg) return

      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = 300
        canvas.height = 300
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, 300, 300)
        
        canvas.toBlob((blob) => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'monity-shortcut-qr.png'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 'image/png')
      }

      img.onerror = () => {
        console.error('Failed to load SVG image')
      }

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      img.src = url
    } catch (error) {
      console.error('Failed to download QR code:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <Card className="max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              {title || t('settings.qrCodeTitle')}
            </h3>
            {description && (
              <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-light-surface dark:hover:bg-dark-surface transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl">
          <QRCodeSVG
            id="qrcode-svg"
            value={value}
            size={256}
            level="H"
            includeMargin={true}
            fgColor="#1F2937"
            bgColor="#FFFFFF"
          />
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-4 text-center max-w-xs">
            {t('settings.qrCodeInstructions')}
          </p>
        </div>

        {/* Detailed Instructions */}
        <div className="mt-4 p-4 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border-light dark:border-dark-border-light">
          <h4 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
            {t('settings.qrCodeSteps')}
          </h4>
          <ol className="space-y-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <li className="flex items-start gap-2">
              <span className="font-medium text-light-accent dark:text-dark-accent flex-shrink-0">1.</span>
              <span>{t('settings.qrCodeStep1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-light-accent dark:text-dark-accent flex-shrink-0">2.</span>
              <span>{t('settings.qrCodeStep2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-light-accent dark:text-dark-accent flex-shrink-0">3.</span>
              <span>{t('settings.qrCodeStep3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-light-accent dark:text-dark-accent flex-shrink-0">4.</span>
              <span>{t('settings.qrCodeStep4')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-light-accent dark:text-dark-accent flex-shrink-0">5.</span>
              <span>{t('settings.qrCodeStep5', { webhookUrl: appWebhookUrl })}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-light-accent dark:text-dark-accent flex-shrink-0">6.</span>
              <span>{t('settings.qrCodeStep6')}</span>
            </li>
          </ol>
          <p className="mt-3 text-xs text-light-text-tertiary dark:text-dark-text-tertiary italic">
            {t('settings.qrCodeNote')}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('common.download')}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            {t('common.close')}
          </Button>
        </div>
      </Card>
    </div>
  )
}

