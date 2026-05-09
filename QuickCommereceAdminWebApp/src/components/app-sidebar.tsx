import * as React from "react";
import {
  GalleryVerticalEnd,
  PieChart,
  SquareTerminal,
  Building2,
  Users,
  Truck,
  Package,
  ShoppingCart,
  FolderTree,
  TrendingUp,
  Ticket,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import { NavMain } from "@/components/nav-main";
// import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Role-based menu permissions
const ROLE_PERMISSIONS = {
  superadmin: [
    "dashboard",
    "admins",
    "warehouses",
    "vendors",
    "drivers",
    "categories",
    "products",
    "vendor-orders",
    "users",
    "user-orders",
    "user-growth",
    // "user-analytics",
    "tickets",
  ],
  admin: [
    "dashboard",
    "vendors",
    "drivers",
    "vendor-orders",
    "users",
    "user-orders",
    "user-growth",
  ],
} as const;

type RoleKey = keyof typeof ROLE_PERMISSIONS;
type Permission = (typeof ROLE_PERMISSIONS)[RoleKey][number];

// Function to filter menu items based on user role
const getFilteredNavigation = (userRole: string) => {
  const normalizedRole = userRole.toLowerCase() as RoleKey;
  const allowedItems = (ROLE_PERMISSIONS[normalizedRole] || []) as readonly Permission[];

  const navigation = {
    analytics: {
      title: "Analytics",
      icon: PieChart,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: PieChart,
          requiredPermission: "dashboard"
        },
        {
          title: "User Growth",
          url: "/usergrowth",
          icon: TrendingUp,
          requiredPermission: "user-growth"
        },
        {
          title: "User Analytics",
          url: "/users/analytics",
          icon: TrendingUp,
          requiredPermission: "user-analytics"
        },
        {
          title: "Tickets",
          url: "/tickets",
          icon: Ticket,
          requiredPermission: "tickets"
        },
      ]
    },
    management: {
      title: "Management",
      icon: SquareTerminal,
      items: [
        {
          title: "Admins",
          url: "/admin",
          icon: Users,
          requiredPermission: "admins"
        },
        {
          title: "Warehouses",
          url: "/warehouses",
          icon: Building2,
          requiredPermission: "warehouses"
        },
        {
          title: "Vendors",
          url: "/vendors",
          icon: ShoppingCart,
          requiredPermission: "vendors"
        },
        {
          title: "Drivers",
          url: "/drivers",
          icon: Truck,
          requiredPermission: "drivers"
        },
        
      ]
    },
    catalog: {
      title: "Catalog",
      icon: Package,
      items: [
        {
          title: "Product Categories",
          url: "/categories",
          icon: FolderTree,
          requiredPermission: "categories"
        },
        {
          title: "Products",
          url: "/products",
          icon: Package,
          requiredPermission: "products"
        },
      ]
    },
    orders: {
      title: "Orders",
      icon: ShoppingCart,
      items: [
        {
          title: "Vendor Orders",
          url: "/vendor-orders",
          icon: ShoppingCart,
          requiredPermission: "vendor-orders"
        },
        {
          title: "User Orders",
          url: "/users/orders",
          icon: ShoppingCart,
          requiredPermission: "user-orders"
        },
      ]
    },
    users: {
      title: "Users",
      icon: Users,
      items: [
        {
          title: "Users",
          url: "/users",
          icon: Users,
          requiredPermission: "users"
        },
      ]
    }
  };

  // Filter each section based on permissions
  const filteredNavigation = Object.entries(navigation)
    .map(([, section]) => ({
      title: section.title,
      url: "#",
      icon: section.icon,
      isActive: true,
      items: section.items
        .filter((item) => allowedItems.includes(item.requiredPermission as Permission))
        .map(({ requiredPermission, icon, ...item }) => item),
    }))
    .filter((section) => section.items.length > 0); // Only include sections with items

  return filteredNavigation;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  // Get filtered navigation based on user role
  const navMain = user?.role ? getFilteredNavigation(user.role) : [];

  // Build team data from user context
  const teams = [
    {
      name: "Quick Commerce",
      logo: GalleryVerticalEnd,
      plan: user?.role === "superadmin" ? "Enterprise" : "Professional",
    },
  ];

  // Build user data from auth context
  const userData = user ? {
    name: user.name || "User",
    email: user.email || "",
    avatar: "",
  } : null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        {userData && <NavUser user={userData} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}