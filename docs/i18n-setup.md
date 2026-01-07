# Internationalization (i18n) Setup

## Overview
Monity now supports multiple languages with full RTL (Right-to-Left) support and automatic currency conversion based on the selected language.

## Supported Languages

### English (en)
- Currency: USD ($)
- Direction: LTR
- Locale: en-US

### Hebrew (he)
- Currency: ILS (₪)
- Direction: RTL
- Locale: he-IL

## Features

### 1. Language Context (`lib/i18n-context.js`)
- Manages current locale state
- Provides translation function `t()`
- Handles RTL/LTR direction
- Auto-detects browser language on first visit
- Persists preference in localStorage

### 2. Translation Files (`lib/translations.js`)
- All UI text in both languages
- Organized by feature/page
- Easy to extend with new strings

### 3. Automatic Currency Switching
- English → USD ($)
- Hebrew → ILS (₪)
- Currency symbol and formatting adapt automatically

### 4. RTL Support
- Full RTL layout for Hebrew
- Mirror-friendly icons and components
- Tailwind RTL variants
- Proper text alignment

### 5. Date & Number Formatting
- Locale-aware date formatting
- Locale-aware number formatting
- Respects regional conventions

## Usage

### In Components

```jsx
import { useI18n } from '@/lib/i18n-context'

function MyComponent() {
  const { t, currencySymbol, localeString, isRTL } = useI18n()
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{formatCurrency(1000, { locale: localeString, symbol: currencySymbol })}</p>
      {isRTL && <span>This is RTL!</span>}
    </div>
  )
}
```

### Translation Function

```jsx
// Simple translation
t('common.save') // → "Save" or "שמור"

// With parameters
t('settings.recurringIncomeCreatedDesc', { description: 'Salary', day: 1 })
// → "Your Salary will be added automatically every month on day 1"
```

### Formatting Functions

```jsx
import { formatCurrency, formatDate } from '@/lib/utils'

// Currency with locale
formatCurrency(1000, { 
  locale: localeString, 
  symbol: currencySymbol 
})
// → "$1,000" or "1,000 ₪"

// Date with locale
formatDate(new Date(), 'short', localeString)
// → "Jan 7, 2026" or "7 בינו׳ 2026"
```

## Adding New Languages

### Step 1: Add to `lib/translations.js`

```javascript
export const translations = {
  en: { /* ... */ },
  he: { /* ... */ },
  es: { // New language
    common: {
      save: 'Guardar',
      // ...
    },
    // ...
  },
}
```

### Step 2: Add Locale Config in `lib/i18n-context.js`

```javascript
const LOCALES = {
  en: { /* ... */ },
  he: { /* ... */ },
  es: {
    code: 'es',
    name: 'Español',
    direction: 'ltr',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'es-ES',
  },
}
```

### Step 3: Test All Pages
- Dashboard
- Transactions
- Budget
- Analytics
- Goals
- Settings

## RTL Best Practices

### 1. Use Logical Properties
```css
/* Instead of margin-left */
margin-inline-start: 1rem;

/* Instead of padding-right */
padding-inline-end: 1rem;
```

### 2. Use Tailwind RTL Variants
```jsx
<div className="ml-4 rtl:mr-4">
  Content
</div>
```

### 3. Mirror Icons When Needed
```jsx
<ChevronRight className={isRTL ? 'transform scale-x-[-1]' : ''} />
```

### 4. Test Navigation
- Ensure sidebar/navigation works in both directions
- Check button order
- Verify modal/drawer placement

## Testing Checklist

- [ ] Switch between languages in Settings
- [ ] Verify all text is translated
- [ ] Check currency symbols ($ vs ₪)
- [ ] Verify number formatting (1,000.00 vs 1,000.00)
- [ ] Test date formatting
- [ ] Check RTL layout (Hebrew)
- [ ] Verify localStorage persistence
- [ ] Test browser language detection
- [ ] Check all modals and forms
- [ ] Verify toasts/notifications

## Common Issues

### FOUC (Flash of Unstyled Content)
**Solution:** The `<head>` script in `app/layout.js` prevents this by setting locale/RTL before page renders.

### Text Not Translating
**Solution:** Ensure you're using `t()` function from `useI18n()` hook, not hardcoded strings.

### Currency Not Switching
**Solution:** Make sure you're passing `locale` and `symbol` options to `formatCurrency()`.

### RTL Layout Issues
**Solution:** Use Tailwind's `rtl:` variant or logical properties (inline-start/end).

## Future Enhancements

1. **More Languages**: Spanish, French, Arabic, etc.
2. **Regional Formats**: Different date/time formats per country
3. **Pluralization**: Handle singular/plural forms correctly
4. **Number Formats**: Support for different decimal separators
5. **Translation Management**: Use a translation management service
6. **User-Generated Content**: Handle mixed-direction text
7. **Keyboard Shortcuts**: Adapt to RTL keyboards

## Performance

- Translations are bundled (no HTTP requests)
- Locale preference cached in localStorage
- No hydration mismatches
- Minimal bundle size increase (~10KB)

## Accessibility

- Proper `lang` attribute on `<html>`
- Proper `dir` attribute for RTL
- Screen readers supported
- Keyboard navigation tested in both directions

