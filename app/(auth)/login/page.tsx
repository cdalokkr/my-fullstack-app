// ============================================
// app/(auth)/login/page.tsx
// ============================================
import { LoginForm } from '@/components/auth/login-form'
import { ThemeToggle } from '@/components/theme-toggle'
import { Shield, ShieldUser  } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Login - Full-Stack App',
  description: 'Sign in to your account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Top Bar */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">FS</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              FullStack App
            </h1>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-3 mb-2">
                <ShieldUser className="h-10 w-10 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 rounded-full p-1" aria-hidden="true" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome Back
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Sign in to your account to continue
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}