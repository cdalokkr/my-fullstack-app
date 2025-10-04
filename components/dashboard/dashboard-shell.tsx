// ============================================
// components/dashboard/dashboard-shell.tsx
// ============================================
'use client'

import React from 'react'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  FiHome, FiUsers, FiBarChart2,
  FiUser, FiBell, FiLogOut, FiMenu, FiX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const DropdownMenu = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenu), { ssr: false })
const DropdownMenuContent = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenuContent), { ssr: false })
const DropdownMenuItem = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenuItem), { ssr: false })
const DropdownMenuLabel = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenuLabel), { ssr: false })
const DropdownMenuSeparator = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenuSeparator), { ssr: false })
const DropdownMenuTrigger = dynamic(() => import('@/components/ui/dropdown-menu').then(mod => mod.DropdownMenuTrigger), { ssr: false })
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { trpc } from '@/lib/trpc/client'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoutModal } from '@/components/ui/logout-modal'
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [modalIsOpen, setModalIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
    if (!profile?.id) return

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
        () => {
          refetchNotifications()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [profile, supabase, refetchNotifications])

  const logActivityMutation = trpc.auth.logActivity.useMutation()

  const handleLogout = async () => {
    setModalIsOpen(true)
    setIsLoading(true)
    setCurrentStep('Signing out...')

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    await supabase.auth.signOut()

    setCurrentStep('Logging activity...')

    await logActivityMutation.mutateAsync({ type: 'logout' })

    setIsLoading(false)
    setIsSuccess(true)

    await delay(2500)

    setModalIsOpen(false)
    router.push('/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Searching for:', searchQuery)
    // TODO: implement search logic, e.g., router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  const generateBreadcrumbs = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean)
    const items = [{ label: 'Home', href: '/' }]
    let currentPath = ''
    segments.forEach((segment) => {
      currentPath += '/' + segment
      const label = segment.charAt(0).toUpperCase() + segment.slice(1)
      items.push({ label, href: currentPath })
    })
    return items
  }

  const navItems = profile?.role === 'admin' ? adminNavItems : userNavItems

  return (
    <div className="theme-scaled min-h-screen bg-background">
      {/* Top Bar */}
      <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 space-y-2 md:space-y-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden w-11 h-11"
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
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex w-11 h-11"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </Button>
          </div>

          <div className="flex-1 max-w-md mx-4 hidden md:flex">
            <form onSubmit={handleSearch} className="flex gap-2 w-full">
              <Input
                type="text"
                placeholder="Search users and activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative w-11 h-11">
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
                      {profile?.full_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block">
                    {profile?.full_name || profile?.email || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{profile?.full_name || 'User'}</span>
                    <span className="text-xs font-normal text-gray-500">
                      {profile?.email || 'user@example.com'}
                    </span>
                    <Badge variant="outline" className="mt-1 w-fit text-xs">
                      {profile?.role || 'user'}
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
        <motion.aside
          initial={{ width: 256 }}
          animate={{ width: isCollapsed ? 64 : 256 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`
            fixed lg:static inset-y-0 left-0 z-30 bg-sidebar
            border-r border-sidebar-border transform transition-transform
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
                    flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors min-h-[44px]
                    ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )
            })}
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-[calc(100vh-57px)]">
          <div className="px-4 py-2 border-b border-border">
            <Breadcrumb>
              <BreadcrumbList>
                {generateBreadcrumbs(pathname).map((item, index, arr) => (
                  <React.Fragment key={item.href}>
                    <BreadcrumbItem>
                      {index === arr.length - 1 ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < arr.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden top-[57px]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <LogoutModal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        isLoading={isLoading}
        isSuccess={isSuccess}
        currentStep={currentStep}
      />
    </div>
  )
}