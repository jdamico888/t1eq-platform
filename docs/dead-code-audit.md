# T1EQ Frontend — Dead Code Audit

Generated 2026-08-25. Every finding below was resolved through actual import
statements (both `@/` aliases and relative paths), not by name matching.

| | |
|---|---|
| Components nothing imports | **80 files, 6746 lines** |
| Routes nothing links to | **2 pages, 535 lines** |
| Duplicated component names | **11** |
| Exported service functions never called | **165** |

---

## 1. The component tree exists twice

`app/components/` and `components/` are parallel libraries with overlapping
names. This is the root cause of most of the rest: a component gets written
in one tree, a later page imports the other copy, and the first is stranded.

Worth fixing first — the file counts below shrink on their own once it is.

| Component | Copy | Imported by |
|---|---|---|
| `AppShell.tsx` | `components/navigation/AppShell.tsx` | **dead** |
| `AppShell.tsx` | `components/layout/AppShell.tsx` | **dead** |
| `CustomerSelector.tsx` | `components/selectors/CustomerSelector.tsx` | **dead** |
| `CustomerSelector.tsx` | `components/forms/CustomerSelector.tsx` | 2 file(s) |
| `DataTable.tsx` | `app/components/ui/DataTable.tsx` | **dead** |
| `DataTable.tsx` | `components/ui/DataTable.tsx` | 9 file(s) |
| `EmptyState.tsx` | `app/components/ui/EmptyState.tsx` | 8 file(s) |
| `EmptyState.tsx` | `components/ui/EmptyState.tsx` | **dead** |
| `EquipmentSelector.tsx` | `components/selectors/EquipmentSelector.tsx` | **dead** |
| `EquipmentSelector.tsx` | `components/forms/EquipmentSelector.tsx` | **dead** |
| `Modal.tsx` | `app/components/ui/Modal.tsx` | 2 file(s) |
| `Modal.tsx` | `components/ui/Modal.tsx` | **dead** |
| `PageContainer.tsx` | `app/components/layout/PageContainer.tsx` | 8 file(s) |
| `PageContainer.tsx` | `components/layout/PageContainer.tsx` | 11 file(s) |
| `PageHeader.tsx` | `app/components/ui/PageHeader.tsx` | **dead** |
| `PageHeader.tsx` | `components/ui/PageHeader.tsx` | 3 file(s) |
| `SearchInput.tsx` | `components/ui/SearchInput.tsx` | **dead** |
| `SearchInput.tsx` | `components/forms/SearchInput.tsx` | 3 file(s) |
| `SiteSelector.tsx` | `components/selectors/SiteSelector.tsx` | **dead** |
| `SiteSelector.tsx` | `components/forms/SiteSelector.tsx` | 1 file(s) |
| `StatusBadge.tsx` | `app/components/ui/StatusBadge.tsx` | 4 file(s) |
| `StatusBadge.tsx` | `components/ui/StatusBadge.tsx` | 16 file(s) |

**`StatusBadge` is the clearest case:** both copies are live. Pages under
`app/` import `../components/ui/StatusBadge`; the table components import
`@/components/ui/StatusBadge`. Two implementations of the same badge, both
shipping, free to drift apart.


---

## 2. Routes nothing links to

| Route | File | Lines |
|---|---|---|
| `/sites` | `app/sites/page.tsx` | 333 |
| `/analytics/technicians` | `app/analytics/technicians/page.tsx` | 202 |

Neither is reachable by clicking. `/sites` also holds the only live use of
`components/forms/CustomerSelector` and `components/forms/SiteSelector` — if
the page goes, those follow it.


---

## 3. Components nothing imports

Safe to delete. Grouped by folder; a folder that is entirely dead is marked.


### `components/ui/` — 28 of 34 files, 1188 lines

