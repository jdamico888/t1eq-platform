/**
 * Where the dashboard remembers how each tile section has been arranged.
 *
 * Most tile sections are fixed definitions in code with nowhere to record
 * where someone dragged them, which is what this store is for. Charts are
 * the exception — one already carries `showOnOperationsDashboard` — but
 * they keep their canvas position here like everything else.
 *
 * Nothing is destroyed here. Dropping a tile on the trash records its id
 * as hidden; the tile stays defined and comes back from the picker.
 */

const STORAGE_KEY = "t1eq-dashboard-layout-v1";

export type DashboardSectionKey =
  /**
   * The Operations Dashboard canvas — command tiles and report widgets
   * share it, so one arrangement covers both.
   */
  | "commandTiles"
  /** The Operational Category Tiles on the Operations Dashboard landing page. */
  | "categoryTiles"
  /** The category tiles on the Inventory hub. */
  | "inventoryCategories"
  /** The count tiles at the top of Inventory Items. */
  | "inventoryItemMetrics"
  /** The count tiles at the top of Inventory Transactions. */
  | "inventoryTransactionMetrics"
  /** The Overview / sub-page link row shown across category pages. */
  | "categorySubnavigation";

/**
 * Where a tile sits on the canvas, in grid units rather than pixels.
 *
 * Pixels would not survive a resize: a layout arranged on a wide monitor
 * would be wrong on a laptop and off-screen on a phone. Columns and rows
 * scale with the container, and below tablet width the canvas collapses to
 * a single column in row order, so the arrangement degrades instead of
 * breaking.
 */
export type TilePlacement = {
  id: string;

  /** 0-based, in CANVAS_COLUMNS units. */
  column: number;
  row: number;

  columnSpan: number;
  rowSpan: number;
};

export type DashboardSectionLayout = {
  /**
   * Tile ids in the order the person arranged them. Still used by sections
   * that flow rather than sit on a canvas, and as the fallback order when
   * a canvas tile has no placement yet.
   */
  order: string[];

  /** Tile ids dragged to the trash — defined, just not on the dashboard. */
  hidden: string[];

  /** Canvas positions. Empty for a section that has never been arranged. */
  placements: TilePlacement[];
};

type DashboardLayoutStore = Partial<
  Record<DashboardSectionKey, DashboardSectionLayout>
>;

export const DASHBOARD_LAYOUT_CHANGED_EVENT = "t1eq-dashboard-layout-changed";

export function createEmptySectionLayout(): DashboardSectionLayout {
  return {
    order: [],
    hidden: [],
    placements: [],
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is string =>
      typeof entry === "string" && entry.trim().length > 0
  );
}

/**
 * A placement that cannot be trusted is worse than no placement — a tile
 * with a broken position is dropped back to automatic flow rather than
 * rendered somewhere nonsensical.
 */
function toPlacements(value: unknown): TilePlacement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const placements: TilePlacement[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    const record = entry as Record<string, unknown>;

    const id = typeof record.id === "string" ? record.id.trim() : "";

    const column = Number(record.column);
    const row = Number(record.row);
    const columnSpan = Number(record.columnSpan);
    const rowSpan = Number(record.rowSpan);

    if (
      !id ||
      !Number.isFinite(column) ||
      !Number.isFinite(row) ||
      !Number.isFinite(columnSpan) ||
      !Number.isFinite(rowSpan) ||
      column < 0 ||
      row < 0 ||
      columnSpan < 1 ||
      rowSpan < 1
    ) {
      continue;
    }

    placements.push({
      id,
      column: Math.floor(column),
      row: Math.floor(row),
      columnSpan: Math.floor(columnSpan),
      rowSpan: Math.floor(rowSpan),
    });
  }

  return placements;
}

function normalizeSectionLayout(value: unknown): DashboardSectionLayout {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return createEmptySectionLayout();
  }

  const record = value as Record<string, unknown>;

  return {
    order: toStringArray(record.order),
    hidden: toStringArray(record.hidden),
    placements: toPlacements(record.placements),
  };
}

