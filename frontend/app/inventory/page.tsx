import Link from "next/link";

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";
const headerClass =
  "mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const cardGridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";
const cardClass =
  "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-400 hover:shadow-md";
const cardTitleClass = "text-xl font-black text-black";
const cardDescriptionClass = "mt-2 text-sm font-semibold text-zinc-600";
const cardActionClass =
  "mt-4 inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-black shadow-sm transition hover:bg-zinc-50";

const inventoryCategories = [
  {
    title: "Inventory Items",
    description:
      "View and manage stocked parts, part numbers, quantities, pricing, minimum stock, bin locations, and required item photos.",
    href: "/inventory/items",
    action: "Open Inventory Items",
  },
  {
    title: "Inventory Receiving",
    description:
      "Receive purchase order parts into warehouse stock, truck stock, or custom receiving locations.",
    href: "/inventory/receiving",
    action: "Open Receiving",
  },
  {
    title: "Company Tools",
    description:
      "Track company-owned tools, serial numbers, assigned users, truck locations, repair status, and asset history.",
    href: "/inventory/company-tools",
    action: "Open Company Tools",
  },
  {
    title: "Inventory Transactions",
    description:
      "Review part movements, quantity adjustments, stock usage, receiving events, correction history, and inventory discrepancies.",
    href: "/inventory/transactions",
    action: "Open Transactions",
  },
  {
    title: "Truck Stock",
    description:
      "Manage mobile inventory assigned to service trucks and field technicians.",
    href: "/truck-stock",
    action: "Open Truck Stock",
  },
  {
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
      <header data-t1eq-page-card="true" className={headerClass}>
        <p className="text-sm font-black uppercase tracking-wide text-zinc-500">
          Tier One Equipment
        </p>

        <h1 className="mt-2 text-4xl font-black text-black">Inventory</h1>

        <p className="mt-2 max-w-3xl text-base font-semibold text-zinc-600">
          Manage stocked parts, purchase order receiving, company tools,
          transactions, discrepancies, and truck stock from one inventory hub.
        </p>
      </header>

      <section data-t1eq-page-card="true" className={sectionClass}>
        <div className="mb-5">
          <h2 className="text-2xl font-black text-black">
            Inventory Categories
          </h2>

          <p className="mt-1 text-sm font-semibold text-zinc-600">
            Select an inventory area to open.
          </p>
        </div>

        <div data-t1eq-tile-grid="true" className={cardGridClass}>
          {inventoryCategories.map((category) => (
            <Link
              key={category.href}
              data-t1eq-tile="true"
              data-t1eq-page-card="true"
              href={category.href}
              className={cardClass}
            >
              <div className={cardTitleClass}>{category.title}</div>

              <div className={cardDescriptionClass}>
                {category.description}
              </div>

              <div className={cardActionClass}>{category.action}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}