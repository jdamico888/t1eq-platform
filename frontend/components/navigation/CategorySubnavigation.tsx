"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/constants/navigation";

const wrapperClass =
  "border-b border-zinc-200 bg-white px-6 py-4 shadow-sm";

const innerClass =
  "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between";

const titleClass = "text-sm font-black uppercase tracking-wide text-zinc-500";

const linkGridClass = "flex flex-wrap gap-2";

const linkClass =
  "rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-black shadow-sm transition hover:bg-zinc-50";

const activeLinkClass =
  "rounded-xl border border-black bg-black px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-zinc-800";

function routeMatches(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (href === "/") {
    return false;
  }

  return pathname.startsWith(`${href}/`);
}

function getCurrentMainCategory(pathname: string) {
  return navigationItems.find((item) => {
    if (routeMatches(pathname, item.href)) {
      return true;
    }

    return item.children?.some((child) => routeMatches(pathname, child.href));
  });
}

function getActiveChildHref(pathname: string, childItems: { href: string }[]) {
  const matchingChildren = childItems.filter((child) =>
    routeMatches(pathname, child.href)
  );

  if (matchingChildren.length === 0) {
    return null;
  }

  return matchingChildren.sort((a, b) => b.href.length - a.href.length)[0].href;
}

export default function CategorySubnavigation() {
  const pathname = usePathname();
  const currentMainCategory = getCurrentMainCategory(pathname);

  if (
    !currentMainCategory ||
    !currentMainCategory.children ||
    currentMainCategory.children.length === 0
  ) {
    return null;
  }

  const activeChildHref = getActiveChildHref(
    pathname,
    currentMainCategory.children
  );

  const overviewIsActive =
    pathname === currentMainCategory.href && activeChildHref === null;

  return (
    <div data-t1eq-page-card="true" className={wrapperClass}>
      <div className={innerClass}>
        <div>
          <div className={titleClass}>{currentMainCategory.label}</div>
          <div className="mt-1 text-sm font-semibold text-zinc-600">
            Select a subcategory.
          </div>
        </div>

        <div data-t1eq-tile-grid="true" className={linkGridClass}>
          <Link
            data-t1eq-tile="true"
            href={currentMainCategory.href}
            className={overviewIsActive ? activeLinkClass : linkClass}
          >
            Overview
          </Link>

          {currentMainCategory.children.map((child) => (
            <Link
              key={child.href}
              data-t1eq-tile="true"
              href={child.href}
              className={
                activeChildHref === child.href ? activeLinkClass : linkClass
              }
            >
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}