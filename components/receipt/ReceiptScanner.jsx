'use client'

import { useState, useRef, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check,
  RefreshCw,
  ScanLine,
  AlertCircle,
  Receipt
} from 'lucide-react'

// Simple regex patterns to extract data from receipt text
const AMOUNT_PATTERNS = [
  /(?:total|סה"כ|סך הכל|לתשלום|total due|amount|sum)[:\s]*[$₪]?\s*([\d,]+\.?\d*)/i,
  /[$₪]\s*([\d,]+\.?\d{2})/g,
  /([\d,]+\.?\d{2})\s*[$₪]/g,
  /\b(\d{1,3}(?:,\d{3})*\.?\d{2})\b/g,
]

const DATE_PATTERNS = [
  /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,
  /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
]

export function ReceiptScanner({ isOpen, onClose, onExtracted }) {
  const { t } = useI18n()
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  const [image, setImage] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)

  // Extract data from OCR text
  const extractDataFromText = useCallback((text) => {
    const result = {
      amount: null,
      date: null,
      merchant: null,
      rawText: text,
    }

    // Extract amount (largest number that looks like a price)
    let amounts = []
    for (const pattern of AMOUNT_PATTERNS) {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const numMatch = match.match(/([\d,]+\.?\d*)/)?.[1]
          if (numMatch) {
            const num = parseFloat(numMatch.replace(',', ''))
            if (!isNaN(num) && num > 0 && num < 100000) {
              amounts.push(num)
            }
          }
        })
      }
    }
    
    // Take the largest reasonable amount (likely the total)
    if (amounts.length > 0) {
      amounts.sort((a, b) => b - a)
      result.amount = amounts[0]
    }

    // Extract date
    for (const pattern of DATE_PATTERNS) {
      const match = text.match(pattern)
      if (match) {
        try {
          const parts = match.slice(1).map(p => parseInt(p))
          let year, month, day
          
          if (parts[0] > 1000) {
            // YYYY-MM-DD format
            year = parts[0]
            month = parts[1]
            day = parts[2]
          } else if (parts[2] > 1000) {
            // DD-MM-YYYY format
            day = parts[0]
            month = parts[1]
            year = parts[2]
          } else {
            // DD-MM-YY format
            day = parts[0]
            month = parts[1]
            year = parts[2] + 2000
          }
          
          const date = new Date(year, month - 1, day)
          if (!isNaN(date.getTime())) {
            result.date = date.toISOString().split('T')[0]
            break
          }
        } catch {
          // Continue to next pattern
        }
      }
    }

    // Extract merchant (first line that looks like a business name)
    const lines = text.split('\n').filter(l => l.trim().length > 2)
    for (const line of lines.slice(0, 5)) {
      // Skip lines that are mostly numbers or too short
      const cleanLine = line.trim()
      if (cleanLine.length > 3 && cleanLine.length < 50 && !/^\d+[\d\s,.\-/:]*$/.test(cleanLine)) {
        result.merchant = cleanLine
        break
      }
    }

    return result
  }, [])

  // Process image with Tesseract.js
  const processImage = useCallback(async (imageData) => {
    setProcessing(true)
    setExtractedData(null)

    try {
      // Dynamically import Tesseract.js
      const Tesseract = (await import('tesseract.js')).default
      
      const result = await Tesseract.recognize(imageData, 'eng+heb', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Could add progress indicator here
          }
        },
      })

      const extractedInfo = extractDataFromText(result.data.text)
      setExtractedData(extractedInfo)

      if (!extractedInfo.amount && !extractedInfo.date && !extractedInfo.merchant) {
        toast.error(t('receipt.error'), t('receipt.tip'))
      }
    } catch (error) {
      console.error('OCR Error:', error)
      toast.error(t('receipt.error'), error.message)
    } finally {
      setProcessing(false)
    }
  }, [extractDataFromText, toast, t])

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result
      setImage(imageData)
      processImage(imageData)
    }
    reader.readAsDataURL(file)
  }, [processImage])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      setCameraStream(stream)
      setShowCamera(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Camera error:', error)
      toast.error(t('receipt.noCamera'), error.message)
    }
  }, [toast, t])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }, [cameraStream])

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg')
    setImage(imageData)
    stopCamera()
    processImage(imageData)
  }, [stopCamera, processImage])

  // Use extracted data
  const handleConfirm = useCallback(() => {
    if (extractedData) {
      onExtracted({
        amount: extractedData.amount ? String(extractedData.amount) : '',
        description: extractedData.merchant || '',
        date: extractedData.date || new Date().toISOString().split('T')[0],
      })
      handleReset()
      onClose()
    }
  }, [extractedData, onExtracted, onClose])

  // Reset state
  const handleReset = useCallback(() => {
    setImage(null)
    setExtractedData(null)
    setProcessing(false)
    stopCamera()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [stopCamera])

  // Cleanup on close
  const handleClose = useCallback(() => {
    handleReset()
    onClose()
  }, [handleReset, onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('receipt.title')}
      size="md"
    >
      <div className="space-y-4">
        {/* Camera View */}
        {showCamera && (
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-2/3 border-2 border-white/50 rounded-lg" />
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button
                variant="ghost"
                onClick={stopCamera}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <X className="w-5 h-5" />
              </Button>
              <Button
                onClick={capturePhoto}
                className="bg-white text-black hover:bg-white/90 px-8"
              >
                <Camera className="w-5 h-5 mr-2" />
                {t('receipt.takePhoto')}
              </Button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Upload/Camera Buttons */}
        {!showCamera && !image && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed border-[rgb(var(--border-primary))] rounded-xl p-8",
                "flex flex-col items-center justify-center gap-3 cursor-pointer",
                "hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/5 transition-all"
              )}
            >
              <div className="w-14 h-14 rounded-full bg-[rgb(var(--accent))]/10 flex items-center justify-center">
                <Receipt className="w-7 h-7 text-[rgb(var(--accent))]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  {t('receipt.uploadImage')}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                  {t('receipt.tip')}
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Button
              variant="secondary"
              onClick={startCamera}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              {t('receipt.takePhoto')}
            </Button>
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="relative">
              <ScanLine className="w-12 h-12 text-[rgb(var(--accent))] animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[rgb(var(--accent))] animate-spin" />
              </div>
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              {t('receipt.processing')}
            </p>
          </div>
        )}

        {/* Image Preview & Extracted Data */}
        {image && !processing && (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={image}
                alt="Receipt"
                className="w-full max-h-48 object-contain bg-[rgb(var(--bg-tertiary))]"
              />
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Extracted Data */}
            {extractedData && (extractedData.amount || extractedData.date || extractedData.merchant) && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {t('receipt.detected')}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {extractedData.amount && (
                    <div className="flex justify-between">
                      <span className="text-[rgb(var(--text-secondary))]">{t('receipt.amount')}:</span>
                      <span className="font-semibold text-[rgb(var(--text-primary))]">
                        {extractedData.amount}
                      </span>
                    </div>
                  )}
                  {extractedData.date && (
                    <div className="flex justify-between">
                      <span className="text-[rgb(var(--text-secondary))]">{t('receipt.date')}:</span>
                      <span className="font-semibold text-[rgb(var(--text-primary))]">
                        {extractedData.date}
                      </span>
                    </div>
                  )}
                  {extractedData.merchant && (
                    <div className="flex justify-between">
                      <span className="text-[rgb(var(--text-secondary))]">{t('receipt.merchant')}:</span>
                      <span className="font-semibold text-[rgb(var(--text-primary))] truncate max-w-[200px]">
                        {extractedData.merchant}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No Data Found */}
            {extractedData && !extractedData.amount && !extractedData.date && !extractedData.merchant && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    {t('receipt.error')}
                  </span>
                </div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-2">
                  {t('receipt.tip')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {image && !processing && (
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('receipt.retry')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!extractedData?.amount && !extractedData?.merchant}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              {t('receipt.confirm')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
