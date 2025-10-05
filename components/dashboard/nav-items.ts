export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  children?: NavItem[];
}

export const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: "Home",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: "Users",
    children: [
      {
        title: "All Users",
        href: "/admin/users/all",
        icon: "Users",
      },
      {
        title: "Roles",
        href: "/admin/users/roles",
        icon: "User",
      },
    ],
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: "BarChart2",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: "User",
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