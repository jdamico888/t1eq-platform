"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { TilePlacement } from "@/services/dashboard-layout";
import {
  DASHBOARD_LAYOUT_CHANGED_EVENT,
  createEmptySectionLayout,
  getDashboardSectionLayout,
  saveDashboardSectionPlacements,
  type DashboardSectionKey,
  type DashboardSectionLayout,
} from "@/services/dashboard-layout";
import {
  CANVAS_COLUMNS,
  CANVAS_GAP,
  CANVAS_ROW_UNIT,
  CANVAS_STACK_BREAKPOINT,
  cellToPixels,
  clampColumn,
  clampColumnSpan,
  clampRowSpan,
  measureCanvasHeight,
  resolvePlacements,
  settleCanvas,
  toStackOrder,
  type TileSizeHint,
} from "@/services/tile-canvas";

import type { ArrangeableMenuItem } from "@/components/dashboard/ArrangeableTileGrid";

export type CanvasTile = {
  id: string;
  content: ReactNode;

  /** Where a tile that has never been placed starts out. */
  defaultColumnSpan?: number;
  defaultRowSpan?: number;
};

type FreeformTileCanvasProps = {
  sectionKey: DashboardSectionKey;
  tiles: CanvasTile[];

  /** Section-specific hide. Charts, for one, store this on the chart. */
  onRemove: (tileId: string) => void;

  menuItems: ArrangeableMenuItem[];

  qbitId: string;
  qbitScope: string;

  emptyState?: ReactNode;
};

const LONG_PRESS_MS = 400;
const MOVE_TOLERANCE_PX = 8;

function isQBitEditing(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.dataset.t1eqQbitEditing === "true";
}

/**
 * A press that starts on a control is the person using it. The resize
 * handle is the exception — it is a control whose whole job is to be
 * dragged.
 */
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  if (target.closest("[data-canvas-resize]")) {
    return false;
  }

  return Boolean(target.closest("button, input, select, textarea"));
}

type Gesture = {
  kind: "move" | "resize";
  tileId: string;
  pointerId: number;
  startX: number;
  startY: number;
  originColumn: number;
  originRow: number;
  originColumnSpan: number;
  originRowSpan: number;
};

/**
 * Tiles positioned on a grid canvas rather than flowed in a row.
 *
 * Drag one anywhere and it stays; drag its corner to resize; drop it on a
 * neighbour and the neighbour is pushed clear rather than hidden beneath.
 * Positions are grid units, so the arrangement survives a resize, and
 * below tablet width the canvas stacks in reading order instead of
 * scattering tiles off a narrow screen.
 *
 * The sidebar needs no special handling: it is a flex sibling of the page
 * content, not an overlay, and this canvas measures its own container. A
 * tile has no coordinate that could put it under the sidebar.
 */
