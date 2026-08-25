"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { navigationItems } from "@/constants/navigation";

import ArrangeableTileGrid, {
  type ArrangeableMenuItem,
} from "@/components/dashboard/ArrangeableTileGrid";
import {
  DASHBOARD_LAYOUT_CHANGED_EVENT,
  arrangeDashboardTiles,
  createEmptySectionLayout,
  getDashboardSectionLayout,
  hideDashboardTile,
  resetDashboardSectionLayout,
  saveDashboardSectionOrder,
  showDashboardTile,
  type DashboardSectionLayout,
} from "@/services/dashboard-layout";

const SECTION_KEY = "categorySubnavigation" as const;
const QBIT_SCOPE = "category-subnavigation";

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

  /*
   * Empty until the effect below reads it, so the first client render
   * matches what the server rendered and hydration stays quiet.
   */
  const [layout, setLayout] = useState<DashboardSectionLayout>(
    createEmptySectionLayout
  );

  useEffect(() => {
    function loadLayout() {
      setLayout(getDashboardSectionLayout(SECTION_KEY));
    }

    loadLayout();

    window.addEventListener(DASHBOARD_LAYOUT_CHANGED_EVENT, loadLayout);
    window.addEventListener("storage", loadLayout);

    return () => {
      window.removeEventListener(DASHBOARD_LAYOUT_CHANGED_EVENT, loadLayout);
      window.removeEventListener("storage", loadLayout);
    };
  }, []);

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

  /*
   * Hrefs are unique across every category, so one store serves them all —
   * a layout entry for a link that is not in this category is simply
   * ignored when the arrangement is applied.
   */
  const arranged = arrangeDashboardTiles(
    currentMainCategory.children,
    (child) => child.href,
    layout
  );

  const hasLayout = layout.order.length > 0 || layout.hidden.length > 0;

  const pickerItems: ArrangeableMenuItem[] = [
    ...arranged.hidden.map((child) => ({
      label: `Add: ${child.label}`,
      description: "Put this link back on the bar.",
      onSelect: () => setLayout(showDashboardTile(SECTION_KEY, child.href)),
    })),

    ...(hasLayout
      ? [
          {
            label: "Reset Subcategory Links",
            description: "Show every link again, in its original order.",
            onSelect: () =>
              setLayout(resetDashboardSectionLayout(SECTION_KEY)),
          },
        ]
      : []),
  ];

  return (
    <div data-t1eq-page-card="true" className={wrapperClass}>
      <div className={innerClass}>
        <div>
          <div className={titleClass}>{currentMainCategory.label}</div>
          <div className="mt-1 text-sm font-semibold text-zinc-600">
            Select a subcategory.
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {/*
            Overview sits outside the arrangeable grid deliberately. It is
            the way back to the category root, so it must not be draggable
            to the trash at all — a guard inside the grid could be got
            around; not being in the grid cannot.
          */}
          <Link
            data-t1eq-tile="true"
            data-t1eq-qbit-type="tile"
            data-t1eq-qbit-id="category-subnavigation-overview"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            href={currentMainCategory.href}
            className={overviewIsActive ? activeLinkClass : linkClass}
          >
            Overview
          </Link>

          <ArrangeableTileGrid
            allowLinkDrag
            qbitId="category-subnavigation-links"
            qbitScope={QBIT_SCOPE}
            gridClassName={linkGridClass}
            tiles={arranged.visible.map((child) => ({
              id: child.href,
              content: (
                <Link
                  data-t1eq-tile="true"
                  data-t1eq-qbit-type="tile"
                  data-t1eq-qbit-id={`category-subnavigation-${child.href}`}
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  href={child.href}
                  className={
                    activeChildHref === child.href
                      ? activeLinkClass
                      : linkClass
                  }
                >
                  {child.label}
                </Link>
              ),
            }))}
            onReorder={(orderedIds) =>
              setLayout(saveDashboardSectionOrder(SECTION_KEY, orderedIds))
            }
            onRemove={(href) =>
              setLayout(hideDashboardTile(SECTION_KEY, href))
            }
            menuItems={pickerItems}
            emptyState={
              <span className="text-xs font-semibold text-zinc-400">
                All subcategory links hidden — right-click to add them back.
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
}