- `ActivityFeed.tsx` (117 lines)
- `Badge.tsx` (46 lines)
- `CommandBar.tsx` (33 lines)
- `ConfirmDialog.tsx` (63 lines)
- `DetailSection.tsx` (31 lines)
- `Drawer.tsx` (71 lines)
- `EmptyState.tsx` (23 lines)
- `FilterBar.tsx` (15 lines)
- `GlassCard.tsx` (18 lines)
- `InfoCard.tsx` (38 lines)
- `InfoGrid.tsx` (32 lines)
- `KeyValueRow.tsx` (22 lines)
- `KpiCard.tsx` (66 lines)
- `LoadingState.tsx` (19 lines)
- `MetricPanel.tsx` (38 lines)
- `Modal.tsx` (214 lines)
- `Panel.tsx` (27 lines)
- `Pill.tsx` (27 lines)
- `PrimaryButton.tsx` (23 lines)
- `SearchInput.tsx` (24 lines)
- `SecondaryButton.tsx` (23 lines)
- `SectionTitle.tsx` (33 lines)
- `Separator.tsx` (13 lines)
- `StatCard.tsx` (33 lines)
- `TabBar.tsx` (50 lines)
- `TimelineCard.tsx` (63 lines)
- `Toolbar.tsx` (13 lines)
- `ToolbarGroup.tsx` (13 lines)

### `components/dashboard/` — 15 of 19 files, 1148 lines

- `ActiveInspectionsPanel.tsx` (87 lines)
- `BusinessSnapshotPanel.tsx` (98 lines)
- `DashboardStatGrid.tsx` (28 lines)
- `ExecutiveSummaryPanel.tsx` (121 lines)
- `LiveActivityTicker.tsx` (56 lines)
- `OpenRepairOrdersPanel.tsx` (111 lines)
- `OperationsHero.tsx` (105 lines)
- `QuickActions.tsx` (34 lines)
- `QuickCreatePanel.tsx` (51 lines)
- `RecentActivityCard.tsx` (55 lines)
- `RecentCustomersPanel.tsx` (81 lines)
- `RecentEquipmentPanel.tsx` (81 lines)
- `ServiceSchedulePanel.tsx` (92 lines)
- `SystemHealthPanel.tsx` (72 lines)
- `UpcomingServicePanel.tsx` (76 lines)

### `components/tables/` — 7 of 10 files, 928 lines

- `DispatchTable.tsx` (129 lines)
- `InspectionTable.tsx` (111 lines)
- `InventoryTable.tsx` (166 lines)
- `InvoiceTable.tsx` (172 lines)
- `PurchaseOrderTable.tsx` (71 lines)
- `RepairOrderTable.tsx` (148 lines)
- `SupplierTable.tsx` (131 lines)

### `app/components/repair-orders/` — 3 of 3 files, 852 lines — **entire folder is dead**

- `AddEquipmentModal.tsx` (105 lines)
- `AddPartModal.tsx` (360 lines)
- `CreateROModal.tsx` (387 lines)

### `app/components/invoices/` — 1 of 1 files, 561 lines — **entire folder is dead**

- `CreateInvoiceModal.tsx` (561 lines)

### `components/forms/` — 9 of 26 files, 499 lines

- `CurrencyInput.tsx` (62 lines)
- `DateInput.tsx` (44 lines)
- `EquipmentSelector.tsx` (74 lines)
- `FormModal.tsx` (70 lines)
- `NumberInput.tsx` (63 lines)
- `PrioritySelector.tsx` (47 lines)
- `StatusSelector.tsx` (43 lines)
- `SupplierSelector.tsx` (44 lines)
- `YesNoSelector.tsx` (52 lines)

### `components/repair-orders/` — 1 of 23 files, 376 lines

- `repair-order-action-item-detail-modal.tsx` (376 lines)

### `components/selectors/` — 3 of 3 files, 336 lines — **entire folder is dead**

- `CustomerSelector.tsx` (91 lines)
- `EquipmentSelector.tsx` (130 lines)
- `SiteSelector.tsx` (115 lines)

### `components/layout/` — 6 of 11 files, 318 lines

- `AppShell.tsx` (63 lines)
- `DetailPageLayout.tsx` (44 lines)
- `FormPageLayout.tsx` (31 lines)
- `MetricGrid.tsx` (30 lines)
- `MobileSidebar.tsx` (108 lines)
- `Sidebar.tsx` (42 lines)

### `app/components/inspections/` — 1 of 1 files, 292 lines — **entire folder is dead**

- `CreateInspectionModal.tsx` (292 lines)

### `app/components/ui/` — 5 of 16 files, 190 lines

- `DataTable.tsx` (59 lines)
- `DataTableCell.tsx` (30 lines)
- `DataTableRow.tsx` (31 lines)
- `PageHeader.tsx` (48 lines)
- `PrintButton.tsx` (22 lines)

### `components/navigation/` — 1 of 2 files, 58 lines

- `AppShell.tsx` (58 lines)

---

## 4. Exported service functions nobody calls

