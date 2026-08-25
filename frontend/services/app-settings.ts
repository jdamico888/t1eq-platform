import type { MarkupTier } from "@/types/pricing";

export const APP_SETTINGS_UPDATED_EVENT =
  "t1eq-app-settings-updated";

export type AppSettings = {
  companyName: string;

  laborRate: number;

  taxRate: number;

  /**
   * The general markup, as a percentage (35 means cost + 35%). Always in
   * force — it covers any cost the bands below do not.
   */
  partsMarkupPercent: number;

  /**
   * Optional non-overlapping cost bands that override the general markup
   * within their range. Empty means the general markup covers everything.
   */
  partsMarkupTiers: MarkupTier[];

  /**
   * Stocking threshold — when a part nobody stocks has been bought often
   * enough to be worth keeping on the shelf. Usage is counted over
   * stockingLookbackDays, and EITHER measure crossing the line is enough to
   * raise a suggestion:
   *
   *  - stockingThresholdJobs: how many separate jobs used it
   *  - stockingThresholdQuantity: how many pieces were used in total
   *
   * Set one of them very high to judge on the other alone.
   */
  stockingThresholdJobs: number;
  stockingThresholdQuantity: number;
  stockingLookbackDays: number;

  /**
   * Restocking defaults applied to newly stocked parts. Per-item values on
   * the inventory record always win once set; these only decide where a
   * brand-new item starts.
   */
  defaultMinimumStock: number;
  defaultIdealStock: number;

  /**
   * Whether a special-order part must be paid for before it is ordered.
   * The shop is out of pocket from the moment it orders a part it does
   * not stock, so this is on by default.
   */
  specialOrderRequiresPrepayment: boolean;

  currency: string;

  timezone: string;

  logoPath: string;

  wallpaperPath: string;

  inspectionLaborRate: number;

  defaultInvoiceTerms: string;

  defaultTechnicianColor: string;

  enableInventoryTracking: boolean;

  enableDispatchScheduling: boolean;

  enableInspectionModule: boolean;
};

const STORAGE_KEY = "t1eq-app-settings";

export const defaultAppSettings: AppSettings = {
  companyName: "Tier 1 Equipment",

  laborRate: 165,

  taxRate: 0.04712,

  partsMarkupPercent: 35,

  /**
   * Empty by default: the general markup covers every part until cost bands
   * are added in Setup → Parts.
   */
  partsMarkupTiers: [],

  stockingThresholdJobs: 3,
  stockingThresholdQuantity: 10,
  stockingLookbackDays: 180,

  specialOrderRequiresPrepayment: true,

  defaultMinimumStock: 1,
  defaultIdealStock: 3,

  currency: "USD",

  timezone: "America/Chicago",

  logoPath: "",

  wallpaperPath: "",

  inspectionLaborRate: 185,

  defaultInvoiceTerms:
    "Payment due upon completion.",

  defaultTechnicianColor: "#2563eb",

  enableInventoryTracking: true,

  enableDispatchScheduling: true,

  enableInspectionModule: true,
};

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultAppSettings;
  }

  const savedSettings =
    localStorage.getItem(STORAGE_KEY);

  if (!savedSettings) {
    return defaultAppSettings;
  }

  return {
    ...defaultAppSettings,
    ...JSON.parse(savedSettings),
  };
}

export function saveAppSettings(
  settings: AppSettings
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(settings)
  );

  window.dispatchEvent(
    new CustomEvent(
      APP_SETTINGS_UPDATED_EVENT
    )
  );
}

export function resetAppSettings() {
  saveAppSettings(defaultAppSettings);
}