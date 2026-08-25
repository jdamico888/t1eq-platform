"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { type ArrangeableMenuItem } from "@/components/dashboard/ArrangeableTileGrid";
import FreeformTileCanvas, {
  type TileCanvasHandle,
} from "@/components/dashboard/FreeformTileCanvas";
import {
  DASHBOARD_LAYOUT_CHANGED_EVENT,
  arrangeDashboardTiles,
  createEmptySectionLayout,
  getDashboardSectionLayout,
  hideDashboardTile,
  resetDashboardSectionLayout,
  showDashboardTile,
  type DashboardSectionLayout,
} from "@/services/dashboard-layout";

const SECTION_KEY = "inventoryCategories" as const;

export type InventoryCategoryTile = {
  id: string;
  title: string;
  description: string;
  href: string;
  action: string;
};

/**
 * The tile half of the Inventory hub, split out because the hub page is a
 * server component and the canvas needs callbacks — functions cannot cross
 * the server/client boundary. The category data stays on the page, where
 * the content belongs, and arrives here as plain objects.
 */
type InventoryCategoryGridProps = {
  categories: InventoryCategoryTile[];
  cardClassName: string;
  cardTitleClassName: string;
  cardDescriptionClassName: string;
  cardActionClassName: string;
  qbitScope: string;
};

export default function InventoryCategoryGrid({
  categories,
  cardClassName,
  cardTitleClassName,
  cardDescriptionClassName,
  cardActionClassName,
  qbitScope,
}: InventoryCategoryGridProps) {
  /*
   * Empty until the effect below reads it, so the first client render
   * matches what the server rendered and hydration stays quiet.
   */
  const [layout, setLayout] = useState<DashboardSectionLayout>(
    createEmptySectionLayout
  );

  /* Right-click is invisible; the button below opens the same picker. */
  const canvasRef = useRef<TileCanvasHandle | null>(null);

  useEffect(() => {
    function loadLayout() {
      setLayout(getDashboardSectionLayout(SECTION_KEY));
    }

    loadLayout();

    /* Keeps a second tab in step after a drag. */
    window.addEventListener(DASHBOARD_LAYOUT_CHANGED_EVENT, loadLayout);
    window.addEventListener("storage", loadLayout);

    return () => {
      window.removeEventListener(DASHBOARD_LAYOUT_CHANGED_EVENT, loadLayout);
      window.removeEventListener("storage", loadLayout);
    };
  }, []);

  const arranged = arrangeDashboardTiles(
    categories,
    (category) => category.id,
    layout
  );

  /*
   * The trash takes a tile off the hub; it does not delete anything, and
   * the page itself is still reachable by URL. Every removed tile is in
   * the right-click picker.
   */
  function handleRemove(tileId: string) {
    setLayout(hideDashboardTile(SECTION_KEY, tileId));
  }

  const hasLayout = layout.order.length > 0 || layout.hidden.length > 0;

  const pickerItems: ArrangeableMenuItem[] = [
    ...arranged.hidden.map((category) => ({
      label: `Add: ${category.title}`,
      description: "Put this tile back on the hub.",
      onSelect: () => setLayout(showDashboardTile(SECTION_KEY, category.id)),
    })),

    ...(hasLayout
      ? [
          {
            label: "Reset Inventory Categories",
            description: "Return every tile to its original place.",
            onSelect: () =>
              setLayout(resetDashboardSectionLayout(SECTION_KEY)),
          },
        ]
      : []),
  ];

  function openPicker(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    canvasRef.current?.openPicker({ x: rect.left, y: rect.bottom + 8 });
  }

  return (
    <>
      <button
        data-t1eq-action-button="true"
        data-t1eq-qbit-type="action-button"
        data-t1eq-qbit-id="inventory-categories-add-tile"
        data-t1eq-qbit-scope={qbitScope}
        type="button"
        onClick={openPicker}
        className="mb-4 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-black shadow-sm transition hover:bg-zinc-50"
      >
        + Add Tile
      </button>

    <FreeformTileCanvas
      ref={canvasRef}
      sectionKey={SECTION_KEY}
      qbitId="inventory-categories-grid"
      qbitScope={qbitScope}
      tiles={arranged.visible.map((category) => ({
        id: category.id,
        defaultColumnSpan: 4,
        defaultRowSpan: 8,
        content: (
          <Link
            data-t1eq-tile="true"
            data-t1eq-page-card="true"
            data-t1eq-qbit-type="tile"
            data-t1eq-qbit-id={`inventory-category-${category.id}`}
            data-t1eq-qbit-scope={qbitScope}
            href={category.href}
            /*
             * block h-full: the tile is an anchor that used to be a grid
             * item itself. Inside the drag wrapper nothing blockifies it,
             * so without this it collapses to inline and loses its
             * padding and equal-height row.
             */
            className={`block h-full ${cardClassName}`}
          >
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id={`inventory-category-${category.id}-title`}
              data-t1eq-qbit-scope={qbitScope}
              className={cardTitleClassName}
            >
              {category.title}
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id={`inventory-category-${category.id}-description`}
              data-t1eq-qbit-scope={qbitScope}
              className={cardDescriptionClassName}
            >
              {category.description}
            </div>

            <div className={cardActionClassName}>{category.action}</div>
          </Link>
        ),
      }))}
      onRemove={handleRemove}
      menuItems={pickerItems}
      emptyState={
        <div
          data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-categories-grid-empty"
          data-t1eq-qbit-scope={qbitScope}
          className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center"
        >
          <p className="text-sm font-black text-black">
            No category tiles on the hub.
          </p>

          <p className="mt-1 text-sm font-semibold text-zinc-600">
            Right-click here to put them back. Nothing was deleted.
          </p>
        </div>
      }
    />
    </>
  );
}
