import type { TilePlacement } from "@/services/dashboard-layout";

/**
 * The arithmetic behind the freeform tile canvas, kept out of the
 * component so the rules can be reasoned about and tested on their own.
 *
 * The model: a fixed number of columns, rows of a fixed unit height, and
 * every tile occupying a rectangle of them. Positions are grid units, not
 * pixels, so an arrangement made on a wide monitor still means something
 * on a laptop, and the canvas can collapse to a single column on a phone
 * rather than scattering tiles off-screen.
 */

export const CANVAS_COLUMNS = 12;

/** One row unit in pixels. Small enough that heights feel continuous. */
export const CANVAS_ROW_UNIT = 24;

/** Gap between tiles, in pixels. */
export const CANVAS_GAP = 16;

/** Below this container width the canvas stacks instead of positioning. */
export const CANVAS_STACK_BREAKPOINT = 768;

export const MIN_COLUMN_SPAN = 2;
export const MIN_ROW_SPAN = 2;

export function clampColumn(column: number, columnSpan: number): number {
  return Math.max(0, Math.min(column, CANVAS_COLUMNS - columnSpan));
}

export function clampColumnSpan(columnSpan: number): number {
  return Math.max(MIN_COLUMN_SPAN, Math.min(columnSpan, CANVAS_COLUMNS));
}

export function clampRowSpan(rowSpan: number): number {
  return Math.max(MIN_ROW_SPAN, rowSpan);
}

export function placementsOverlap(
  a: TilePlacement,
  b: TilePlacement
): boolean {
  return (
    a.column < b.column + b.columnSpan &&
    b.column < a.column + a.columnSpan &&
    a.row < b.row + b.rowSpan &&
    b.row < a.row + a.rowSpan
  );
}

/**
 * Brings a tile to the front of the stack.
 *
 * Tiles are allowed to overlap — dropping one on another leaves it sitting
 * on top rather than shoving the other away. That means paint order is
 * meaningful, and it is simply the order of this array: later is nearer
 * the viewer. Moving a tile puts it last, so what you just placed is what
 * you see, and because the array is what gets saved, it still is after a
 * reload.
 *
 * An earlier version pushed overlapped tiles downward to guarantee nothing
 * could ever hide. It guaranteed that, and it also meant nudging a tile
 * could fling its neighbour to the bottom of the page — which turned out
 * to be the worse trade in practice.
 */
export function bringToFront(
  placements: TilePlacement[],
  tileId: string
): TilePlacement[] {
  const target = placements.find((placement) => placement.id === tileId);

  if (!target) {
    return placements;
  }

  return [
    ...placements.filter((placement) => placement.id !== tileId),
    target,
  ];
}

/**
 * Which tiles have no visible cell left — completely covered by whatever
 * is painted above them.
 *
 * The grid makes this exact rather than approximate: walk the placements
 * in paint order stamping each tile's id into the cells it covers, and
 * whatever id survives in a cell is what a person actually sees there. A
 * tile holding no cells at the end is invisible, which also means it has
 * no edge to grab and no way back.
 */
export function findBuriedTileIds(placements: TilePlacement[]): string[] {
  const owner = new Map<string, string>();

  for (const placement of placements) {
    for (let row = placement.row; row < placement.row + placement.rowSpan; row += 1) {
      for (
        let column = placement.column;
        column < placement.column + placement.columnSpan;
        column += 1
      ) {
        owner.set(`${column}:${row}`, placement.id);
      }
    }
  }

  const visible = new Set(owner.values());

  return placements
    .filter((placement) => !visible.has(placement.id))
    .map((placement) => placement.id);
}

/**
 * Whether every cell of this tile is covered by some other tile,
 * regardless of paint order. A tile with even one cell that nothing else
 * touches is visible however the stack is arranged — which makes this the
 * test to use when looking for somewhere safe to put a tile.
 */
function isFullyCoveredIgnoringOrder(
  tile: TilePlacement,
  others: TilePlacement[]
): boolean {
  for (let row = tile.row; row < tile.row + tile.rowSpan; row += 1) {
    for (
      let column = tile.column;
      column < tile.column + tile.columnSpan;
      column += 1
    ) {
      const covered = others.some(
        (other) =>
          column >= other.column &&
          column < other.column + other.columnSpan &&
          row >= other.row &&
          row < other.row + other.rowSpan
      );

      if (!covered) {
        return false;
      }
    }
  }

  return true;
}

