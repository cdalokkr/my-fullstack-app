// ============================================
// app/layout.tsx
// ============================================
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/lib/trpc/provider'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Full-Stack App - Next.js 15',
  description: 'Complete authentication system',
  keywords: ['Next.js', 'Supabase', 'tRPC'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCProvider>
            {children}
            <SonnerToaster richColors position="top-center" />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}