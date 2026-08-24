"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const QBIT_SCOPE = "arrangeable-tile-grid";

export type ArrangeableTile = {
  id: string;
  /** Extra grid-span classes for a tile that should be wider than one cell. */
  spanClassName?: string;
  content: ReactNode;
};

export type ArrangeableMenuItem = {
  label: string;
  description?: string;
  onSelect: () => void;
};

type ArrangeableTileGridProps = {
  tiles: ArrangeableTile[];
  onReorder: (orderedIds: string[]) => void;
  onRemove: (tileId: string) => void;
  menuItems: ArrangeableMenuItem[];
  gridClassName?: string;
  emptyState?: ReactNode;
};

/**
 * Built on Pointer Events rather than HTML5 drag-and-drop, so one code path
 * covers mouse, touch, and pen. HTML5 DnD never fires on most touch
 * devices, which would have made this desktop-only.
 *
 * Gesture model, matching a phone home screen:
 *
 *  - touch/pen: press and hold a tile to pick it up; hold empty space to
 *    open the picker. Moving before the hold completes is a scroll, and
 *    the gesture is abandoned.
 *  - mouse: drag a tile immediately (after a few pixels, so a click stays a
 *    click); right-click opens the picker.
 */
const LONG_PRESS_MS = 400;
const MOVE_TOLERANCE_PX = 8;

type DragState = {
  tileId: string;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

function isQBitEditing(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.dataset.t1eqQbitEditing === "true";
}

/**
 * Tiles can contain links and buttons. A press that starts on one of those
 * is the person trying to use the control, not rearrange the tile.
 */
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest("a, button, input, select, textarea")
  );
}

