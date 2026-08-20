export type PermissionFunctionCategory =
  | "Repair Order Workflow"
  | "Estimates & Billing"
  | "Payments"
  | "Job Management";

export type PermissionFunctionKey =
  | "viewFinancials"
  | "editRoStatus"
  | "holdAuth"
  | "resumeHold"
  | "markComplete"
  | "reopenRo"
  | "sendEstimateDirect"
  | "approveEstimates"
  | "editCharges"
  | "applyDiscounts"
  | "receivePayment"
  | "issueReceipt"
  | "refundAdjust"
  | "createJob"
  | "assignTechnician"
  | "cancelDeleteRo";

export type PermissionFunction = {
  key: PermissionFunctionKey;
  category: PermissionFunctionCategory;
  label: string;
  description: string;
};

/**
 * The full, canonical list of app functions that can be exposed or hidden
 * per role. This list is expected to grow as more screens are built (see
 * addFutureCategory below for how to extend it) — Accounting functions in
 * particular are intentionally not modeled yet, per direction to add them
 * once the accounting module exists.
 */
export const PERMISSION_FUNCTIONS: PermissionFunction[] = [
  {
    key: "viewFinancials",
    category: "Repair Order Workflow",
    label: "View Financial Totals",
    description: "See labor, parts, and subtotal amounts on repair orders.",
  },
  {
    key: "editRoStatus",
    category: "Repair Order Workflow",
    label: "Edit RO Status",
    description: "Change a repair order's workflow status directly.",
  },
  {
    key: "holdAuth",
    category: "Repair Order Workflow",
    label: "Place Item On Hold",
    description:
      "Put an action item on hold (parts on order, estimate sent, research needed).",
  },
  {
    key: "resumeHold",
    category: "Repair Order Workflow",
    label: "Approve / Resume From Hold",
    description: "Clear a hold and resume work on an item.",
  },
  {
    key: "markComplete",
    category: "Repair Order Workflow",
    label: "Mark RO Complete",
    description: "Finalize a repair order as complete.",
  },
  {
    key: "reopenRo",
    category: "Repair Order Workflow",
    label: "Reopen Completed RO",
    description: "Edit a repair order after it has been marked complete.",
  },
  {
    key: "sendEstimateDirect",
    category: "Estimates & Billing",
    label: "Send Estimate Directly to Customer",
    description: "Email the estimate/invoice to the customer without review.",
  },
  {
    key: "approveEstimates",
    category: "Estimates & Billing",
    label: "Approve & Send Estimates (Review Queue)",
    description: "Review and send estimates submitted by others for approval.",
  },
  {
    key: "editCharges",
    category: "Estimates & Billing",
    label: "Edit Parts & Labor Charges",
    description: "Change pricing on parts and labor line items.",
  },
  {
    key: "applyDiscounts",
    category: "Estimates & Billing",
    label: "Apply Discounts",
    description: "Reduce a customer's total charge.",
  },
  {
    key: "receivePayment",
    category: "Payments",
    label: "Receive Customer Payment",
    description: "Take payment from a customer.",
  },
  {
    key: "issueReceipt",
    category: "Payments",
    label: "Issue Receipt",
    description: "Generate and send a payment receipt.",
  },
  {
    key: "refundAdjust",
    category: "Payments",
    label: "Refund / Adjust Invoice",
    description: "Issue a refund or adjust an invoiced amount.",
  },
  {
    key: "createJob",
    category: "Job Management",
    label: "Create New Repair Order / Job",
    description: "Start a new repair order for a customer.",
  },
  {
    key: "assignTechnician",
    category: "Job Management",
    label: "Assign Technician to Job",
    description: "Assign or reassign who is dispatched to a job.",
  },
  {
    key: "cancelDeleteRo",
    category: "Job Management",
    label: "Cancel / Delete Repair Order",
    description: "Cancel or permanently remove a repair order.",
  },
];

export const PERMISSION_FUNCTION_KEYS: PermissionFunctionKey[] =
  PERMISSION_FUNCTIONS.map((permissionFunction) => permissionFunction.key);

export const PERMISSION_FUNCTION_CATEGORIES: PermissionFunctionCategory[] = [
  "Repair Order Workflow",
  "Estimates & Billing",
  "Payments",
  "Job Management",
];

export type Role = {
  id: string;
  name: string;
  /**
   * A locked role always has every function enabled and can't be edited or
   * removed — the safety rail so an owner/admin can never accidentally hide
   * their own access.
   */
  isLocked?: boolean;
};

export type RolePermissionMap = Partial<Record<PermissionFunctionKey, boolean>>;

export type RolePermissions = Record<string, RolePermissionMap>;

export type OperatingModelId =
  | "soloOperator"
  | "ownerController"
  | "ownerManagers";

export type OperatingModelRoleSeed = {
  name: string;
  keys: PermissionFunctionKey[];
  locked?: boolean;
};

export type OperatingModel = {
  id: OperatingModelId;
  title: string;
  description: string;
  roles: OperatingModelRoleSeed[];
};

export const FULL_ACCESS_KEYS: PermissionFunctionKey[] = PERMISSION_FUNCTION_KEYS;

export const CREW_TECHNICIAN_KEYS: PermissionFunctionKey[] = [
  "editRoStatus",
  "holdAuth",
  "markComplete",
];

export const MANAGER_FOREMAN_KEYS: PermissionFunctionKey[] = [
  "viewFinancials",
  "editRoStatus",
  "holdAuth",
  "resumeHold",
  "markComplete",
  "approveEstimates",
  "editCharges",
  "createJob",
  "assignTechnician",
];

export const OPERATING_MODELS: OperatingModel[] = [
  {
    id: "soloOperator",
    title: "Owner/Operator",
    description: "No employees — the owner handles everything from A to Z.",
    roles: [
      { name: "Owner/Operator", keys: FULL_ACCESS_KEYS, locked: true },
    ],
  },
  {
    id: "ownerController",
    title: "Owner/Controller",
    description:
      "Owner controls the business — everything except hands-on repairs, unless they choose to step in.",
    roles: [
      { name: "Owner/Controller", keys: FULL_ACCESS_KEYS, locked: true },
      { name: "Technician", keys: CREW_TECHNICIAN_KEYS },
    ],
  },
  {
    id: "ownerManagers",
    title: "Owner + Managers",
    description:
      "Owner oversees operations; managers/foremen run crews with access to allowed financial areas.",
    roles: [
      { name: "Owner", keys: FULL_ACCESS_KEYS, locked: true },
      { name: "Manager / Foreman", keys: MANAGER_FOREMAN_KEYS },
      { name: "Technician", keys: CREW_TECHNICIAN_KEYS },
    ],
  },
];

export type RolePermissionsSettings = {
  roles: Role[];
  permissions: RolePermissions;
  selectedModelId: OperatingModelId | null;
  updatedDate?: string;
};

/**
 * A deterministic (non-random) fallback used only for server-side rendering
 * and as a last resort if localStorage is unavailable. The real, persisted
 * settings are seeded from the "Owner + Managers" operating model the first
 * time getRolePermissionsSettings() runs in the browser — see
 * services/role-permissions.ts.
 */
export const defaultRolePermissionsSettings: RolePermissionsSettings = {
  roles: [],
  permissions: {},
  selectedModelId: null,
};