Weaker signal than the rest, and listed last for that reason: a service
exposing `getById` and `search` is normal even before anything calls them.
But the volume is the point — most of these are CRUD surface written up front
for screens that were built a different way, and every one is code that has
never run.

| Service | Uncalled exports | Names |
|---|---|---|
| `services/repair-orders.ts` | 14 | `saveRepairOrders`, `getRepairOrderById`, `getRepairOrderByNumber`, `getRepairOrdersByEquipment`, `searchRepairOrders`, `getOpenRepairOrders`, `getCompletedRepairOrders`, `addRepairOrderActionItem`, `updateRepairOrderActionItem`, `removeRepairOrderActionItem`, `addRepairOrderPhoto`, `addRepairOrderLaborEntry`, `completeRepairOrder`, `cancelRepairOrder` |
| `services/repair-order-financials.ts` | 12 | `createEmptyRepairOrderBillingGroupTotals`, `calculateRepairOrderActionItemFinancials`, `getRepairOrderBillingGroupTotals`, `calculateRepairOrderFinancials`, `getRepairOrderFinancials`, `getRepairOrderFinancialSummary`, `calculateRepairOrderTotals`, `getRepairOrderSubtotal`, `getRepairOrderTotal`, `getRepairOrderLaborTotal`, `getRepairOrderPartsTotal`, `getRepairOrderOtherTotal` |
| `services/part-entries.ts` | 10 | `getPartEntries`, `savePartEntries`, `createPartEntry`, `updatePartEntry`, `deletePartEntry`, `getPartEntryById`, `getPartEntriesByActionItem`, `getPartEntriesByRepairOrder`, `getTotalPartsRevenue`, `getTotalPartsCost` |
| `services/inspections.ts` | 9 | `saveInspections`, `generateInspectionNumber`, `updateInspection`, `deleteInspection`, `getInspectionById`, `getInspectionByNumber`, `getInspectionsByCustomerId`, `getInspectionsByEquipmentId`, `searchInspections` |
| `services/purchase-orders.ts` | 7 | `calculatePurchaseOrderTotals`, `savePurchaseOrders`, `generatePurchaseOrderNumber`, `getPurchaseOrderById`, `getPurchaseOrderByNumber`, `getPurchaseOrdersBySupplierId`, `searchPurchaseOrders` |
| `services/action-items.ts` | 6 | `createActionItem`, `updateActionItem`, `deleteActionItem`, `getActionItemById`, `getActionItemsByRepairOrder`, `getOpenActionItemsByRepairOrder` |
| `services/inventory-transactions.ts` | 6 | `getInventoryTransactions`, `saveInventoryTransactions`, `createInventoryTransaction`, `getTransactionsByInventoryItem`, `getTransactionsByReference`, `deleteInventoryTransaction` |
| `services/invoices.ts` | 6 | `saveInvoices`, `deleteInvoice`, `getInvoiceById`, `getInvoiceByNumber`, `getInvoicesByCustomerId`, `searchInvoices` |
| `services/employee-schedule.ts` | 5 | `getEmployeeScheduleStore`, `saveEmployeeScheduleStore`, `calculateEmployeeVacationBalance`, `getEmployeeDailyAvailabilitySnapshot`, `getAvailableEmployeeProfileIdsForWindow` |
| `services/site.ts` | 5 | `saveSites`, `getSiteById`, `getSitesByCustomerId`, `getSitesByCustomer`, `searchSites` |
| `services/company-tools.ts` | 5 | `saveCompanyTools`, `generateCompanyToolAssetNumber`, `getCompanyToolById`, `getCompanyToolsByStatus`, `searchCompanyTools` |
| `services/repair-order-scheduling.ts` | 5 | `getUnscheduledRepairOrders`, `getRepairOrdersScheduledForDate`, `getRepairOrdersByScheduledTechnician`, `getRepairOrdersByScheduledTruck`, `getRepairOrderScheduleItems` |
| `services/appearance-settings.ts` | 5 | `getQBitScopeById`, `getOutputTemplateSettings`, `saveOutputTemplateSettings`, `getAdvertisingBlocks`, `saveAdvertisingBlock` |
| `services/technician-profiles.ts` | 5 | `normalizeTechnicianProfile`, `saveTechnicianProfiles`, `getTechnicianProfileByDisplayName`, `searchTechnicianProfiles`, `seedTechnicianProfile` |
| `services/users.ts` | 4 | `saveUsers`, `deleteUser`, `getUserById`, `getUsersByRole` |
| `services/suppliers.ts` | 4 | `saveSuppliers`, `deleteSupplier`, `getSupplierById`, `searchSuppliers` |
| `services/inventory.ts` | 4 | `deleteInventoryItem`, `searchInventoryItems`, `adjustInventoryQuantity`, `setInventoryQuantity` |
| `services/tile-canvas.ts` | 4 | `placementsOverlap`, `findBuriedTileIds`, `findFreeSlot`, `pixelsToCell` |
| `services/equipment-models.ts` | 4 | `saveEquipmentModels`, `deleteEquipmentModel`, `getEquipmentModelById`, `searchEquipmentModels` |
| `services/part-usage.ts` | 4 | `getPartUsage`, `getPartUsageByPartNumber`, `getPartUsageByRepairOrderId`, `getPartSalesSummary` |
| `services/equipmentMetadata.ts` | 4 | `getCustomManufacturers`, `addCustomManufacturer`, `getCustomCategories`, `addCustomCategory` |
| `services/pricing.ts` | 3 | `findMarkupTierForCost`, `calculateSellPriceFromCost`, `getPartsMarkupPercent` |
| `services/operational-dashboard-charts.ts` | 3 | `saveOperationalDashboardCharts`, `getOperationalDashboardChartById`, `buildOperationalDashboardChartDefinition` |
| `services/invoice-generator.ts` | 3 | `createInvoiceFromRepairOrder`, `buildInvoiceFromRepairOrder`, `generateInvoice` |
| `services/role-permissions.ts` | 3 | `buildSettingsFromModel`, `getRoleByName`, `getRoleById` |
| `services/settings.ts` | 2 | `getSettings`, `saveSettings` |
| `services/special-order-parts.ts` | 2 | `isSpecialOrderPartEntry`, `getScheduleEventSpecialOrderParts` |
| `services/technicians.ts` | 2 | `generateEmployeeId`, `searchTechnicians` |
| `services/equipment.ts` | 2 | `getEquipmentBySiteId`, `searchEquipment` |
| `services/customers.ts` | 2 | `saveCustomers`, `searchCustomers` |
| `services/parts.ts` | 2 | `getParts`, `saveParts` |
| `services/schedule-events.ts` | 2 | `getTodayScheduleEvents`, `getUpcomingScheduleEvents` |
| `services/inventory-discrepancies.ts` | 2 | `saveInventoryDiscrepancies`, `getInventoryDiscrepanciesByPartNumber` |
| `services/inventory-locations.ts` | 2 | `getStoredInventoryLocations`, `saveStoredInventoryLocations` |
| `services/organization.ts` | 2 | `getOrganization`, `saveOrganization` |
| `services/app-settings.ts` | 1 | `resetAppSettings` |
| `services/auth.ts` | 1 | `getCurrentSessionTechnicianId` |
| `services/qbit-appearance.ts` | 1 | `getQBitStorageKey` |
| `services/invoice-editing.ts` | 1 | `getInvoiceEditStage` |
| `lib/ids.ts` | 1 | `createSequentialNumber` |