/**
 * The closest spot to where a tile already sits at which some part of it
 * would show.
 *
 * Every position on the canvas is considered and the nearest workable one
 * wins, rather than sampling a few directions and giving up — the tail
 * cases are exactly the ones that matter here, because a tile that has to
 * travel is the thing this whole rule exists to avoid. The grid is twelve
 * columns wide and a dashboard is a few dozen rows tall, so looking at all
 * of it costs nothing and it only runs when a tile would otherwise be
 * lost.
 */
function findNearbyVisibleSpot(
  tile: TilePlacement,
  others: TilePlacement[]
): { column: number; row: number } | null {
  const lowestRow = others.reduce(
    (lowest, other) => Math.max(lowest, other.row + other.rowSpan),
    tile.row + tile.rowSpan
  );

  let best: { column: number; row: number; distance: number } | null = null;

  for (let row = 0; row <= lowestRow; row += 1) {
    for (let column = 0; column <= CANVAS_COLUMNS - tile.columnSpan; column += 1) {
      const distance =
        Math.abs(column - tile.column) + Math.abs(row - tile.row);

      if (distance === 0 || (best && distance >= best.distance)) {
        continue;
      }

      if (
        !isFullyCoveredIgnoringOrder({ ...tile, column, row }, others)
      ) {
        best = { column, row, distance };
      }
    }
  }

  return best ? { column: best.column, row: best.row } : null;
}

/**
 * Guarantees every tile keeps something you can see and grab.
 *
 * Overlapping is allowed and wanted — but a tile with nothing showing is
 * not "overlapped", it is lost: no edge to drag, and the picker cannot
 * offer it because it is placed, not hidden.
 *
 * Two remedies, cheapest first.
 *
 * **Paint order**, which costs nothing: a covered tile is lifted to the
 * front, exposing it without moving anything anyone put anywhere. This
 * settles most cases.
 *
 * **Relocation**, only where paint order provably cannot win. A tile can
 * be covered by the combined area of several others rather than by any
 * one of them, and then lifting can cycle — raising A buries B, raising B
 * buries A again. Two tiles on identical rectangles are the same problem
 * in miniature. Those tiles are moved to clear space, because a tile that
 * moved is recoverable and a tile that cannot be reached is not.
 */
export function surfaceBuriedTiles(
  placements: TilePlacement[]
): TilePlacement[] {
  let current = [...placements];

  /* --- 1. paint order, which moves nothing ------------------------- */

  let previousBuried = "";

  for (let pass = 0; pass < current.length + 1; pass += 1) {
    const buried = findBuriedTileIds(current);

    if (buried.length === 0) {
      return current;
    }

    /*
     * The same set twice running means lifting is going in circles —
     * no amount of further reordering will settle it.
     */
    const signature = buried.slice().sort().join("|");

    if (signature === previousBuried) {
      break;
    }

    previousBuried = signature;

    const buriedSet = new Set(buried);

    current = [
      ...current.filter((placement) => !buriedSet.has(placement.id)),
      ...current.filter((placement) => buriedSet.has(placement.id)),
    ];
  }

  /* --- 2. relocation, for what paint order cannot fix --------------- */

  for (let attempt = 0; attempt < current.length + 1; attempt += 1) {
    const buried = findBuriedTileIds(current);

    if (buried.length === 0) {
      return current;
    }

    const tileId = buried[0];
    const tile = current.find((placement) => placement.id === tileId);

    if (!tile) {
      return current;
    }

    const others = current.filter((placement) => placement.id !== tileId);

    /*
     * A buried tile shows nothing, so nothing else depends on where it
     * sits — lifting it out cannot disturb anything, and each pass
     * therefore settles one tile for good.
     *
     * The nearest spot where a sliver would show comes first, because the
     * whole point of allowing overlap was that tiles stop being flung
     * around. Empty space is the fallback for a canvas so crowded that
     * nowhere nearby works.
     */
    const nearby = findNearbyVisibleSpot(tile, others);

    const slot =
      nearby ?? findFreeSlot(others, tile.columnSpan, tile.rowSpan);

    current = [
      ...others,
      { ...tile, column: slot.column, row: slot.row },
    ];
  }

  return current;
}

/**
 * Finds the first free rectangle for a tile that has never been placed,
 * scanning left to right and top to bottom the way reading works.
 */
