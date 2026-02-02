'use client'

/**
 * PWA Utilities for Monity
 * Provides utilities for detecting PWA installation status and iOS-specific features
 */

/**
 * Check if the app is running in standalone PWA mode
 * Works on both iOS (navigator.standalone) and other platforms (display-mode)
 */
export function isStandalonePWA() {
  if (typeof window === 'undefined') return false
  
  // iOS Safari standalone mode
  if ('standalone' in window.navigator) {
    return window.navigator.standalone === true
  }
  
  // Other browsers via display-mode media query
  return window.matchMedia('(display-mode: standalone)').matches
}

/**
 * Check if the device is running iOS
 */
export function isIOS() {
  if (typeof window === 'undefined') return false
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

/**
 * Check if running in iOS Safari (not in-app browser)
 */
export function isIOSSafari() {
  if (typeof window === 'undefined') return false
  
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const webkit = /WebKit/.test(ua)
  const notChrome = !/CriOS/.test(ua)
  const notFirefox = !/FxiOS/.test(ua)
  
  return iOS && webkit && notChrome && notFirefox
}

/**
 * Check if the PWA can be installed (not already installed and on supported platform)
 */
export function canInstallPWA() {
  if (typeof window === 'undefined') return false
  
  // Already in standalone mode
  if (isStandalonePWA()) return false
  
  // On iOS Safari, can always "install" via Add to Home Screen
  if (isIOSSafari()) return true
  
  // On other platforms, check for beforeinstallprompt support
  // (This would be set by the install banner logic)
  return 'BeforeInstallPromptEvent' in window
}

/**
 * Get safe area insets for iOS devices with notch
 * Returns CSS values that can be used for padding
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return {
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    }
  }
  
  const computedStyle = getComputedStyle(document.documentElement)
  
  return {
    top: computedStyle.getPropertyValue('--sat') || 'env(safe-area-inset-top, 0px)',
    right: computedStyle.getPropertyValue('--sar') || 'env(safe-area-inset-right, 0px)',
    bottom: computedStyle.getPropertyValue('--sab') || 'env(safe-area-inset-bottom, 0px)',
    left: computedStyle.getPropertyValue('--sal') || 'env(safe-area-inset-left, 0px)',
  }
}

/**
 * Register service worker
 */
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
    
    console.log('Service Worker registered:', registration.scope)
    
    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show update notification if needed
            console.log('New content available, refresh to update')
          }
        })
      }
    })
    
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}
