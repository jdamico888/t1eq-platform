export type NavigationItem = {
  label: string;
  href: string;
  children?: NavigationItem[];
};

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Customers",
    href: "/customers",
  },
  {
    label: "Equipment",
    href: "/equipment",
  },
  {
    label: "Repair Orders",
    href: "/repair-orders",
  },
  {
    label: "Dispatch",
    href: "/dispatch",
  },
  {
    label: "Employee Setup",
    href: "/employees",
  },
  {
    label: "Employee Schedule",
    href: "/employee-schedule",
  },
  {
    label: "Purchase Orders",
    href: "/purchase-orders",
  },
  {
    label: "Inventory",
    href: "/inventory",
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
    label: "Invoices",
    href: "/invoices",
  },
  {
    label: "Payroll",
    href: "/payroll",
  },
  {
    label: "Scheduling",
    href: "/scheduling",
  },
  {
    label: "Suppliers",
    href: "/suppliers",
  },
  {
    label: "Users",
    href: "/users",
  },
  {
    label: "Settings",
    href: "/settings",
    children: [
      {
        label: "Appearance",
        href: "/settings/appearance",
      },
    ],
  },
];

export const NAVIGATION_ITEMS = navigationItems;