# PWA Icons for Monity

This directory should contain the following icon files for the PWA to work correctly:

## Required Icons

### Standard PWA Icons
- `icon-32.png` - 32x32 (favicon)
- `icon-96.png` - 96x96 (shortcuts)
- `icon-192.png` - 192x192 (Android)
- `icon-512.png` - 512x512 (Android, splash)
- `icon-maskable-192.png` - 192x192 with padding for maskable
- `icon-maskable-512.png` - 512x512 with padding for maskable

### Apple-specific Icons
- `apple-touch-icon.png` - 180x180 (iPhone)
- `apple-touch-icon-152.png` - 152x152 (iPad)
- `apple-touch-icon-167.png` - 167x167 (iPad Pro)

### Apple Splash Screens (Optional but recommended)
- `apple-splash-1170-2532.png` - iPhone 12/13/14 (390x844 @ 3x)
- `apple-splash-1284-2778.png` - iPhone 12/13/14 Pro Max (428x926 @ 3x)
- `apple-splash-2048-2732.png` - iPad Pro 12.9" (1024x1366 @ 2x)

## Icon Guidelines

1. **Main Icon**: Use the Monity logo (blue square, no text)
2. **Maskable Icons**: Include 20% safe zone padding for Android adaptive icons
3. **Format**: PNG with transparency for regular icons, solid background for Apple touch icons
4. **Colors**: 
   - Background: #2563EB (blue)
   - Icon: White

## Quick Generation

You can use tools like:
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [Real Favicon Generator](https://realfavicongenerator.net/)
- [Maskable.app](https://maskable.app/) for testing maskable icons

## Current Fallback

Until these icons are added, the app uses `/MonityLogo.svg` as a fallback.
