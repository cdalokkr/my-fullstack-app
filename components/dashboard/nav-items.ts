import { Profile, UserRole } from '@/types'

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  children?: NavItem[];
  requiredRole?: string
  description?: string;
}

export const adminNavItems: NavItem[] = [
{
  title: "Dashboard",
  href: "/admin",
  icon: "Home",
  description: "Overview of system metrics and activities"
},
{
  title: "Manage Users",
  href: "/admin/users/all",
  icon: "Users",
  requiredRole: "admin",
  description: "User management with dual-layer loading mechanism"
},
{
  title: "Users",
  href: "/admin/users",
  icon: "Users",
  requiredRole: "admin",
  children: [
    {
      title: "All Users",
      href: "/admin/users/all",
      icon: "Users",
      requiredRole: "admin",
      description: "Complete user list with advanced filtering and operations"
    },
    {
      title: "Roles",
      href: "/admin/users/roles",
      icon: "User",
      requiredRole: "admin",
      description: "Manage user roles and permissions"
    },
  ],
  description: "User administration and management tools"
},
{
  title: "Settings",
  href: "/admin/settings",
  icon: "Settings",
  requiredRole: "admin",
  description: "System configuration and preferences"
},
];

export const userNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/user/dashboard",
    icon: "Home",
  },
  {
    title: "Profile",
    href: "/user/profile",
    icon: "User",
  },
  {
    title: "Notifications",
    href: "/user/notifications",
    icon: "Bell",
    badge: "3",
  },
  {
    title: "Billing",
    href: "/user/billing",
    icon: "CreditCard",
  },
];