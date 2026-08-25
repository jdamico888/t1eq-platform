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
 * Settles the canvas after one tile has been moved or resized.
 *
 * The moved tile keeps exactly where it was dropped. Anything it lands on
 * is pushed straight down until it is clear, and anything THAT lands on is
 * pushed in turn — so a drop can never leave one tile hidden underneath
 * another.
 *
 * Deliberately no upward compaction: a gap someone left is a gap they
 * meant, and tiles silently sliding up after every drag makes the canvas
 * feel like it is fighting back.
 */
export function settleCanvas(
  placements: TilePlacement[],
  anchorId: string
): TilePlacement[] {
  const anchor = placements.find((placement) => placement.id === anchorId);

  if (!anchor) {
    return placements;
  }

  const others = placements
    .filter((placement) => placement.id !== anchorId)
    .sort((a, b) => a.row - b.row || a.column - b.column);

  const settled: TilePlacement[] = [{ ...anchor }];

  for (const placement of others) {
    const next = { ...placement };

    /*
     * A tile can never need to travel past the bottom edge of everything
     * already settled, so that plus its own height is the true ceiling.
     * The guard is belt-and-braces against a malformed placement.
     */
    let guard = 0;

    const lowestEdge = settled.reduce(
      (lowest, other) => Math.max(lowest, other.row + other.rowSpan),
      0
    );

    const limit = lowestEdge + next.rowSpan + placements.length + 1;

    while (
      settled.some((other) => placementsOverlap(other, next)) &&
      guard < limit
    ) {
      next.row += 1;
      guard += 1;
    }

    settled.push(next);
  }

  return settled;
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

  const resolved: TilePlacement[] = [];

  /* Placed tiles first, so automatic ones fill the gaps around them. */
  for (const id of tileIds) {
    const saved = savedById.get(id);

    if (!saved) {
      continue;
    }

    const columnSpan = clampColumnSpan(saved.columnSpan);

    resolved.push({
      id,
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

  return resolved;
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
