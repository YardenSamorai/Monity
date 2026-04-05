'use client'

import { useAuth, SignIn } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function MobileAuth() {
  const { isSignedIn, isLoaded } = useAuth()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || status !== 'idle') return

    setStatus('creating')

    fetch('/api/api-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'MonityIOS' }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to create token')
        return r.json()
      })
      .then((data) => {
        setStatus('redirecting')
        window.location.href = `monity://callback?token=${encodeURIComponent(data.token.token)}`
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }, [isSignedIn, isLoaded, status])

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <SignIn forceRedirectUrl="/mobile-auth" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={() => { setError(null); setStatus('idle') }}>Try Again</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <p>Redirecting to Monity app...</p>
    </div>
  )
}