function readStore(): DashboardLayoutStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue);

    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      Array.isArray(parsedValue)
    ) {
      return {};
    }

    const record = parsedValue as Record<string, unknown>;

    return {
      commandTiles: normalizeSectionLayout(record.commandTiles),
      categoryTiles: normalizeSectionLayout(record.categoryTiles),
      inventoryCategories: normalizeSectionLayout(record.inventoryCategories),
      inventoryItemMetrics: normalizeSectionLayout(record.inventoryItemMetrics),
      inventoryTransactionMetrics: normalizeSectionLayout(
        record.inventoryTransactionMetrics
      ),
      categorySubnavigation: normalizeSectionLayout(
        record.categorySubnavigation
      ),
    };
  } catch {
    return {};
  }
}

function writeStore(store: DashboardLayoutStore): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

  window.dispatchEvent(new Event(DASHBOARD_LAYOUT_CHANGED_EVENT));
}

export function getDashboardSectionLayout(
  sectionKey: DashboardSectionKey
): DashboardSectionLayout {
  return readStore()[sectionKey] ?? createEmptySectionLayout();
}

function updateSectionLayout(
  sectionKey: DashboardSectionKey,
  update: (layout: DashboardSectionLayout) => DashboardSectionLayout
): DashboardSectionLayout {
  const store = readStore();
  const current = store[sectionKey] ?? createEmptySectionLayout();
  const next = update(current);

  writeStore({
    ...store,
    [sectionKey]: next,
  });

  return next;
}

/**
 * Records the arrangement after a drag. Ids the person has never touched
 * are simply absent, and fall in behind the arranged ones in the order the
 * code defines them.
 */
export function saveDashboardSectionOrder(
  sectionKey: DashboardSectionKey,
  orderedIds: string[]
): DashboardSectionLayout {
  return updateSectionLayout(sectionKey, (layout) => ({
    ...layout,
    order: [
      ...orderedIds,
      ...layout.order.filter((id) => !orderedIds.includes(id)),
    ],
  }));
}

export function hideDashboardTile(
  sectionKey: DashboardSectionKey,
  tileId: string
): DashboardSectionLayout {
  return updateSectionLayout(sectionKey, (layout) =>
    layout.hidden.includes(tileId)
      ? layout
      : {
          ...layout,
          hidden: [...layout.hidden, tileId],
        }
  );
}

export function showDashboardTile(
  sectionKey: DashboardSectionKey,
  tileId: string
): DashboardSectionLayout {
  return updateSectionLayout(sectionKey, (layout) => ({
    ...layout,
    hidden: layout.hidden.filter((id) => id !== tileId),
  }));
}

/**
 * Records the canvas after a move or a resize. Replaces the section's
 * placements wholesale, because a move settles every other tile too.
 */
export function saveDashboardSectionPlacements(
  sectionKey: DashboardSectionKey,
  placements: TilePlacement[]
): DashboardSectionLayout {
  return updateSectionLayout(sectionKey, (layout) => ({
    ...layout,
    placements,
  }));
}

export function resetDashboardSectionLayout(
  sectionKey: DashboardSectionKey
): DashboardSectionLayout {
  return updateSectionLayout(sectionKey, () => createEmptySectionLayout());
}

/**
 * Applies a saved layout to the tiles the code defines.
 *
 * Arranged tiles lead, in the saved order; anything added to the program
 * since the last drag follows in its defined order rather than
 * disappearing. Ids in the saved layout that no longer exist are ignored.
 */
export function arrangeDashboardTiles<T>(
  items: T[],
  getId: (item: T) => string,
  layout: DashboardSectionLayout
): { visible: T[]; hidden: T[] } {
  const arranged = [
    ...layout.order
      .map((id) => items.find((item) => getId(item) === id))
      .filter((item): item is T => Boolean(item)),

    ...items.filter((item) => !layout.order.includes(getId(item))),
  ];

  return {
    visible: arranged.filter((item) => !layout.hidden.includes(getId(item))),
    hidden: arranged.filter((item) => layout.hidden.includes(getId(item))),
  };
}
