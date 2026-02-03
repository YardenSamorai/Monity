import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6">
      {/* Logo & Branding */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
            <Image 
              src="/MonityLogo.svg" 
              alt="Monity" 
              width={100} 
              height={100}
              className="w-24 h-24 sm:w-28 sm:h-28 relative z-10 drop-shadow-lg"
              priority
            />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
          Monity
        </h1>
        <p className="text-slate-400 mt-2 text-sm sm:text-base">
          ניהול הכספים שלך, בקלות
        </p>
      </div>

      {/* Clerk Component with Full Dark Theme */}
      <div className="w-full max-w-sm">
        <SignIn 
          appearance={{
            variables: {
              colorPrimary: '#3b82f6',
              colorBackground: '#1e293b',
              colorText: '#f1f5f9',
              colorTextSecondary: '#94a3b8',
              colorInputBackground: '#0f172a',
              colorInputText: '#f1f5f9',
              colorDanger: '#ef4444',
              borderRadius: '0.75rem',
              fontFamily: 'inherit',
            },
            elements: {
              rootBox: "w-full",
              card: "bg-slate-800/80 backdrop-blur-sm shadow-2xl border border-slate-700/50 rounded-2xl p-6",
              headerTitle: "text-white text-xl font-semibold",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "bg-slate-700/50 border-slate-600 hover:bg-slate-700 text-white transition-all duration-200",
              socialButtonsBlockButtonText: "text-slate-200 font-medium",
              dividerLine: "bg-slate-700",
              dividerText: "text-slate-500",
              formFieldLabel: "text-slate-300 font-medium",
              formFieldInput: "bg-slate-900/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-12",
              formButtonPrimary: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold h-12 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200",
              footerActionLink: "text-blue-400 hover:text-blue-300 font-medium",
              footerActionText: "text-slate-400",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-blue-400",
              formFieldInputShowPasswordButton: "text-slate-400 hover:text-white",
              otpCodeFieldInput: "bg-slate-900 border-slate-600 text-white",
              formResendCodeLink: "text-blue-400",
              alert: "bg-slate-700/50 border-slate-600",
              alertText: "text-slate-300",
              logoBox: "hidden",
              footer: "hidden",
            },
          }}
        />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-xs">
          מאובטח על ידי Clerk
        </p>
      </div>
    </div>
  )
}
