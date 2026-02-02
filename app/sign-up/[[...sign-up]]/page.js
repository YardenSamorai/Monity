import { SignUp } from '@clerk/nextjs'
import Image from 'next/image'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-primary))] p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/MonityLogo.svg" 
              alt="Monity" 
              width={64} 
              height={64}
              className="w-16 h-16"
            />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            Monity
          </h1>
        </div>

        {/* Clerk Component */}
        <SignUp 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[rgb(var(--bg-secondary))] shadow-sm border border-[rgb(var(--border-primary))] rounded-2xl",
              formButtonPrimary: "bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/90",
              footerActionLink: "text-[rgb(var(--accent))]",
            },
          }}
        />
      </div>
    </div>
  )
}
