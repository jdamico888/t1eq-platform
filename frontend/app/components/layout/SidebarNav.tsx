"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarItem = {
  id: string;
  label: string;
  href: string;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    id: "customers",
    label: "Customers",
    href: "/customers",
  },
  {
    id: "equipment",
    label: "Equipment",
    href: "/equipment",
  },
  {
    id: "repair-orders",
    label: "Repair Orders",
    href: "/repair-orders",
  },
  {
    id: "dispatch",
    label: "Dispatch",
    href: "/dispatch",
  },
  {
    id: "inventory",
    label: "Inventory",
    href: "/inventory",
  },
  {
    id: "purchase-orders",
    label: "Purchase Orders",
    href: "/purchase-orders",
  },
  {
    id: "suppliers",
    label: "Suppliers",
    href: "/suppliers",
  },
  {
    id: "invoices",
    label: "Invoices",
    href: "/invoices",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav
      data-t1eq-qbit-type="section"
      data-t1eq-qbit-id="sidebar-nav-list"
      data-t1eq-qbit-scope="global"
      className="space-y-2"
    >
      {SIDEBAR_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            pathname.startsWith(item.href));

        return (
          <Link
            key={item.id}
            href={item.href}
            data-t1eq-sidebar-button="true"
            data-t1eq-sidebar-button-active={isActive ? "true" : undefined}
            data-t1eq-qbit-type="sidebar-button"
            data-t1eq-qbit-id={`sidebar-${item.id}`}
            data-t1eq-qbit-scope="global"
            className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? "bg-zinc-800 text-white"
                : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}