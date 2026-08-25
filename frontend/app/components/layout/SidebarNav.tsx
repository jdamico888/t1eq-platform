"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { sidebarNavigationItems } from "@/constants/navigation";

/**
 * The main sidebar.
 *
 * It used to carry its own copy of the navigation list, which had drifted
 * from the shared one: this file had a Reports link to a page that was
 * never built, and the shared list had four destinations this never
 * showed. There is one list now, in constants/navigation.ts.
 */
export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav
      data-t1eq-qbit-type="section"
      data-t1eq-qbit-id="sidebar-nav-list"
      data-t1eq-qbit-scope="global"
      className="space-y-2"
    >
      {sidebarNavigationItems.map((item) => {
        /*
         * The Q-Bit id was hand-written before and matched the href in
         * every single case, so deriving it here keeps every appearance
         * override already applied to these buttons.
         */
        const qbitId = item.href.replace(/^\//, "");

        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            data-t1eq-sidebar-button="true"
            data-t1eq-sidebar-button-active={isActive ? "true" : undefined}
            data-t1eq-qbit-type="sidebar-button"
            data-t1eq-qbit-id={`sidebar-${qbitId}`}
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
