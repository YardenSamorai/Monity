import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-light-bg dark:bg-dark-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-light-accent to-blue-600 dark:from-dark-accent dark:to-blue-500 items-center justify-center shadow-soft mb-4">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Create your account
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Start managing your finances with Monity
          </p>
        </div>
        
        <SignUp />
      </div>
    </div>
  )
}