---

## Suggested order

1. **Delete the components nothing imports** (section 3). Purely additive safety —
   nothing references them, so nothing can break.
2. **Decide `/sites` and `/analytics/technicians`** (section 2). Either give them a
   route in, or remove them. They are 535 lines that no user can currently reach.
3. **Collapse the duplicated tree** (section 1). Pick one home per component,
   repoint imports, delete the loser. Do this after 1 so there is less to move.
4. **Leave section 4 alone** unless a service is being touched anyway. Deleting an
   unused `getById` buys little and costs a diff.

---

# Round 2 — 2026-08-25, after the 80-file deletion

Deleting the 80 components stranded more code behind them: a service whose only
caller was a deleted panel is now dead itself, and so is the type file only that
service imported. This round re-ran the same resolver over the tree as it stands
and walked outward from the Next.js route entry points instead of just counting
importers, which is a stricter test — a two-file cluster that imports only
itself has importers but is still unreachable.

| | |
|---|---|
| Files unreachable from any route | **32 files, 1605 lines** |
| Links pointing at routes that no longer exist | **2** |
| Same-name duplicates left | **1** (`StatusBadge`) |
| Files left in the tree | **199, all reachable** |

## 2.1 Two links that 404

Both were collateral from earlier deletions, and both are things a person can
click today.

