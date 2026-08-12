import type { RepairOrder } from "@/types/repair-order";

const now = new Date().toISOString();

export const repairOrders: RepairOrder[] = [
  {
    id: "ro-demo-001",
    ro: "RO-DEMO-001",
    repairOrderNumber: "RO-DEMO-001",

    customerId: "customer-demo-001",
    customerName: "Demo Customer",
    customerSnapshot: {
      customerId: "customer-demo-001",
      customerName: "Demo Customer",
      serviceAddress: "",
    },

    siteId: "",
    siteName: "",

    equipmentId: "equipment-demo-001",
    equipmentName: "Demo Equipment",
    equipmentDescription: "",
    equipmentSnapshot: {
      equipmentId: "equipment-demo-001",
      equipmentName: "Demo Equipment",
      equipmentDescription: "",
      locationName: "",
    },

    complaint: "Demo repair order.",
    customerConcern: "Demo repair order.",

    actionItems: [],
    laborEntries: [],
    partEntries: [],
    photos: [],

    status: "Open",
    priority: "Normal",

    openedDate: now,
    createdDate: now,

    modelSerialPhotoRequired: true,
    modelSerialPhotoCaptured: false,

    subtotalLabor: 0,
    subtotalParts: 0,
    subtotalOther: 0,
    totalAmount: 0,
  },
];

export default repairOrders;