export function findFreeSlot(
  placements: TilePlacement[],
  columnSpan: number,
  rowSpan: number
): { column: number; row: number } {
  const span = clampColumnSpan(columnSpan);

  for (let row = 0; row < 500; row += 1) {
    for (let column = 0; column <= CANVAS_COLUMNS - span; column += 1) {
      const candidate: TilePlacement = {
        id: "__probe__",
        column,
        row,
        columnSpan: span,
        rowSpan,
      };

      if (
        !placements.some((placement) =>
          placementsOverlap(placement, candidate)
        )
      ) {
        return { column, row };
      }
    }
  }

  /* Nothing free in a very tall canvas — drop it below everything. */
  return {
    column: 0,
    row: placements.reduce(
      (lowest, placement) =>
        Math.max(lowest, placement.row + placement.rowSpan),
      0
    ),
  };
}

export type TileSizeHint = {
  id: string;
  columnSpan: number;
  rowSpan: number;
};

/**
 * Builds the full set of placements for what is on screen: saved
 * positions where they exist, automatic ones for tiles that have never
 * been placed, and nothing left over for tiles that are gone.
 */
export function resolvePlacements(
  tileIds: string[],
  savedPlacements: TilePlacement[],
  sizeHints: Map<string, TileSizeHint>
): TilePlacement[] {
  const savedById = new Map(
    savedPlacements.map((placement) => [placement.id, placement])
  );

  const liveIds = new Set(tileIds);

  const resolved: TilePlacement[] = [];

  /*
   * Walk the SAVED order, not the order tiles happen to be defined in.
   * Array order is paint order now, so rebuilding by definition order
   * would reshuffle which tile sits on top every time the page loaded —
   * the arrangement would look lost even though it was stored correctly.
   *
   * Placed tiles go first so automatic placement fills the gaps around
   * them; a brand new tile landing on top of the stack is right anyway.
   */
  for (const saved of savedPlacements) {
    if (!liveIds.has(saved.id)) {
      continue;
    }

    const columnSpan = clampColumnSpan(saved.columnSpan);

    resolved.push({
      id: saved.id,
      column: clampColumn(saved.column, columnSpan),
      row: Math.max(0, saved.row),
      columnSpan,
      rowSpan: clampRowSpan(saved.rowSpan),
    });
  }

  for (const id of tileIds) {
    if (savedById.has(id)) {
      continue;
    }

    const hint = sizeHints.get(id);

    const columnSpan = clampColumnSpan(hint?.columnSpan ?? 4);
    const rowSpan = clampRowSpan(hint?.rowSpan ?? 8);

    const slot = findFreeSlot(resolved, columnSpan, rowSpan);

    resolved.push({
      id,
      column: slot.column,
      row: slot.row,
      columnSpan,
      rowSpan,
    });
  }

  /*
   * A layout stored before this rule existed can contain a buried tile,
   * and so can one edited in another tab. Surfacing on the way in means
   * there is no state a reload can land in where a tile is unreachable.
   */
  return surfaceBuriedTiles(resolved);
}

/** How tall the canvas has to be to hold everything, in pixels. */
export function measureCanvasHeight(placements: TilePlacement[]): number {
  const rows = placements.reduce(
    (lowest, placement) => Math.max(lowest, placement.row + placement.rowSpan),
    0
  );

  return rows * CANVAS_ROW_UNIT + Math.max(rows - 1, 0) * 0 + CANVAS_GAP;
}

/**
 * Turns a pixel offset inside the canvas into the grid cell under it.
 */
export function pixelsToCell(
  x: number,
  y: number,
  containerWidth: number
): { column: number; row: number } {
  const columnWidth =
    (containerWidth - CANVAS_GAP * (CANVAS_COLUMNS - 1)) / CANVAS_COLUMNS;

  const column = Math.round(x / (columnWidth + CANVAS_GAP));
  const row = Math.round(y / CANVAS_ROW_UNIT);

  return {
    column: Math.max(0, column),
    row: Math.max(0, row),
  };
}

export function cellToPixels(
  placement: TilePlacement,
  containerWidth: number
): { left: number; top: number; width: number; height: number } {
  const columnWidth =
    (containerWidth - CANVAS_GAP * (CANVAS_COLUMNS - 1)) / CANVAS_COLUMNS;

  return {
    left: placement.column * (columnWidth + CANVAS_GAP),
    top: placement.row * CANVAS_ROW_UNIT,
    width:
      placement.columnSpan * columnWidth +
      (placement.columnSpan - 1) * CANVAS_GAP,
    height: placement.rowSpan * CANVAS_ROW_UNIT - CANVAS_GAP,
  };
}

/**
 * Reading order for the stacked phone layout — top to bottom, then left to
 * right, which is how someone would read the canvas out loud.
 */
export function toStackOrder(placements: TilePlacement[]): string[] {
  return [...placements]
    .sort((a, b) => a.row - b.row || a.column - b.column)
    .map((placement) => placement.id);
}
