"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import dynamic from 'next/dynamic'
import { ChevronRight } from "lucide-react"
import { UserRole, Profile } from "@/types"
import { Icons } from "@/components/icons"
import { OrgSwitcher } from "@/components/org-switcher"
const UserProfilePopover = dynamic(() => import("./user-profile-popover").then(mod => ({ default: mod.UserProfilePopover })), {
  ssr: false,
  loading: () => <div className="flex items-center gap-2 rounded-md text-left w-full p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div></div>
});
import { adminNavItems, userNavItems, type NavItem } from "./nav-items"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface Tenant {
  id: string
  name: string
}

interface AppSidebarProps {
  role: UserRole
  tenants: Tenant[]
  defaultTenant: Tenant
  onTenantSwitch: (tenantId: string) => void
  user: Profile | null
}

const NavItemComponent = React.memo(({ item, pathname }: { item: NavItem; pathname: string }) => {
  const Icon = Icons[item.icon]
  const isActive = pathname === item.href
  const hasChildren = item.children && item.children.length > 0
  const [open, setOpen] = React.useState(isActive)

  React.useEffect(() => {
    console.log(`NavItem ${item.title} mounted`)
  }, [item.title])

  console.log(`NavItem ${item.title}: initial open=${open}, isActive=${isActive}, pathname=${pathname}`)

  React.useEffect(() => {
    console.log(`NavItem ${item.title}: pathname changed to ${pathname}, current open=${open}`)
  }, [pathname, item.title, open])

  const handleOpenChange = (newOpen: boolean) => {
    console.log(`NavItem ${item.title}: open changing from ${open} to ${newOpen}`)
    setOpen(newOpen)
  }

  if (hasChildren) {
    return (
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={isActive}>
              {Icon && <Icon />}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children!.map((child) => {
                const ChildIcon = Icons[child.icon]
                const childIsActive = pathname === child.href
                return (
                  <SidebarMenuSubItem key={child.href}>
                    <SidebarMenuSubButton asChild isActive={childIsActive}>
                      <Link href={child.href}>
                        {ChildIcon && <ChildIcon />}
                        <span>{child.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
        <Link href={item.href}>
          {Icon && <Icon />}
          <span>{item.title}</span>
          {item.badge && (
            <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {item.badge}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
})

NavItemComponent.displayName = 'NavItemComponent'

export const AppSidebar = React.memo(({ role, tenants, defaultTenant, onTenantSwitch, user }: AppSidebarProps) => {
  const pathname = usePathname()
  const navItems = role === "admin" ? adminNavItems : userNavItems

  console.log('AppSidebar rendering', { pathname, role, tenantsLength: tenants.length, userId: user?.id })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b">
        <OrgSwitcher
          tenants={tenants}
          defaultTenant={defaultTenant}
          onTenantSwitch={onTenantSwitch}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavItemComponent key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserProfilePopover user={user} />
      </SidebarFooter>
    </Sidebar>
  )
})

AppSidebar.displayName = 'AppSidebar'