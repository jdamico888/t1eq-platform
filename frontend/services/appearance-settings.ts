import type {
  AppearanceSettings,
  AppFontFamily,
  AppFontSize,
  ThreeDEffectLevel,
  TileOrientation,
  TileSize,
} from "@/types/appearance-settings";

const STORAGE_KEY = "t1eq-appearance-settings";

export const defaultAppearanceSettings: AppearanceSettings = {
  logoUrl: "",

  tileOrientation: "Grid",
  tileSize: "Medium",

  fontFamily: "System",
  fontSize: "Medium",

  sidebarThreeDEffect: "Subtle",
  pageThreeDEffect: "Subtle",

  accentHue: 24,
  accentColor: "#e26209",

  tileBackgroundColor: "#ffffff",
  tileBorderColor: "#e4e4e7",

  sidebarBackgroundColor: "#09090b",
  pageBackgroundColor: "#f4f4f5",

  updatedDate: new Date().toISOString(),
};

export const tileOrientationOptions: TileOrientation[] = [
  "Grid",
  "List",
  "Compact",
];

export const tileSizeOptions: TileSize[] = ["Small", "Medium", "Large"];

export const fontFamilyOptions: AppFontFamily[] = [
  "System",
  "Inter",
  "Arial",
  "Georgia",
  "Courier New",
];

export const fontSizeOptions: AppFontSize[] = [
  "Small",
  "Medium",
  "Large",
  "Extra Large",
];

export const threeDEffectOptions: ThreeDEffectLevel[] = [
  "Off",
  "Subtle",
  "Medium",
  "Strong",
];

function dispatchAppearanceChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("t1eq-appearance-settings-changed"));
}

function normalizeAccentHue(value: unknown) {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    return defaultAppearanceSettings.accentHue;
  }

  return Math.min(360, Math.max(0, parsedValue));
}

function normalizeColor(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  return fallback;
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const normalizedHue = hue / 360;
  const normalizedSaturation = saturation / 100;
  const normalizedLightness = lightness / 100;

  if (normalizedSaturation === 0) {
    const grayValue = Math.round(normalizedLightness * 255)
      .toString(16)
      .padStart(2, "0");

    return `#${grayValue}${grayValue}${grayValue}`;
  }

  function hueToRgb(p: number, q: number, t: number) {
    let adjustedT = t;

    if (adjustedT < 0) {
      adjustedT += 1;
    }

    if (adjustedT > 1) {
      adjustedT -= 1;
    }

    if (adjustedT < 1 / 6) {
      return p + (q - p) * 6 * adjustedT;
    }

    if (adjustedT < 1 / 2) {
      return q;
    }

    if (adjustedT < 2 / 3) {
      return p + (q - p) * (2 / 3 - adjustedT) * 6;
    }

    return p;
  }

  const q =
    normalizedLightness < 0.5
      ? normalizedLightness * (1 + normalizedSaturation)
      : normalizedLightness +
        normalizedSaturation -
        normalizedLightness * normalizedSaturation;

  const p = 2 * normalizedLightness - q;

  const red = Math.round(hueToRgb(p, q, normalizedHue + 1 / 3) * 255);
  const green = Math.round(hueToRgb(p, q, normalizedHue) * 255);
  const blue = Math.round(hueToRgb(p, q, normalizedHue - 1 / 3) * 255);

  return `#${red.toString(16).padStart(2, "0")}${green
    .toString(16)
    .padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`;
}

function normalizeAppearanceSettings(
  settings: Partial<AppearanceSettings>
): AppearanceSettings {
  const normalizedAccentHue = normalizeAccentHue(settings.accentHue);
  const fallbackAccentColor = hslToHex(normalizedAccentHue, 92, 46);

  return {
    ...defaultAppearanceSettings,
    ...settings,

    logoUrl: settings.logoUrl ?? "",

    accentHue: normalizedAccentHue,

    accentColor: normalizeColor(
      settings.accentColor,
      fallbackAccentColor || defaultAppearanceSettings.accentColor
    ),

    tileBackgroundColor: normalizeColor(
      settings.tileBackgroundColor,
      defaultAppearanceSettings.tileBackgroundColor
    ),

    tileBorderColor: normalizeColor(
      settings.tileBorderColor,
      defaultAppearanceSettings.tileBorderColor
    ),

    sidebarBackgroundColor: normalizeColor(
      settings.sidebarBackgroundColor,
      defaultAppearanceSettings.sidebarBackgroundColor
    ),

    pageBackgroundColor: normalizeColor(
      settings.pageBackgroundColor,
      defaultAppearanceSettings.pageBackgroundColor
    ),

    updatedDate: settings.updatedDate ?? new Date().toISOString(),
  };
}

export function getAppearanceSettings(): AppearanceSettings {
  if (typeof window === "undefined") {
    return defaultAppearanceSettings;
  }

  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return defaultAppearanceSettings;
  }

  try {
    return normalizeAppearanceSettings(
      JSON.parse(storedValue) as Partial<AppearanceSettings>
    );
  } catch (error) {
    console.error("Failed to parse appearance settings.", error);

    return defaultAppearanceSettings;
  }
}

export function saveAppearanceSettings(
  settings: AppearanceSettings
): AppearanceSettings {
  const updatedSettings: AppearanceSettings = {
    ...normalizeAppearanceSettings(settings),
    updatedDate: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
    dispatchAppearanceChange();
  }

  return updatedSettings;
}

export function resetAppearanceSettings(): AppearanceSettings {
  const resetSettings: AppearanceSettings = {
    ...defaultAppearanceSettings,
    updatedDate: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetSettings));
    dispatchAppearanceChange();
  }

  return resetSettings;
}