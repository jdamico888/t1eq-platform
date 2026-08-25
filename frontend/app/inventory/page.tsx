import AddItemButton from "@/components/inventory/AddItemButton";
import InventoryCategoryGrid, {
  type InventoryCategoryTile,
} from "@/components/inventory/InventoryCategoryGrid";

const QBIT_SCOPE = "inventory-hub";

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";
const headerClass =
  "mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const cardClass =
  "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-400 hover:shadow-md";
const cardTitleClass = "text-xl font-black text-black";
const cardDescriptionClass = "mt-2 text-sm font-semibold text-zinc-600";
const cardActionClass =
  "mt-4 inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-black shadow-sm transition hover:bg-zinc-50";

const inventoryCategories: InventoryCategoryTile[] = [
  {
    id: "items",
    title: "Inventory Items",
    description:
      "View and manage stocked parts, part numbers, quantities, pricing, minimum stock, bin locations, and required item photos.",
    href: "/inventory/items",
    action: "Open Inventory Items",
  },
  {
    id: "receiving",
    title: "Inventory Receiving",
    description:
      "Receive purchase order parts into warehouse stock, truck stock, or custom receiving locations.",
    href: "/inventory/receiving",
    action: "Open Receiving",
  },
  {
    id: "company-tools",
    title: "Company Tools",
    description:
      "Track company-owned tools, serial numbers, assigned users, truck locations, repair status, and asset history.",
    href: "/inventory/company-tools",
    action: "Open Company Tools",
  },
  {
    id: "transactions",
    title: "Inventory Transactions",
    description:
      "Review part movements, quantity adjustments, stock usage, receiving events, correction history, and inventory discrepancies.",
    href: "/inventory/transactions",
    action: "Open Transactions",
  },
  {
    id: "locations",
    title: "Inventory Locations",
    description:
      "Manage the Warehouse, additional warehouses, and other custom stock locations items can be assigned to.",
    href: "/inventory/locations",
    action: "Open Locations",
  },
  {
    id: "truck-stock",
    title: "Truck Stock",
    description:
      "Manage mobile inventory assigned to service trucks and field technicians.",
    href: "/truck-stock",
    action: "Open Truck Stock",
  },
  {
    id: "truck-stock-transactions",
    title: "Truck Stock Transactions",
    description:
      "Review truck stock transfers, replenishment, technician usage, and truck-level inventory movement.",
    href: "/truck-stock/transactions",
    action: "Open Truck Transactions",
  },
];

export default function InventoryPage() {
  return (
    <div className={pageClass}>
      <header
        data-t1eq-page-card="true"
        data-t1eq-qbit-type="page-card"
        data-t1eq-qbit-id="inventory-header"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className={headerClass}
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-zinc-500">
              Tier One Equipment
            </p>

            <h1
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-4xl font-black text-black"
            >
              Inventory
            </h1>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 max-w-3xl text-base font-semibold text-zinc-600"
            >
              Manage stocked parts, purchase order receiving, company tools,
              transactions, discrepancies, and truck stock from one inventory
              hub.
            </p>
          </div>

          <AddItemButton
            qbitId="inventory-hub-add-item"
            variant="light"
            label="+ Add Item"
          />
        </div>
      </header>

      <section
        data-t1eq-page-card="true"
        data-t1eq-qbit-type="page-card"
        data-t1eq-qbit-id="inventory-categories-section"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className={sectionClass}
      >
        <div className="mb-5">
          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="inventory-categories-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-2xl font-black text-black"
          >
            Inventory Categories
          </h2>

          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="inventory-categories-description"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-1 text-sm font-semibold text-zinc-600"
          >
            Select an inventory area to open. Drag to arrange, drag to the
            trash to remove, right-click to add back.
          </p>
        </div>

        <InventoryCategoryGrid
          categories={inventoryCategories}
          cardClassName={cardClass}
          cardTitleClassName={cardTitleClass}
          cardDescriptionClassName={cardDescriptionClass}
          cardActionClassName={cardActionClass}
          qbitScope={QBIT_SCOPE}
        />
      </section>
    </div>
  );
}