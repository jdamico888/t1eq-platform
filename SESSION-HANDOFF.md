# T1EQ Platform — Session Handoff

Written 2026-08-25. Paste this into a new session to pick up cleanly.

---

## Repo

- Root: `C:\Users\Joe\Documents\GitHub\t1eq-platform`
- App: `frontend\`
- Stack: Next.js / React / TypeScript / TailwindCSS, localStorage-backed, no backend.

**Environment note for the next session:** the assistant reaches these files through
the desktop bridge and has **no shell on this machine**. It cannot run `git`, `npm`,
`tsc`, or delete files. Joe runs all git commands manually. The npm registry in the
cloud sandbox returns 403 on scoped packages (`@types/*`), so `npx tsc --noEmit` has
**never been run** in these sessions — code has only been syntax-checked file by file.
Running a real type check locally is worth doing.

---

## UNCOMMITTED — do this first

Three files were written to disk at the end of the last session but are **not yet in git**:

```
frontend/services/dashboard-layout.ts            (new file)
frontend/components/dashboard/ArrangeableTileGrid.tsx
frontend/app/dashboard/page.tsx
```

Suggested commit:

```
git add .
git commit -m "Make dashboard command tiles and quick actions arrangeable"
git push
```

(`git add .` is required — a bare `git commit` fails with "no changes added to commit".)

---

## What was just finished

Android-style tile arrangement on the dashboard: **drag to reorder, drag to the trash
can to remove, right-click for a picker.** Pointer Events, so one code path covers
mouse, touch, and pen. Trash hovers at center page top, only while a tile is in hand.

It already worked for the Reports & Charts tiles. The last session extended it to the
**Command Tiles** and **Quick Actions**, which had not worked because those tiles are
`<a>` elements and the grid's guard treated any press on a link as "using the control."

Three changes made it work:

1. **`services/dashboard-layout.ts` (new)** — command tiles and quick actions are
   defined in code, so unlike charts they had nowhere to store an arrangement. This
   keeps per-section order + trashed ids in localStorage under
   `t1eq-dashboard-layout-v1`. Trashing **hides, never deletes**. A tile added to the
   program later still appears rather than vanishing because it was not in the saved
   order. 16 unit tests written and passing against this service.

2. **`ArrangeableTileGrid.tsx`** — new `allowLinkDrag` prop. Anchors stay draggable;
   the click that follows a drag is swallowed so a rearranged tile does not navigate;
   native link-dragging and the mobile long-press callout are suppressed. Also fixed:
   the grid now resyncs on **order**, not just membership, so a saved arrangement
   actually applies after mount.

3. **`app/dashboard/page.tsx`** — both grids replaced. Quick Actions moved from
   hardcoded JSX into a `QUICK_ACTION_DEFINITIONS` array so it gets the same behavior.
   Right-click anywhere in a section gives the picker: removed tiles to add back, plus
   a reset. Added `block h-full` to both tile anchors — they used to be grid items
   directly, and wrapping them would have collapsed them to inline.

**Gesture reminder:** with a mouse it is drag, not hold (8px threshold). Hold is the
touch gesture (400ms).

---

## NEXT UP — the open question

Joe's last request: **"make those actions apply to all tiles."**

`data-t1eq-tile="true"` is on ~90 files — every card in the app, including form cards
and invoice lines — so "all tiles" cannot be taken literally. The real candidates are
the grids marked `data-t1eq-tile-grid`:

| Grid | File | Verdict |
|---|---|---|
| Operational Category Tiles | `app/page.tsx` (~line 660) | **Do it** — direct equivalent of the dashboard command tiles |
| Inventory hub categories | `app/inventory/page.tsx` (~line 152) | **Do it** — same pattern, link tiles |
| Inventory Items metric tiles | `app/inventory/items/page.tsx` (~line 1012) | Probably — read-only count tiles, safe to arrange/hide |
| Inventory Transactions metrics | `app/inventory/transactions/page.tsx` (~line 251) | Probably — same |
| Category sub-navigation | `components/navigation/CategorySubnavigation.tsx` (~line 88) | **Ask first** — trashing a link strands that page; needs an Overview guard |
| Appearance "Preview Tiles" | `app/settings/appearance/page.tsx` (~line 655) | **Do not touch** — part of the Q-Bit editor |
| Dispatch 4-col layout | `app/dispatch/page.tsx` (~line 170) | **Do not touch** — mislabeled; it is a detail layout, not a tile grid |

The question was put to Joe and not answered before the reset. Ask again before
building.

Both "do it" grids follow the same recipe as the dashboard: add a
`DashboardSectionKey` to `services/dashboard-layout.ts`, wrap the grid in
`ArrangeableTileGrid` with `allowLinkDrag`, and add `block h-full` to the tile anchor
so it does not collapse to inline inside the drag wrapper.

---

## Standing constraints — do not violate

- **"Leave all other editor functions the way we designed them."** Q-Bit must stay
  untouched. The arrangeable grid stands down whenever
  `document.documentElement.dataset.t1eqQbitEditing === "true"`, watched via
  `MutationObserver`. Any new arrangeable grid must keep that guard. Wrapper divs
  carry no `data-t1eq-qbit-*` attributes so Q-Bit selection walks straight past them.
- **The local login is not real security** — by Joe's decision. "The real security
  will happen when the app goes full ERP and subscription based." Do not re-litigate.
- Anything reading localStorage resolves in `useEffect`, never during render, or
  hydration mismatches.
- Device files are CRLF. Python string replacement fails unless normalized; the Edit
  tool handles it correctly.

---

## Other open threads (older, still unfinished)

1. **Manager price override writes back to inventory.** Per Joe: "the manager's
   override will change the inventory record unless further edited in inventory." The
   `sellPriceOverridden` flag on `InventoryItem` exists to make this enforceable, but
   the RO/invoice line override does not yet write back.
2. **Appointment on-the-fly purchases have no `scheduleEventId`** — an appointment has
   no id at booking time, so the usage record cannot be hung on the event. Known
   limitation, not yet addressed.
3. **Run `npx tsc --noEmit` locally.** Never once run. Worth doing before the next
   push.

---

## Recurring pattern worth knowing

This codebase repeatedly turned out to have **fully-built services with zero UI
wiring** — `inventory-locations.ts`, `invoice-generator.ts`,
`operational-dashboard-charts.ts`, `parts.ts`, `RepairOrderPartEntryForm`. The chart
system had a config layer and a renderer but **no data layer between them**, which is
why it had never been wired up. Before building something new, grep for it first; it
may already exist.
