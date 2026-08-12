"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/constants/navigation";

const navClass = "space-y-2";

const linkClass =
  "block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white";

const activeLinkClass =
  "block rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white";

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className={navClass}>
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ||
          item.children?.some(
            (child) =>
              pathname === child.href || pathname.startsWith(`${child.href}/`)
          );

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? activeLinkClass : linkClass}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}