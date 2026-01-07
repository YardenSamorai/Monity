# RTL (Right-to-Left) Fixes

## Issue
When switching to Hebrew language, the sidebar was covering the content instead of properly pushing it aside.

## Root Cause
The sidebar was always positioned on the left side with `lg:inset-y-0` without direction specification, and the main content always had `lg:pl-72` (padding-left). This didn't adapt to RTL mode.

## Solution

### 1. AppShell Component (`components/AppShell.jsx`)

#### Desktop Sidebar Position
- **LTR**: Sidebar on left (`lg:left-0`), content has `lg:pl-72`
- **RTL**: Sidebar on right (`lg:right-0`), content has `lg:pr-72`

```jsx
// Sidebar positioning
<aside className={cn(
  "hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col",
  isRTL ? "lg:right-0" : "lg:left-0"
)}>
```

#### Border Direction
- **LTR**: Right border (`border-r`)
- **RTL**: Left border (`border-l`)

```jsx
<div className={cn(
  "flex flex-col flex-1 bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-xl",
  isRTL ? "border-l border-light-border dark:border-dark-border" : "border-r border-light-border dark:border-dark-border"
)}>
```

#### Main Content Padding
```jsx
<main className={cn(
  "min-h-screen pb-20 lg:pb-0",
  isRTL ? "lg:pr-72" : "lg:pl-72"
)}>
```

#### Logo Spacing
```jsx
<Link href="/dashboard" className={cn(
  "flex items-center group",
  isRTL ? "space-x-reverse space-x-3" : "space-x-3"
)}>
```

#### Floating Action Button
- **LTR**: Right side (`right-4`)
- **RTL**: Left side (`left-4`)

```jsx
<button className={cn(
  "lg:hidden fixed bottom-24 z-50 w-14 h-14 rounded-full bg-light-accent dark:bg-dark-accent text-white shadow-glass flex items-center justify-center active:scale-95 transition-transform",
  isRTL ? "left-4" : "right-4"
)}
```

### 2. Settings Page Structure
Removed duplicate header since it's now in `SettingsClient.jsx` for better translation support.

## Testing Checklist

- [x] LTR mode (English): Sidebar on left, content properly padded
- [x] RTL mode (Hebrew): Sidebar on right, content properly padded
- [x] Mobile view: Header and bottom nav work in both directions
- [x] FAB button: Positioned correctly in both directions
- [x] Logo and icons: Properly spaced in both directions
- [x] Content: Not covered by sidebar in either direction

## Additional RTL Considerations

### CSS Utilities
Use Tailwind's RTL-aware utilities when possible:
- Instead of `ml-4`, use `ms-4` (margin-inline-start)
- Instead of `mr-4`, use `me-4` (margin-inline-end)
- Use `space-x-reverse` for flex items in RTL

### Icons
Some icons may need to be flipped in RTL:
- Chevrons (left/right)
- Arrows
- Forward/back buttons

### Text Alignment
Text alignment should be automatic with `dir="rtl"` on the HTML element, but verify:
- Headings
- Paragraphs
- Form labels
- Table headers

## Performance
No performance impact - the RTL detection happens once on mount and uses React context for efficient re-rendering.

