"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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
  type DashboardSectionKey,
  type DashboardSectionLayout,
} from "@/services/dashboard-layout";

export type MetricTile = {
  id: string;
  label: string;
  value: ReactNode;
};

/**
 * The count tiles that head a list page, made arrangeable.
 *
 * These are read-only numbers, so hiding one costs nothing — it just lets
 * someone keep the figures they actually watch and drop the rest. Written
 * once here rather than per page, because every one of these grids was the
 * same four hand-written cards with different labels.
 */
type MetricTileGridProps = {
  sectionKey: DashboardSectionKey;
  tiles: MetricTile[];

  cardClassName: string;

  /** Q-Bit matches on id + scope, so each grid needs its own. */
  qbitId: string;
  qbitScope: string;

  labelClassName?: string;
  valueClassName?: string;
};

export default function MetricTileGrid({
  sectionKey,
  tiles,
  cardClassName,
  qbitId,
  qbitScope,
  labelClassName = "text-sm font-black uppercase tracking-wide text-zinc-500",
  valueClassName = "mt-2 text-4xl font-black text-black",
}: MetricTileGridProps) {
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
      setLayout(getDashboardSectionLayout(sectionKey));
    }

    loadLayout();

    window.addEventListener(DASHBOARD_LAYOUT_CHANGED_EVENT, loadLayout);
    window.addEventListener("storage", loadLayout);

    return () => {
      window.removeEventListener(DASHBOARD_LAYOUT_CHANGED_EVENT, loadLayout);
      window.removeEventListener("storage", loadLayout);
    };
  }, [sectionKey]);

  const arranged = arrangeDashboardTiles(tiles, (tile) => tile.id, layout);

  const hasLayout = layout.order.length > 0 || layout.hidden.length > 0;

  const pickerItems: ArrangeableMenuItem[] = [
    ...arranged.hidden.map((tile) => ({
      label: `Add: ${tile.label}`,
      description: "Put this figure back at the top of the page.",
      onSelect: () => setLayout(showDashboardTile(sectionKey, tile.id)),
    })),

    ...(hasLayout
      ? [
          {
            label: "Reset Figures",
            description: "Show every figure again, in its original order.",
            onSelect: () =>
              setLayout(resetDashboardSectionLayout(sectionKey)),
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
        data-t1eq-qbit-id={`${qbitId}-add-tile`}
        data-t1eq-qbit-scope={qbitScope}
        type="button"
        onClick={openPicker}
        className="mb-4 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-black shadow-sm transition hover:bg-zinc-50"
      >
        + Add Figure
      </button>

    <FreeformTileCanvas
      ref={canvasRef}
      sectionKey={sectionKey}
      qbitId={qbitId}
      qbitScope={qbitScope}
      tiles={arranged.visible.map((tile) => ({
        id: tile.id,
        defaultColumnSpan: 3,
        defaultRowSpan: 5,
        content: (
          <div
            data-t1eq-tile="true"
            data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id={`${qbitId}-${tile.id}`}
            data-t1eq-qbit-scope={qbitScope}
            className={`h-full ${cardClassName}`}
          >
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id={`${qbitId}-${tile.id}-label`}
              data-t1eq-qbit-scope={qbitScope}
              className={labelClassName}
            >
              {tile.label}
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id={`${qbitId}-${tile.id}-value`}
              data-t1eq-qbit-scope={qbitScope}
              className={valueClassName}
            >
              {tile.value}
            </div>
          </div>
        ),
      }))}
      onRemove={(tileId) => setLayout(hideDashboardTile(sectionKey, tileId))}
      menuItems={pickerItems}
      emptyState={
        <div
          data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id={`${qbitId}-empty`}
          data-t1eq-qbit-scope={qbitScope}
          className="mb-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center"
        >
          <p className="text-sm font-semibold text-zinc-500">
            No figures shown. Right-click here to put them back.
          </p>
        </div>
      }
    />
    </>
  );
}