export default function FreeformTileCanvas({
  sectionKey,
  tiles,
  onRemove,
  menuItems,
  qbitId,
  qbitScope,
  emptyState,
}: FreeformTileCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [layout, setLayout] = useState<DashboardSectionLayout>(
    createEmptySectionLayout
  );

  const [placements, setPlacements] = useState<TilePlacement[]>([]);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [qBitEditing, setQBitEditing] = useState(false);

  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const pendingPressRef = useRef<{
    kind: "move" | "resize";
    tileId: string;
    pointerId: number;
    x: number;
    y: number;
    isTouch: boolean;
  } | null>(null);

  const gestureRef = useRef<Gesture | null>(null);
  gestureRef.current = gesture;

  const placementsRef = useRef<TilePlacement[]>(placements);
  placementsRef.current = placements;

  const suppressNextClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);

  /* ---- saved layout ---------------------------------------------- */

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

  /* ---- container width ------------------------------------------- */

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    function measure() {
      setContainerWidth(element?.clientWidth ?? 0);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  /* ---- Q-Bit owns the surface while its editor is open ------------ */

  useEffect(() => {
    function syncQBitState() {
      setQBitEditing(isQBitEditing());
    }

    syncQBitState();

    const observer = new MutationObserver(syncQBitState);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-t1eq-qbit-editing"],
    });

    return () => observer.disconnect();
  }, []);

  /* ---- resolve placements from tiles + saved layout ---------------- */

  const sizeHints = useMemo(() => {
    const hints = new Map<string, TileSizeHint>();

    for (const tile of tiles) {
      hints.set(tile.id, {
        id: tile.id,
        columnSpan: tile.defaultColumnSpan ?? 4,
        rowSpan: tile.defaultRowSpan ?? 9,
      });
    }

    return hints;
  }, [tiles]);

  const tileIdsKey = tiles.map((tile) => tile.id).join("|");

  useEffect(() => {
    /* Never re-derive mid-gesture; the person is mid-thought. */
    if (gestureRef.current) {
      return;
    }

    setPlacements(
      resolvePlacements(
        tileIdsKey ? tileIdsKey.split("|") : [],
        layout.placements,
        sizeHints
      )
    );
  }, [tileIdsKey, layout, sizeHints]);

  /* ---- scroll lock while dragging on touch ------------------------ */

  useEffect(() => {
    if (!gesture) {
      return;
    }

    function blockScroll(event: TouchEvent) {
      event.preventDefault();
    }

    document.addEventListener("touchmove", blockScroll, { passive: false });

    return () => document.removeEventListener("touchmove", blockScroll);
  }, [gesture]);

  /* ---- picker dismissal ------------------------------------------- */

  useEffect(() => {
    if (!menuPosition) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        menuRef.current?.contains(event.target)
      ) {
        return;
      }

      setMenuPosition(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuPosition(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuPosition]);

  useEffect(() => {
    return () => {
      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }

      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  /* ---- geometry ---------------------------------------------------- */

  const isStacked =
    containerWidth > 0 && containerWidth < CANVAS_STACK_BREAKPOINT;

  const columnWidth =
    containerWidth > 0
      ? (containerWidth - CANVAS_GAP * (CANVAS_COLUMNS - 1)) / CANVAS_COLUMNS
      : 0;

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  function beginGesture(
    kind: "move" | "resize",
    tileId: string,
    pointerId: number,
    clientX: number,
    clientY: number
  ) {
    const placement = placementsRef.current.find(
      (candidate) => candidate.id === tileId
    );

    if (!placement) {
      return;
    }

    setGesture({
      kind,
      tileId,
      pointerId,
      startX: clientX,
      startY: clientY,
      originColumn: placement.column,
      originRow: placement.row,
      originColumnSpan: placement.columnSpan,
      originRowSpan: placement.rowSpan,
    });

    setPointerOffset({ x: 0, y: 0 });
  }

  function handleTilePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    tileId: string
  ) {
    if (qBitEditing || isStacked || isInteractiveTarget(event.target)) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const kind =
      event.target instanceof Element &&
      event.target.closest("[data-canvas-resize]")
        ? "resize"
        : "move";

    const isTouch = event.pointerType !== "mouse";

    pendingPressRef.current = {
      kind,
      tileId,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      isTouch,
    };

    event.currentTarget.setPointerCapture(event.pointerId);

    if (isTouch) {
      const { clientX, clientY, pointerId } = event;

      longPressTimerRef.current = window.setTimeout(() => {
        beginGesture(kind, tileId, pointerId, clientX, clientY);
      }, LONG_PRESS_MS);
    }
  }

  function isTrashAtPoint(x: number, y: number): boolean {
    const element = document.elementFromPoint(x, y);

    return Boolean(
      element instanceof Element && element.closest("[data-canvas-trash]")
    );
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const activeGesture = gestureRef.current;
    const pending = pendingPressRef.current;

    if (activeGesture) {
      if (event.pointerId !== activeGesture.pointerId || columnWidth <= 0) {
        return;
      }

      const deltaX = event.clientX - activeGesture.startX;
      const deltaY = event.clientY - activeGesture.startY;

      const deltaColumns = Math.round(deltaX / (columnWidth + CANVAS_GAP));
      const deltaRows = Math.round(deltaY / CANVAS_ROW_UNIT);

      if (activeGesture.kind === "move") {
        setIsOverTrash(isTrashAtPoint(event.clientX, event.clientY));
      }

      const next = placementsRef.current.map((placement) => {
        if (placement.id !== activeGesture.tileId) {
          return placement;
        }

        if (activeGesture.kind === "resize") {
          const columnSpan = clampColumnSpan(
            activeGesture.originColumnSpan + deltaColumns
          );

          return {
            ...placement,
            columnSpan: Math.min(
              columnSpan,
              CANVAS_COLUMNS - activeGesture.originColumn
            ),
            rowSpan: clampRowSpan(activeGesture.originRowSpan + deltaRows),
          };
        }

        return {
          ...placement,
          column: clampColumn(
            activeGesture.originColumn + deltaColumns,
            placement.columnSpan
          ),
          row: Math.max(0, activeGesture.originRow + deltaRows),
        };
      });

      setPlacements(settleCanvas(next, activeGesture.tileId));

      /*
       * The tile snaps to cells, but the pointer does not. This is the
       * leftover — it keeps the tile under the finger instead of lagging
       * a half-cell behind it.
       */
      setPointerOffset({
        x: deltaX - deltaColumns * (columnWidth + CANVAS_GAP),
        y: deltaY - deltaRows * CANVAS_ROW_UNIT,
      });

      return;
    }

    if (!pending || event.pointerId !== pending.pointerId) {
      return;
    }

    const movedFar =
      Math.abs(event.clientX - pending.x) > MOVE_TOLERANCE_PX ||
      Math.abs(event.clientY - pending.y) > MOVE_TOLERANCE_PX;

    if (!movedFar) {
      return;
    }

    if (pending.isTouch) {
      /* Moved before the hold finished — that was a scroll. */
      clearLongPress();
      pendingPressRef.current = null;
      return;
    }

    beginGesture(
      pending.kind,
      pending.tileId,
      pending.pointerId,
      pending.x,
      pending.y
    );
  }

  function finishGesture() {
    clearLongPress();

    const activeGesture = gestureRef.current;

    if (activeGesture) {
      suppressNextClickRef.current = true;

      if (suppressClickTimerRef.current !== null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }

      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressNextClickRef.current = false;
        suppressClickTimerRef.current = null;
      }, 400);

      if (activeGesture.kind === "move" && isOverTrash) {
        onRemove(activeGesture.tileId);

        setLayout(
          saveDashboardSectionPlacements(
            sectionKey,
            placementsRef.current.filter(
              (placement) => placement.id !== activeGesture.tileId
            )
          )
        );
      } else {
        setLayout(
          saveDashboardSectionPlacements(sectionKey, placementsRef.current)
        );
      }
    }

    pendingPressRef.current = null;
    setGesture(null);
    setPointerOffset({ x: 0, y: 0 });
    setIsOverTrash(false);
  }

  function handleClickCapture(event: React.MouseEvent) {
    if (!suppressNextClickRef.current) {
      return;
    }

    suppressNextClickRef.current = false;

    if (suppressClickTimerRef.current !== null) {
      window.clearTimeout(suppressClickTimerRef.current);
      suppressClickTimerRef.current = null;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  function handleContextMenu(event: React.MouseEvent) {
    if (qBitEditing) {
      return;
    }

    event.preventDefault();
    setMenuPosition({ x: event.clientX, y: event.clientY });
  }

  function handleCanvasPointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (qBitEditing || event.pointerType === "mouse") {
      return;
    }

    if (
      event.target instanceof Element &&
      event.target.closest("[data-canvas-tile]")
    ) {
      return;
    }

    const { clientX, clientY } = event;

    longPressTimerRef.current = window.setTimeout(() => {
      setMenuPosition({ x: clientX, y: clientY });
      pendingPressRef.current = null;
    }, LONG_PRESS_MS);
  }

  const tilesById = new Map(tiles.map((tile) => [tile.id, tile]));

  const canvasHeight = measureCanvasHeight(placements);

  /* Below tablet width the canvas is a plain column in reading order. */
  const stackedIds = toStackOrder(placements);

  return (
    <div
      ref={containerRef}
      data-t1eq-qbit-type="section"
      data-t1eq-qbit-id={qbitId}
      data-t1eq-qbit-scope={qbitScope}
      onContextMenu={handleContextMenu}
      onClickCapture={handleClickCapture}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
      className="relative"
      style={
        isStacked || containerWidth === 0
          ? undefined
          : { height: canvasHeight }
      }
    >
      {tiles.length === 0 && (emptyState ?? null)}

      {isStacked
        ? stackedIds.map((id) => {
            const tile = tilesById.get(id);

            return tile ? (
              <div key={id} className="mb-4">
                {tile.content}
              </div>
            ) : null;
          })
        : placements.map((placement) => {
            const tile = tilesById.get(placement.id);

            if (!tile || columnWidth <= 0) {
              return null;
            }

            const box = cellToPixels(placement, containerWidth);
            const isActive = gesture?.tileId === placement.id;

            return (
              <div
                key={placement.id}
                data-canvas-tile={placement.id}
                onPointerDown={(event) =>
                  handleTilePointerDown(event, placement.id)
                }
                onDragStart={(event) => event.preventDefault()}
                style={{
                  position: "absolute",
                  left: box.left,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                  transform: isActive
                    ? `translate(${pointerOffset.x}px, ${pointerOffset.y}px)`
                    : undefined,
                  zIndex: isActive ? 40 : undefined,
                  pointerEvents: isActive ? "none" : undefined,
                  transition: isActive
                    ? undefined
                    : "left 140ms ease, top 140ms ease, width 140ms ease, height 140ms ease",
                  WebkitTouchCallout: "none",
                }}
                className={[
                  "group/canvas-tile",
                  qBitEditing ? "" : "cursor-grab active:cursor-grabbing",
                  isActive ? "opacity-90 shadow-2xl ring-2 ring-orange-400" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="h-full overflow-auto">{tile.content}</div>

                {/*
                  The resize corner. Hidden until the tile is hovered so it
                  does not clutter a dashboard nobody is rearranging.
                */}
                {!qBitEditing && (
                  <span
                    data-canvas-resize="true"
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize rounded-tl-md border-b-2 border-r-2 border-orange-400/70 opacity-0 transition group-hover/canvas-tile:opacity-100"
                  />
                )}
              </div>
            );
          })}

      {/* Trash — only while a tile is actually in hand */}
      {gesture?.kind === "move" && (
        <div
          data-canvas-trash="true"
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id={`${qbitId}-trash`}
          data-t1eq-qbit-scope={qbitScope}
          className={[
            "fixed top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 px-6 py-4 shadow-2xl transition",
            isOverTrash
              ? "scale-110 border-red-400 bg-red-500 text-white"
              : "border-red-300 bg-white text-red-700",
          ].join(" ")}
        >
          <span className="text-2xl leading-none">🗑</span>

          <span className="text-sm font-black uppercase tracking-wide">
            {isOverTrash ? "Release to remove" : "Drag here to remove"}
          </span>
        </div>
      )}

      {/* Picker — right-click on mouse, press and hold on touch */}
      {menuPosition && (
        <div
          ref={menuRef}
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id={`${qbitId}-menu`}
          data-t1eq-qbit-scope={qbitScope}
          style={{
            top: Math.min(menuPosition.y, window.innerHeight - 220),
            left: Math.min(menuPosition.x, window.innerWidth - 300),
          }}
          className="fixed z-50 w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        >
          {menuItems.length === 0 ? (
            <div className="px-4 py-3 text-sm font-semibold text-zinc-500">
              Nothing to add.
            </div>
          ) : (
            menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setMenuPosition(null);
                  item.onSelect();
                }}
                className="block w-full border-b border-zinc-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-zinc-50"
              >
                <span className="block text-sm font-black text-black">
                  {item.label}
                </span>

                {item.description && (
                  <span className="mt-0.5 block text-xs font-semibold text-zinc-500">
                    {item.description}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
