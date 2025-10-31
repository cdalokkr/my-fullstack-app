"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home } from "lucide-react"

import { cn } from "@/lib/utils"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserProfilePopover } from "./user-profile-popover"
import { Profile } from "@/types"

interface TopBarProps {
  className?: string
  user?: Profile | null
}

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  isLast?: boolean
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/', icon: Home }]

  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    const isLast = index === segments.length - 1

    breadcrumbs.push({
      label,
      href: currentPath,
      isLast,
    })
  })

  return breadcrumbs
}

export function TopBar({ className, user }: TopBarProps) {
  const pathname = usePathname()
  const { isMobile, state } = useSidebar()
  const breadcrumbs = generateBreadcrumbs(pathname)
  const currentPage = breadcrumbs[breadcrumbs.length - 1]
  const IconComponent = currentPage?.icon

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/80",
        // Minimal left padding for close positioning to sidebar border
        "pl-2 md:pl-4 lg:pl-4 peer-data-[state=collapsed]:md:pl-2 peer-data-[state=collapsed]:lg:pl-2",
        className
      )}
    >
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1 flex items-center gap-3">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage className="flex items-center gap-2 text-sidebar-foreground">
                      {crumb.icon && <crumb.icon className="h-4 w-4 text-sidebar-foreground" />}
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} className="flex items-center gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent">
                        {crumb.icon && <crumb.icon className="h-4 w-4 text-sidebar-foreground" />}
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="text-sidebar-foreground/60" />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        {/* Mobile breadcrumb - show only current page */}
        <div className="md:hidden flex items-center gap-2">
          {IconComponent && <IconComponent className="h-4 w-4 text-sidebar-foreground" />}
          <span className="text-sm font-medium text-sidebar-foreground">
            {currentPage?.label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserProfilePopover user={user || null} />
      </div>
    </header>
  )
}