export default function ArrangeableTileGrid({
  tiles,
  onReorder,
  onRemove,
  menuItems,
  gridClassName = "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
  emptyState,
}: ArrangeableTileGridProps) {
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    tiles.map((tile) => tile.id)
  );

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [qBitEditing, setQBitEditing] = useState(false);

  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pendingPressRef = useRef<{
    tileId: string | null;
    pointerId: number;
    x: number;
    y: number;
    isTouch: boolean;
  } | null>(null);

  const orderedIdsRef = useRef(orderedIds);
  orderedIdsRef.current = orderedIds;

  const dragStateRef = useRef<DragState | null>(null);
  dragStateRef.current = dragState;

  /* Keep local order in step with incoming tiles, but never mid-drag. */
  useEffect(() => {
    if (dragStateRef.current) {
      return;
    }

    const incomingIds = tiles.map((tile) => tile.id);

    const sameMembers =
      incomingIds.length === orderedIdsRef.current.length &&
      incomingIds.every((id) => orderedIdsRef.current.includes(id));

    if (!sameMembers) {
      setOrderedIds(incomingIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles]);

  /* Q-Bit owns the surface while its editor is open. */
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

  /*
   * While a tile is in hand, swallow touchmove so the page cannot scroll
   * out from under the drag. The listener has to be non-passive for
   * preventDefault to count, which rules out doing this in JSX.
   */
  useEffect(() => {
    if (!dragState) {
      return;
    }

    function blockScroll(event: TouchEvent) {
      event.preventDefault();
    }

    document.addEventListener("touchmove", blockScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", blockScroll);
    };
  }, [dragState]);

  /* Any press outside the picker, or Escape, closes it. */
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

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const beginDrag = useCallback(
    (
      tileId: string,
      pointerId: number,
      clientX: number,
      clientY: number
    ) => {
      const element = document.querySelector<HTMLElement>(
        `[data-arrangeable-id="${tileId}"]`
      );

      const rect = element?.getBoundingClientRect();

      setDragState({
        tileId,
        pointerId,
        startX: clientX,
        startY: clientY,
        offsetX: rect ? clientX - rect.left : 0,
        offsetY: rect ? clientY - rect.top : 0,
      });

      setDragDelta({ x: 0, y: 0 });
    },
    []
  );

  /** Which tile, if any, sits under this point. */
  function findTileIdAtPoint(x: number, y: number): string | null {
    const element = document.elementFromPoint(x, y);

    if (!(element instanceof Element)) {
      return null;
    }

    const tile = element.closest<HTMLElement>("[data-arrangeable-id]");

    return tile?.dataset.arrangeableId ?? null;
  }

  function isTrashAtPoint(x: number, y: number): boolean {
    const element = document.elementFromPoint(x, y);

    return Boolean(
      element instanceof Element &&
        element.closest("[data-arrangeable-trash]")
    );
  }

  function shuffleTowards(targetTileId: string) {
    const activeDrag = dragStateRef.current;

    if (!activeDrag || targetTileId === activeDrag.tileId) {
      return;
    }

    setOrderedIds((current) => {
      const fromIndex = current.indexOf(activeDrag.tileId);
      const toIndex = current.indexOf(targetTileId);

      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const next = [...current];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, activeDrag.tileId);

      return next;
    });
  }

  function handleTilePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    tileId: string
  ) {
    if (qBitEditing || isInteractiveTarget(event.target)) {
      return;
    }

    // Right-click is the picker on mouse, handled by onContextMenu.
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const isTouch = event.pointerType !== "mouse";

    pendingPressRef.current = {
      tileId,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      isTouch,
    };

    event.currentTarget.setPointerCapture(event.pointerId);

    if (isTouch) {
      // Hold to pick up, so a swipe still scrolls the page.
      const { clientX, clientY, pointerId } = event;

      longPressTimerRef.current = window.setTimeout(() => {
        beginDrag(tileId, pointerId, clientX, clientY);
      }, LONG_PRESS_MS);
    }
  }

  function handleGridPointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (qBitEditing) {
      return;
    }

    // Only empty space — a press on a tile is a drag, not the picker.
    if (
      event.target instanceof Element &&
      event.target.closest("[data-arrangeable-id]")
    ) {
      return;
    }

    if (event.pointerType === "mouse") {
      return;
    }

    const { clientX, clientY } = event;

    pendingPressRef.current = {
      tileId: null,
      pointerId: event.pointerId,
      x: clientX,
      y: clientY,
      isTouch: true,
    };

    longPressTimerRef.current = window.setTimeout(() => {
      setMenuPosition({ x: clientX, y: clientY });
      pendingPressRef.current = null;
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    const pending = pendingPressRef.current;
    const activeDrag = dragStateRef.current;

    if (activeDrag) {
      if (event.pointerId !== activeDrag.pointerId) {
        return;
      }

      setDragDelta({
        x: event.clientX - activeDrag.startX,
        y: event.clientY - activeDrag.startY,
      });

      setIsOverTrash(isTrashAtPoint(event.clientX, event.clientY));

      const hoveredTileId = findTileIdAtPoint(
        event.clientX,
        event.clientY
      );

      if (hoveredTileId) {
        shuffleTowards(hoveredTileId);
      }

      return;
    }

    if (!pending || event.pointerId !== pending.pointerId) {
      return;
    }

    const movedX = Math.abs(event.clientX - pending.x);
    const movedY = Math.abs(event.clientY - pending.y);
    const movedFar =
      movedX > MOVE_TOLERANCE_PX || movedY > MOVE_TOLERANCE_PX;

    if (!movedFar) {
      return;
    }

    if (pending.isTouch) {
      // Moved before the hold finished — treat it as a scroll.
      clearLongPress();
      pendingPressRef.current = null;
      return;
    }

    if (pending.tileId) {
      beginDrag(
        pending.tileId,
        pending.pointerId,
        pending.x,
        pending.y
      );
    }
  }

  function finishGesture() {
    clearLongPress();

    const activeDrag = dragStateRef.current;

    if (activeDrag) {
      if (isOverTrash) {
        onRemove(activeDrag.tileId);

        setOrderedIds((current) =>
          current.filter((id) => id !== activeDrag.tileId)
        );
      } else {
        onReorder(orderedIdsRef.current);
      }
    }

    pendingPressRef.current = null;
    setDragState(null);
    setDragDelta({ x: 0, y: 0 });
    setIsOverTrash(false);
  }

  function handleContextMenu(event: React.MouseEvent) {
    if (qBitEditing) {
      return;
    }

    event.preventDefault();

    setMenuPosition({ x: event.clientX, y: event.clientY });
  }

  const tilesById = new Map(tiles.map((tile) => [tile.id, tile]));

  const visibleTiles = orderedIds
    .map((id) => tilesById.get(id))
    .filter((tile): tile is ArrangeableTile => Boolean(tile));

  return (
    <div
      data-t1eq-qbit-type="section"
      data-t1eq-qbit-id="arrangeable-tile-grid"
      data-t1eq-qbit-scope={QBIT_SCOPE}
      onContextMenu={handleContextMenu}
      onPointerDown={handleGridPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
    >
      {visibleTiles.length === 0 ? (
        emptyState ?? null
      ) : (
        <div className={gridClassName}>
          {visibleTiles.map((tile) => {
            const isDragging = dragState?.tileId === tile.id;

            return (
              <div
                key={tile.id}
                data-arrangeable-id={tile.id}
                onPointerDown={(event) =>
                  handleTilePointerDown(event, tile.id)
                }
                style={
                  isDragging
                    ? {
                        transform: `translate(${dragDelta.x}px, ${dragDelta.y}px) scale(1.03)`,
                        // Let elementFromPoint see what is underneath.
                        pointerEvents: "none",
                        zIndex: 40,
                        position: "relative",
                        touchAction: "none",
                      }
                    : undefined
                }
                className={[
                  tile.spanClassName ?? "",
                  qBitEditing
                    ? ""
                    : "cursor-grab select-none active:cursor-grabbing",
                  isDragging
                    ? "opacity-90 shadow-2xl ring-2 ring-orange-400"
                    : "transition",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {tile.content}
              </div>
            );
          })}
        </div>
      )}

      {/* Trash target — only while a tile is actually in hand */}
      {dragState && (
        <div
          data-arrangeable-trash="true"
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="arrangeable-tile-grid-trash"
          data-t1eq-qbit-scope={QBIT_SCOPE}
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
          data-t1eq-qbit-id="arrangeable-tile-grid-menu"
          data-t1eq-qbit-scope={QBIT_SCOPE}
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
