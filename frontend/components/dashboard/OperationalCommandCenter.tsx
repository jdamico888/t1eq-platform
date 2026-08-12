import OperationsOverview from "@/components/dashboard/OperationsOverview";
import DispatchBoard from "@/components/dashboard/DispatchBoard";
import InspectionAlertPanel from "@/components/dashboard/InspectionAlertPanel";
import LowInventoryPanel from "@/components/dashboard/LowInventoryPanel";
import InvoiceAgingPanel from "@/components/dashboard/InvoiceAgingPanel";
import TechnicianStatusPanel from "@/components/dashboard/TechnicianStatusPanel";
import RevenueOverviewPanel from "@/components/dashboard/RevenueOverviewPanel";

import { DispatchJob } from "@/types/dispatch-job";
import { Inspection } from "@/types/inspection";
import { InventoryItem } from "@/types/inventory-item";
import { Invoice } from "@/types/invoice";
import { Technician } from "@/types/technician";

type OperationalCommandCenterProps = {
  activeRepairOrders: number;
  dispatchJobs: DispatchJob[];
  inspections: Inspection[];
  inventoryItems: InventoryItem[];
  invoices: Invoice[];
  technicians: Technician[];
};

export default function OperationalCommandCenter({
  activeRepairOrders,
  dispatchJobs,
  inspections,
  inventoryItems,
  invoices,
  technicians,
}: OperationalCommandCenterProps) {
  const activeDispatchJobs = dispatchJobs.filter(
    (job) => job.status !== "Completed" && job.status !== "Cancelled"
  );

  const pendingInspections = inspections.filter(
    (inspection) => inspection.status !== "Passed" && inspection.status !== "Cancelled"
  );

  const lowInventoryItems = inventoryItems.filter(
    (item) =>
      typeof item.minimumQuantity === "number" &&
      item.quantityOnHand <= item.minimumQuantity
  );

  const overdueInvoices = invoices.filter(
    (invoice) => invoice.status === "Overdue"
  );

  const openInvoices = invoices.filter(
    (invoice) =>
      invoice.status === "Open" ||
      invoice.status === "Partial" ||
      invoice.status === "Overdue"
  );

  const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid");

  const outstandingRevenue = openInvoices.reduce(
    (total, invoice) => total + invoice.totalAmount,
    0
  );

  const paidRevenue = paidInvoices.reduce(
    (total, invoice) => total + invoice.totalAmount,
    0
  );

  const techniciansOnline = technicians.filter(
    (technician) => technician.status === "Active"
  );

  return (
    <div className="space-y-6">
      <OperationsOverview
        activeRepairOrders={activeRepairOrders}
        pendingInspections={pendingInspections.length}
        activeDispatchJobs={activeDispatchJobs.length}
        overdueInvoices={overdueInvoices.length}
        lowInventoryItems={lowInventoryItems.length}
        techniciansOnline={techniciansOnline.length}
      />

      <RevenueOverviewPanel
        monthlyRevenue={paidRevenue}
        outstandingRevenue={outstandingRevenue}
        paidRevenue={paidRevenue}
        invoiceCount={invoices.length}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <DispatchBoard
          jobs={activeDispatchJobs.map((job) => ({
            id: job.id,
            repairOrderNumber: job.repairOrderNumber,
            customerName: job.customerName,
            technicianName: job.technicianName,
            status: job.status,
            scheduledStart: job.scheduledStart,
          }))}
        />

        <InspectionAlertPanel
          inspections={pendingInspections.map((inspection) => ({
            id: inspection.id,
            inspectionNumber: inspection.inspectionNumber,
            customerName: inspection.customerName,
            equipmentName: inspection.equipmentName,
            status: inspection.status,
            nextInspectionDate: inspection.nextInspectionDate,
          }))}
        />

        <LowInventoryPanel
          items={lowInventoryItems.map((item) => ({
            id: item.id,
            partNumber: item.partNumber,
            name: item.name,
            quantityOnHand: item.quantityOnHand,
            minimumQuantity: item.minimumQuantity,
            location: item.location,
          }))}
        />

        <InvoiceAgingPanel
          invoices={openInvoices.map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
            dueDate: invoice.dueDate,
          }))}
        />

        <TechnicianStatusPanel
          technicians={technicians.map((technician) => ({
            id: technician.id,
            technicianName: `${technician.firstName} ${technician.lastName}`,
            status: technician.status,
            activeJobs: activeDispatchJobs.filter(
              (job) => job.technicianId === technician.id
            ).length,
            certifications: technician.certifications.length,
          }))}
        />
      </div>
    </div>
  );
}