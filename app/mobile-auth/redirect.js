'use client'

import { useEffect } from 'react'

export default function MobileAuthRedirect({ token }) {
  useEffect(() => {
    window.location.href = `monity://callback?token=${encodeURIComponent(token)}`
  }, [token])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      color: '#666',
    }}>
      <p>Redirecting to Monity app...</p>
    </div>
  )
}