- **`app/page.tsx` — the "Users" category tile** pointed at `/users`, a route
  that no longer exists. Repointed to `/employees`, which is where those records
  are actually created and edited. Its metric read `localStorage["t1eq-users"]`,
  the store that went away with `services/users.ts`, so it displayed `0` on every
  dashboard; it now reads `t1eq-technician-profiles` like the rest of the app.
  The tile's `id` stayed `"users"` on purpose — that id is the key for saved tile
  arrangements and Q-Bit appearance overrides, and renaming it would orphan both.
- **`components/tables/SiteTable.tsx`** linked each site name to
  `/sites/${site.id}`. Customers and Equipment have detail routes; Sites does
  not. The name is now plain text, and the row's existing Edit button is how a
  site is opened.

## 2.2 PageContainer collapsed

The two copies were the same component with one difference: the `app/` copy
added `min-h-screen p-6`. They are now one file, `components/layout/PageContainer.tsx`,
with a `padded` prop defaulting to `true`. The seven pages that used the padded
copy get identical output; `ListPageLayout` passes `padded={false}` because its
content already sits inside a padded card.

## 2.3 StatusBadge is NOT a duplicate — it needs a decision

These two share a name and nothing else, so they cannot be merged mechanically:

| | `components/ui/StatusBadge.tsx` | `app/components/ui/StatusBadge.tsx` |
|---|---|---|
| Props | `status: string` | `label: string`, `tone?: StatusTone` |
| Tone | derived inside, from the string | passed in by the caller |
| Palette | dark — `*-500/15` on `*-300` text | light — `*-500/20` on `*-900` text |
| Q-Bit targeting | none | `qbitId` / `qbitScope` |
| Used by | CustomerTable, EquipmentTable, SiteTable | dispatch, scheduling, suppliers |

Merging means picking one palette, which changes how badges look on three pages
either way. That is a design call, not a cleanup. Left alone deliberately.

## 2.4 What was unreachable

Nothing here had a live caller. Full list in `docs/dead-code-paths-2.txt`.

| Cluster | Files | Why it died |
|---|---|---|
| The old app shell — `AppShell`, `AppBackground`, `SidebarHeader`, `SectionHeader`, `PageContainer` | 5 | `app/layout.tsx` inlines the shell now |
| Seed data — `data/*.ts` | 8 | Hardcoded demo records; real data is in localStorage |
| Superseded services — `action-items`, `part-entries`, `equipmentMetadata`, `equipmentService`, `inventory-transactions`, `organization`, `settings` | 7 | Replaced by `repair-orders.ts`, `equipment.ts`, `inventory-discrepancies.ts`, `app-settings.ts` |
| Their type files — `action-item`, `part-entry`, `inventory-transaction`, `organization`, `settings`, `field-work-session` | 6 | Imported only by the services above |
| Status constant lists — `constants/{dispatch,inspections,invoices,purchase-orders}.ts` | 4 | Each page defines its own now |
| `services/repair-order-field-workflow.ts` | 1 | **Nine exported functions with empty bodies.** Worth deleting rather than keeping: an import of `startFieldWorkSession` compiles and silently does nothing |
| `services/AddEquipmentModal.tsx` | 1 | Zero bytes |

## 2.5 Non-code cruft still on disk

Not deleted here, because none of it is code and some may be deliberate:

- **`frontend/mkdir/appearance/AppearanceThemeClient.tsx`** — a directory
  literally named `mkdir`, holding a stale copy of a component. Left behind by a
  shell command that ran in the wrong shape.
- **`frontend/5-29-26 Front End Recuced size.zip`** — a 1.5 MB archive committed
  into the repo.
- **Empty directories** — `app/components/{customers,equipment,shared}` and
  `app/sites/[id]`, left when their files were deleted. Git does not track empty
  directories, so these exist only on disk.

## 2.6 What is left

199 files, every one reachable from a route. The remaining structural oddity is
that `app/components/` is a second, older UI kit — `Card`, `MetricCard`,
`EmptyState`, `Field`, `Input`, `Select`, `Textarea`, `Button`, `ListCard`,
`Modal`, `StatusBadge` — used almost exclusively by eight legacy pages
(`analytics/technicians`, `customers/[id]`, `equipment/[id]`, `inspections/[id]`,
`dispatch`, `payroll`, `scheduling`, `suppliers`). It is not dead and it is not
duplicated; it is a different generation. Consolidating it means restyling those
eight pages onto the `components/ui` kit, which is a visible change, not a sweep.
