// ============================================
// components/dashboard/dashboard-shell.tsx
// ============================================
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  FiHome, FiUsers, FiBarChart2, FiSettings, 
  FiUser, FiBell, FiLogOut, FiMenu, FiX 
} from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'
import toast from 'react-hot-toast'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import type { Profile } from '@/types'

const adminNavItems = [
  { icon: FiHome, label: 'Overview', href: '/admin' },
  { icon: FiUsers, label: 'Users', href: '/admin/users' },
  { icon: FiBarChart2, label: 'Analytics', href: '/admin/analytics' },
]

const userNavItems = [
  { icon: FiHome, label: 'Dashboard', href: '/user' },
  { icon: FiUser, label: 'Profile', href: '/user/profile' },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  const supabase = createClient()

  // Get profile
  const { data: profileData } = trpc.profile.get.useQuery(undefined, {
    refetchOnMount: false,
  })

  useEffect(() => {
    if (profileData) {
      setProfile(profileData)
    }
  }, [profileData])

  // Get unread notifications count
  const { data: unreadCount = 0, refetch: refetchNotifications } = 
    trpc.notification.getUnreadCount.useQuery(undefined, {
      refetchInterval: 30000, // Refetch every 30 seconds
    })

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!profile) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          refetchNotifications()
          toast.success(payload.new.title)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile, supabase, refetchNotifications])

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success('Logged out successfully')
      router.push('/login')
      router.refresh()
    },
  })

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  const navItems = profile?.role === 'admin' ? adminNavItems : userNavItems

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <FiX /> : <FiMenu />}
            </Button>
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">FS</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                FullStack App
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <FiBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {unreadCount === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No new notifications
                  </div>
                ) : (
                  <div className="p-2 text-sm text-gray-600">
                    You have {unreadCount} unread notification{unreadCount !== 1 && 's'}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {profile.full_name?.[0] || profile.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block">
                    {profile.full_name || profile.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{profile.full_name || 'User'}</span>
                    <span className="text-xs font-normal text-gray-500">
                      {profile.email}
                    </span>
                    <Badge variant="outline" className="mt-1 w-fit text-xs">
                      {profile.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <FiLogOut className="mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 
            border-r border-gray-200 dark:border-gray-700 transform transition-transform 
            duration-300 ease-in-out lg:translate-x-0 top-[57px] lg:top-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <nav className="p-4 space-y-2 h-full flex flex-col">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-[calc(100vh-57px)]">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden top-[57px]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}