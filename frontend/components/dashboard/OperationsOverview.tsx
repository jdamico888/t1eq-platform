import KpiCard from "@/components/ui/KpiCard";

type OperationsOverviewProps = {
  activeRepairOrders: number;

  pendingInspections: number;

  activeDispatchJobs: number;

  overdueInvoices: number;

  lowInventoryItems: number;

  techniciansOnline: number;
};

export default function OperationsOverview({
  activeRepairOrders,
  pendingInspections,
  activeDispatchJobs,
  overdueInvoices,
  lowInventoryItems,
  techniciansOnline,
}: OperationsOverviewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <KpiCard
        label="Open Repair Orders"
        value={activeRepairOrders}
        subtitle="Current workload"
      />

      <KpiCard
        label="Pending Inspections"
        value={pendingInspections}
        subtitle="Requires attention"
      />

      <KpiCard
        label="Active Dispatch"
        value={activeDispatchJobs}
        subtitle="Field service activity"
      />

      <KpiCard
        label="Overdue Invoices"
        value={overdueInvoices}
        trend={
          overdueInvoices > 0
            ? "down"
            : "neutral"
        }
        subtitle="Collections tracking"
      />

      <KpiCard
        label="Low Inventory"
        value={lowInventoryItems}
        trend={
          lowInventoryItems > 0
            ? "down"
            : "neutral"
        }
        subtitle="Restock needed"
      />

      <KpiCard
        label="Technicians Online"
        value={techniciansOnline}
        trend="up"
        subtitle="Available workforce"
      />
    </div>
  );
}