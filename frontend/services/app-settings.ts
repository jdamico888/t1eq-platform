export const APP_SETTINGS_UPDATED_EVENT =
  "t1eq-app-settings-updated";

export type AppSettings = {
  companyName: string;

  laborRate: number;

  taxRate: number;

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