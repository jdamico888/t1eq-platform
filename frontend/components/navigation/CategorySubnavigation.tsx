"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { navigationItems } from "@/constants/navigation";

import UniversalSearchBar from "@/components/navigation/UniversalSearchBar";
import { usePageHeaderContent } from "@/components/navigation/page-header-slot";

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

/*
 * The card clips.
 *
 * Its contents are laid out at a fixed width that has nothing to do with
 * the card's own (see the layout row below), so shrinking the card leaves
 * content hanging past its edge. Unclipped, that content stretches the
 * page, the document grows a sideways scrollbar, and the browser scrolls
 * to follow — which is what carried the header's text off the screen.
 *
 * Everything that is meant to escape this card already draws itself
 * against the viewport instead: the search results, the arrange picker,
 * the trash, the undo bar, and Q-Bit's own handles. Nothing is lost to
 * the clip but overspill.
 */
const wrapperClass =
  "overflow-clip border-b border-zinc-200 bg-white px-6 py-4 shadow-sm";

/*
 * The layout row is frozen at the page's natural width.
 *
 * Flexbox re-flows its contents whenever the container's width changes —
 * that is simply what it does, and no amount of bounds-checking on the
 * elements can prevent it. So while the card can be resized to any size,
 * the row inside it is held at the width the bar would have had anyway,
 * measured from the card's parent rather than from the card. Resizing the
 * card is then a change to the frame and nothing else: the title, the
 * search and every button stay exactly where they were put.
 *
 * The window is a different matter. Making the browser narrower still
 * re-flows the row, because the alternative is a bar that cannot be used
 * on a smaller screen.
 */
const innerClass =
  "flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4";

/*
 * With the row frozen, the columns can share space again the way they
 * were meant to — equal-basis outer columns keep the search centred on
 * the bar. The fixed-width title column that was here was an attempt to
 * stop the re-flow from the wrong end; freezing the row does it properly.
 */
const sideColumnClass = "flex min-w-0 lg:flex-1 lg:basis-0";

const searchColumnClass = "flex shrink-0 justify-center lg:px-4";

const actionsColumnClass =
  "flex min-w-0 flex-wrap items-stretch justify-start gap-2 lg:flex-1 lg:basis-0 lg:justify-end";

const titleClass = "text-sm font-black uppercase tracking-wide text-zinc-500";

const linkGridClass = "flex flex-wrap items-stretch gap-2";

/**
 * inline-flex, and that word is the whole point.
 *
 * These links are anchors, and a bare <a> is display: inline. CSS ignores
 * width, height and transform on a non-replaced inline element — silently,
 * with no error anywhere. Q-Bit stores a move as a transform and a resize
 * as width/height, so on these buttons alone every move and resize was
 * being written to storage correctly, read back correctly, applied to the
 * element correctly, and then dropped on the floor by the layout engine.
 *
 * Colour and type went on working, because those *do* apply to inline
 * elements — which is why the row ended up recoloured and ragged but
 * impossible to straighten.
 *
 * Elsewhere the app had already met this: the dashboard and inventory
 * tiles are anchors too, and both carry `block h-full` for exactly this
 * reason. These were the ones that never got it.
 *
 * items-center keeps the text centred once a height is applied, and
 * items-stretch on the row keeps the buttons a common height until one is.
 */
const linkClass =
  "inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-black shadow-sm transition hover:bg-zinc-50";

const activeLinkClass =
  "inline-flex items-center justify-center rounded-xl border border-black bg-black px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-zinc-800";

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

/**
 * A readable name for a route nobody registered.
 *
 * Customers, Equipment, Sites and the technician report are all real
 * pages that are deliberately absent from the navigation list, so they
 * had no header at all. Rather than leave them bare, the last meaningful
 * segment of the path becomes the title: "/inventory/company-tools"
 * reads as "Company Tools".
 */
function titleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return "Home";
  }

  return segments[segments.length - 1]
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CategorySubnavigation() {
  const pathname = usePathname();
  const currentMainCategory = getCurrentMainCategory(pathname);

  /*
   * The width the layout row is frozen at.
   *
   * Measured from the card's parent, which is the plain sticky wrapper in
   * the layout and always spans the content column — so it is the width
   * the bar would have if nobody had ever resized it. Watching the card
   * itself would defeat the whole point: the row would follow every
   * resize, which is the behaviour being removed.
   *
   * Null until measured, and while it is null the row simply fills the
   * card as it always did, so the first paint and the server's render
   * agree with each other.
   */
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [layoutWidth, setLayoutWidth] = useState<number | null>(null);

  useEffect(() => {
    const container = cardRef.current?.parentElement;

    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    function measure() {
      const width = container?.clientWidth ?? 0;

      /*
       * A zero reading happens while the bar is hidden — during a route
       * change, or before layout has settled. Writing it would collapse
       * the row, so it is ignored and the last good width stands.
       */
      if (width > 0) {
        setLayoutWidth(width);
      }
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

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

  /*
   * The header tile is on every page now, whether or not the route has
   * subcategories to offer.
   *
   * It used to return null unless the category defined children, which
   * only Inventory and Settings do — so the bar existed on a handful of
   * pages and nowhere else. That made it impossible to style as a
   * consistent piece of the app, and left most pages with no title.
   *
   * Where there are no subcategories the tile still renders, with the
   * page's name and nothing else on it. The buttons appear as soon as the
   * category is given children in constants/navigation.ts.
   */
  const children = currentMainCategory?.children ?? [];
  const hasChildren = children.length > 0;

  /*
   * A page can claim the header for itself. Where it does, its own title
   * and description replace the category defaults, and its buttons appear
   * on the right — so a page no longer needs a header of its own.
   */
  const pageHeader = usePageHeaderContent();

  const headerLabel =
    pageHeader.title ??
    currentMainCategory?.label ??
    titleFromPathname(pathname);

  const headerDescription =
    pageHeader.description ??
    (hasChildren ? "Select a subcategory." : "");

  const activeChildHref = getActiveChildHref(pathname, children);

  const overviewIsActive =
    pathname === currentMainCategory?.href && activeChildHref === null;

  /*
   * Hrefs are unique across every category, so one store serves them all —
   * a layout entry for a link that is not in this category is simply
   * ignored when the arrangement is applied.
   */
  const arranged = arrangeDashboardTiles(
    children,
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
    /*
      * This bar needs a Q-Bit identity of its own.
      *
      * It carried data-t1eq-page-card but no qbit id, and Q-Bit selects
      * the nearest ancestor that has one — which was the plain wrapper
      * around <CategorySubnavigation /> in app/layout.tsx, sitting behind
      * this card. A background set on the bar was therefore painted on
      * the element underneath it and hidden by this card's own opaque
      * bg-white: the edit worked, on something nobody could see.
      */
    <div
      ref={cardRef}
      data-t1eq-page-card="true"
      data-t1eq-qbit-type="page-card"
      data-t1eq-qbit-id="category-subnavigation-card"
      data-t1eq-qbit-scope={QBIT_SCOPE}
      className={wrapperClass}
    >
      <div
        className={innerClass}
        style={
          layoutWidth === null
            ? undefined
            : {
                /*
                 * The card's own padding comes off, because the row sits
                 * inside it. Without this the row would be wider than the
                 * bar by exactly the padding and would clip on the right
                 * even at the card's natural size.
                 */
                width: `${Math.max(0, layoutWidth - 48)}px`,
                maxWidth: "none",
                flexShrink: 0,
              }
        }
      >
        <div className={sideColumnClass}>
          <div className="min-w-0">
            {pageHeader.overline && (
              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="category-subnavigation-overline"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400"
              >
                {pageHeader.overline}
              </div>
            )}

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="category-subnavigation-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className={titleClass}
            >
              {headerLabel}
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="category-subnavigation-subtitle"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-1 max-w-xl text-sm font-semibold text-zinc-600"
            >
              {headerDescription || "\u00a0"}
            </div>
          </div>
        </div>

        {/*
          The search and the buttons share whatever is left once the title
          column has taken its fixed width. They divide it equally, so the
          search stays centred within that remaining space — and every bit
          of the give in the bar is here, away from the text.
        */}
        <div className={searchColumnClass}>
          <UniversalSearchBar />
        </div>

        <div className={actionsColumnClass}>
          {/*
            Overview sits outside the arrangeable grid deliberately. It is
            the way back to the category root, so it must not be draggable
            to the trash at all — a guard inside the grid could be got
            around; not being in the grid cannot.
          */}
          {hasChildren && currentMainCategory && (
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
          )}

          {/*
            A hidden link used to be recoverable only from the right-click
            picker, which is invisible until you know it is there — so a
            link dropped on the trash by accident looked gone for good.
            This says how many are hidden and puts them all back in one
            press. It is absent when nothing is hidden.
          */}
          {arranged.hidden.length > 0 && (
            <button
              data-t1eq-action-button="true"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="category-subnavigation-restore-hidden"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="button"
              onClick={() => {
                /*
                 * showDashboardTile reads and writes the store on each
                 * call, so the last result already includes every earlier
                 * one — no need to merge them by hand.
                 */
                let nextLayout = layout;

                for (const child of arranged.hidden) {
                  nextLayout = showDashboardTile(SECTION_KEY, child.href);
                }

                setLayout(nextLayout);
              }}
              title="Put every hidden subcategory link back on the bar."
              className="rounded-xl border border-dashed border-zinc-400 bg-white px-4 py-2 text-sm font-black text-zinc-600 shadow-sm transition hover:border-zinc-600 hover:text-black"
            >
              + Restore {arranged.hidden.length} hidden
            </button>
          )}

          {/*
            No subcategories, no row. Without this guard every page that
            has none would show the grid's empty state instead — an
            instruction to restore links that were never there.
          */}
          {hasChildren && (
            <ArrangeableTileGrid
              allowLinkDrag
              qbitId="category-subnavigation-links"
              qbitScope={QBIT_SCOPE}
              gridClassName={linkGridClass}
              tiles={arranged.visible.map((child) => ({
                id: child.href,
                label: child.label,
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
              onRestore={(href) =>
                setLayout(showDashboardTile(SECTION_KEY, href))
              }
              menuItems={pickerItems}
              emptyState={
                <span className="text-xs font-semibold text-zinc-400">
                  All subcategory links hidden — right-click to add them back.
                </span>
              }
            />
          )}

          {/*
            Whatever the page asked for — Create / Edit / Delete and the
            like. It renders after the subcategory links so the two never
            fight for the same spot.
          */}
          {pageHeader.actions && (
            <div
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="category-subnavigation-page-actions"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="flex flex-wrap items-stretch gap-2"
            >
              {pageHeader.actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
