export type NavigationItem = {
  label: string;
  href: string;

  /**
   * Shown in the main sidebar.
   *
   * Not everything belongs there. Payroll, Employee Setup, Scheduling and
   * the rest are real destinations reached from their dashboard tiles —
   * listing every page in the sidebar makes the ones people use daily
   * harder to find, not easier.
   */
  inSidebar?: boolean;

  children?: NavigationItem[];
};

/**
 * The one navigation list.
 *
 * There used to be two — this file and a hardcoded array inside SidebarNav
 * — and they had drifted apart: the sidebar carried a Reports link to a
 * page that does not exist, while this list carried four destinations the
 * sidebar never showed. Whichever one you edited, the other stayed wrong.
 *
 * Customers and Equipment are deliberately in neither role. Neither is
 * somewhere anyone navigates TO: a customer and their equipment are
 * created while booking an appointment or opening a repair order, which is
 * when you actually know what they are. Both pages are still reachable
 * from their dashboard tiles and by URL.
 *
 * The order here is the order the sidebar renders.
 */
export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    inSidebar: true,
  },
  {
    label: "Repair Orders",
    href: "/repair-orders",
    inSidebar: true,
  },
  {
    label: "Dispatch",
    href: "/dispatch",
    inSidebar: true,
  },
  {
    label: "Inventory",
    href: "/inventory",
    inSidebar: true,
    children: [
      {
        label: "Inventory Items",
        href: "/inventory/items",
      },
      {
        label: "Inventory Receiving",
        href: "/inventory/receiving",
      },
      {
        label: "Company Tools",
        href: "/inventory/company-tools",
      },
      {
        label: "Inventory Transactions",
        href: "/inventory/transactions",
      },
      {
        label: "Truck Stock",
        href: "/truck-stock",
      },
      {
        label: "Truck Stock Transactions",
        href: "/truck-stock/transactions",
      },
    ],
  },
  {
    label: "Purchase Orders",
    href: "/purchase-orders",
    inSidebar: true,
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    inSidebar: true,
  },
  {
    label: "Invoices",
    href: "/invoices",
    inSidebar: true,
  },
  {
    label: "Settings",
    href: "/settings",
    inSidebar: true,
    children: [
      {
        label: "Appearance",
        href: "/settings/appearance",
      },
      {
        label: "Roles & Permissions",
        href: "/settings/roles-permissions",
      },
    ],
  },

  /* Reached from their dashboard tiles rather than the sidebar. */
  {
    label: "Employee Setup",
    href: "/employees",
  },
  {
    label: "Employee Schedule",
    href: "/employee-schedule",
  },
  {
    label: "Payroll",
    href: "/payroll",
  },
  {
    label: "Appointments/Scheduling",
    href: "/scheduling",
  },
];

export const sidebarNavigationItems = navigationItems.filter(
  (item) => item.inSidebar
);

export const NAVIGATION_ITEMS = navigationItems;
