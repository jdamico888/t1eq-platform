"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavigationItem } from "@/constants/navigation";
import { navigationItems } from "@/constants/navigation";

const navClass = "space-y-2";

const linkClass =
  "block rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white";

const activeLinkClass =
  "block rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm";

function routeMatches(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (href === "/") {
    return false;
  }

  return pathname.startsWith(`${href}/`);
}

function navigationItemIsActive(
  pathname: string,
  href: string,
  children?: NavigationItem[]
) {
  if (routeMatches(pathname, href)) {
    return true;
  }

  if (!children || children.length === 0) {
    return false;
  }

  return children.some((child) => routeMatches(pathname, child.href));
}

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className={navClass}>
      {navigationItems.map((item) => {
        const isActive = navigationItemIsActive(
          pathname,
          item.href,
          item.children
        );

        return (
          <Link
            key={item.href}
            href={item.href}
            data-t1eq-sidebar-item="true"
            data-t1eq-sidebar-item-active={isActive ? "true" : "false"}
            className={isActive ? activeLinkClass : linkClass}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
