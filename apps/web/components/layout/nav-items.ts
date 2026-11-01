import {
  CalendarClock,
  Clock,
  Bike,
  Truck,
  Users,
  Landmark,
  BarChart3,
  Megaphone,
  Wrench,
  ChefHat,
  LayoutDashboard,
  ClipboardList,
  LayoutGrid,
  Package,
  Settings,
  ShoppingCart,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type NavSection = "SERVICE" | "OPERATIONS" | "ADMINISTRATION";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  section: NavSection;
}

export const NAV_ITEMS: NavItem[] = [
  // Service & Floor
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.sales.view", section: "SERVICE" },
  { labelKey: "nav.pos", href: "/pos", icon: ShoppingCart, permission: "orders.create", section: "SERVICE" },
  { labelKey: "nav.orders", href: "/orders", icon: ClipboardList, permission: "orders.create", section: "SERVICE" },
  { labelKey: "nav.tables", href: "/tables", icon: LayoutGrid, permission: "tables.view", section: "SERVICE" },
  { labelKey: "nav.reservations", href: "/reservations", icon: CalendarClock, permission: "reservations.manage", section: "SERVICE" },
  { labelKey: "nav.kds", href: "/kds", icon: ChefHat, permission: "kds.manage", section: "SERVICE" },

  // Catalog & Inventory
  { labelKey: "nav.menu", href: "/menu", icon: UtensilsCrossed, permission: "menu.view", section: "OPERATIONS" },
  { labelKey: "nav.inventory", href: "/inventory", icon: Package, permission: "inventory.manage", section: "OPERATIONS" },
  { labelKey: "nav.customers", href: "/customers", icon: UsersRound, permission: "customers.manage", section: "OPERATIONS" },
  { labelKey: "nav.delivery", href: "/delivery", icon: Truck, permission: "delivery.manage", section: "OPERATIONS" },
  { labelKey: "nav.myDeliveries", href: "/my-deliveries", icon: Bike, permission: "delivery.rider", section: "OPERATIONS" },

  // Team & Administration
  { labelKey: "nav.team", href: "/team", icon: Users, permission: "staff.manage", section: "ADMINISTRATION" },
  { labelKey: "nav.attendance", href: "/attendance", icon: Clock, section: "ADMINISTRATION" },
  { labelKey: "nav.accounting", href: "/accounting", icon: Landmark, permission: "accounting.manage", section: "ADMINISTRATION" },
  { labelKey: "nav.reports", href: "/reports", icon: BarChart3, permission: "reports.access", section: "ADMINISTRATION" },
  { labelKey: "nav.marketing", href: "/marketing", icon: Megaphone, permission: "marketing.manage", section: "ADMINISTRATION" },
  { labelKey: "nav.operations", href: "/operations", icon: Wrench, permission: "operations.manage", section: "ADMINISTRATION" },
  { labelKey: "nav.settings", href: "/settings", icon: Settings, permission: "settings.manage", section: "ADMINISTRATION" },
];
