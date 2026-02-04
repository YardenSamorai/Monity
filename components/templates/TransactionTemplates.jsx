'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n-context'
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Zap, 
  Coffee, 
  ShoppingCart, 
  Car, 
  Home,
  Utensils,
  Smartphone,
  Heart,
  Briefcase,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

// Default templates to suggest to new users
const DEFAULT_TEMPLATES = [
  { id: 'coffee', name: 'Coffee', icon: 'Coffee', type: 'expense', amount: 15, description: 'Coffee' },
  { id: 'groceries', name: 'Groceries', icon: 'ShoppingCart', type: 'expense', amount: 200, description: 'Groceries' },
  { id: 'gas', name: 'Gas', icon: 'Car', type: 'expense', amount: 150, description: 'Gas' },
  { id: 'lunch', name: 'Lunch', icon: 'Utensils', type: 'expense', amount: 50, description: 'Lunch' },
]

const ICONS = {
  Coffee: Coffee,
  ShoppingCart: ShoppingCart,
  Car: Car,
  Home: Home,
  Utensils: Utensils,
  Smartphone: Smartphone,
  Heart: Heart,
  Briefcase: Briefcase,
  Zap: Zap,
  Bookmark: Bookmark,
}

const ICON_OPTIONS = Object.keys(ICONS)

// Local storage key
const TEMPLATES_KEY = 'monity_transaction_templates'

export function useTransactionTemplates() {
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    // Load templates from localStorage
    const saved = localStorage.getItem(TEMPLATES_KEY)
    if (saved) {
      try {
        setTemplates(JSON.parse(saved))
      } catch {
        setTemplates([])
      }
    }
  }, [])

  const saveTemplate = (template) => {
    const newTemplates = [...templates, { ...template, id: Date.now().toString() }]
    setTemplates(newTemplates)
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(newTemplates))
  }

  const deleteTemplate = (id) => {
    const newTemplates = templates.filter(t => t.id !== id)
    setTemplates(newTemplates)
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(newTemplates))
  }

  const addDefaultTemplates = () => {
    const newTemplates = [...templates, ...DEFAULT_TEMPLATES.filter(
      dt => !templates.some(t => t.name === dt.name)
    )]
    setTemplates(newTemplates)
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(newTemplates))
  }

  return { templates, saveTemplate, deleteTemplate, addDefaultTemplates }
}

export function TransactionTemplates({ 
  onSelect,
  onSaveAsTemplate,
  currentFormData,
  className 
}) {
  const { t, currencySymbol } = useI18n()
  const { templates, saveTemplate, deleteTemplate, addDefaultTemplates } = useTransactionTemplates()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateIcon, setNewTemplateIcon] = useState('Bookmark')

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return
    
    saveTemplate({
      name: newTemplateName,
      icon: newTemplateIcon,
      type: currentFormData.type,
      amount: currentFormData.amount ? parseFloat(currentFormData.amount) : 0,
      description: currentFormData.description,
      categoryId: currentFormData.categoryId,
    })
    
    setShowSaveModal(false)
    setNewTemplateName('')
  }

  const IconComponent = ({ iconName, className: iconClassName }) => {
    const Icon = ICONS[iconName] || Bookmark
    return <Icon className={iconClassName} />
  }

  // Don't render if no templates and not expanded
  if (templates.length === 0 && !isExpanded) {
    return (
      <button
        type="button"
        onClick={() => {
          addDefaultTemplates()
          setIsExpanded(true)
        }}
        className={cn(
          "flex items-center gap-2 text-xs text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--accent))] transition-colors",
          className
        )}
      >
        <Bookmark className="w-3.5 h-3.5" />
        {t('templates.addTemplates')}
      </button>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          {t('templates.quickAdd')}
          <span className="text-[rgb(var(--text-tertiary))]">({templates.length})</span>
        </button>
        
        {currentFormData?.description && currentFormData?.amount && (
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1 text-xs text-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]/80"
          >
            <Plus className="w-3 h-3" />
            {t('templates.saveAsTemplate')}
          </button>
        )}
      </div>

      {/* Templates Grid */}
      {isExpanded && templates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group relative"
            >
              <button
                type="button"
                onClick={() => onSelect(template)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  "bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))]",
                  "hover:border-amber-500/50 hover:bg-amber-500/10",
                  "active:scale-95"
                )}
              >
                <IconComponent iconName={template.icon} className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  {template.name}
                </span>
                {template.amount > 0 && (
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">
                    {currencySymbol}{template.amount}
                  </span>
                )}
              </button>
              
              {/* Delete button (appears on hover) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteTemplate(template.id)
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save Template Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title={t('templates.saveTemplate')}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={t('templates.templateName')}
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder={t('templates.templateNamePlaceholder')}
          />

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
              {t('templates.selectIcon')}
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setNewTemplateIcon(iconName)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                    newTemplateIcon === iconName
                      ? "bg-amber-500 text-white"
                      : "bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-secondary))]"
                  )}
                >
                  <IconComponent iconName={iconName} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowSaveModal(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!newTemplateName.trim()}
              className="flex-1"
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
