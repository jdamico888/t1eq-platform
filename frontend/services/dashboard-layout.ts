/**
 * Where the dashboard remembers how each tile section has been arranged.
 *
 * The report tiles did not need this — a chart already carries `sortOrder`
 * and `showOnOperationsDashboard`, so dragging one wrote back to the chart
 * itself. Command tiles and quick actions are fixed definitions in code
 * with nowhere to put that, which is why they needed a small store of
 * their own.
 *
 * Nothing is destroyed here. Dropping a tile on the trash records its id
 * as hidden; the tile stays defined and comes back from the picker.
 */

const STORAGE_KEY = "t1eq-dashboard-layout-v1";

export type DashboardSectionKey =
  | "commandTiles"
  | "quickActions"
  /** The Operational Category Tiles on the Operations Dashboard landing page. */
  | "categoryTiles";

export type DashboardSectionLayout = {
  /** Tile ids in the order the person arranged them. */
  order: string[];

  /** Tile ids dragged to the trash — defined, just not on the dashboard. */
  hidden: string[];
};

type DashboardLayoutStore = Partial<
  Record<DashboardSectionKey, DashboardSectionLayout>
>;

export const DASHBOARD_LAYOUT_CHANGED_EVENT = "t1eq-dashboard-layout-changed";

export function createEmptySectionLayout(): DashboardSectionLayout {
  return {
    order: [],
    hidden: [],
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

function normalizeSectionLayout(value: unknown): DashboardSectionLayout {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return createEmptySectionLayout();
  }

  const record = value as Record<string, unknown>;

  return {
    order: toStringArray(record.order),
    hidden: toStringArray(record.hidden),
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
      quickActions: normalizeSectionLayout(record.quickActions),
      categoryTiles: normalizeSectionLayout(record.categoryTiles),
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
