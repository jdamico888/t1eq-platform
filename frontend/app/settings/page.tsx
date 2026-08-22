"use client";

import { useEffect, useMemo, useState } from "react";

type AppearanceSettings = {
  themeName: string;
  accentColor: string;
  backgroundColor: string;
  panelColor: string;
  textColor: string;
  borderRadius: string;
  glassOpacity: string;
  shadowDepth: string;
};

type BrandSettings = {
  companyName: string;
  logoDataUrl: string;
  logoFileName: string;
  updatedDate: string;
};

const BRAND_STORAGE_KEY = "t1eq-brand-settings";
const APPEARANCE_STORAGE_KEY = "t1eq-appearance-settings";

const DEFAULT_APPEARANCE: AppearanceSettings = {
  themeName: "Tier One Command",
  accentColor: "#f97316",
  backgroundColor: "#020617",
  panelColor: "#0f172a",
  textColor: "#f8fafc",
  borderRadius: "20px",
  glassOpacity: "0.72",
  shadowDepth: "0 24px 80px rgba(0, 0, 0, 0.38)",
};

const DEFAULT_BRAND: BrandSettings = {
  companyName: "Tier One Equipment",
  logoDataUrl: "",
  logoFileName: "",
  updatedDate: "",
};

function readStoredBrandSettings(): BrandSettings {
  if (typeof window === "undefined") {
    return DEFAULT_BRAND;
  }

  try {
    const storedValue = localStorage.getItem(BRAND_STORAGE_KEY);

    if (!storedValue) {
      return DEFAULT_BRAND;
    }

    return {
      ...DEFAULT_BRAND,
      ...(JSON.parse(storedValue) as Partial<BrandSettings>),
    };
  } catch {
    return DEFAULT_BRAND;
  }
}

function readStoredAppearanceSettings(): AppearanceSettings {
  if (typeof window === "undefined") {
    return DEFAULT_APPEARANCE;
  }

  try {
    const storedValue = localStorage.getItem(APPEARANCE_STORAGE_KEY);

    if (!storedValue) {
      return DEFAULT_APPEARANCE;
    }

    return {
      ...DEFAULT_APPEARANCE,
      ...(JSON.parse(storedValue) as Partial<AppearanceSettings>),
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function applyAppearanceSettings(settings: AppearanceSettings) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.style.setProperty("--t1eq-accent-color", settings.accentColor);
  root.style.setProperty("--t1eq-background-color", settings.backgroundColor);
  root.style.setProperty("--t1eq-panel-color", settings.panelColor);
  root.style.setProperty("--t1eq-text-color", settings.textColor);
  root.style.setProperty("--t1eq-border-radius", settings.borderRadius);
  root.style.setProperty("--t1eq-glass-opacity", settings.glassOpacity);
  root.style.setProperty("--t1eq-shadow-depth", settings.shadowDepth);

  root.dataset.t1eqTheme = settings.themeName;
}

function saveBrandSettings(settings: BrandSettings) {
  localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(settings));

  window.dispatchEvent(
    new CustomEvent("t1eq-brand-settings-changed", {
      detail: settings,
    })
  );
}

function saveAppearanceSettings(settings: AppearanceSettings) {
  localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));

  /*
   * Compatibility keys for older appearance/editor code.
   * These let existing components keep working even if they still read
   * the older storage names.
   */
  localStorage.setItem("t1eq-appearance", JSON.stringify(settings));
  localStorage.setItem("t1eq-theme-settings", JSON.stringify(settings));

  applyAppearanceSettings(settings);

  window.dispatchEvent(
    new CustomEvent("t1eq-appearance-settings-changed", {
      detail: settings,
    })
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read selected logo file."));
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(
    DEFAULT_BRAND
  );
  const [appearanceSettings, setAppearanceSettings] =
    useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  const [selectedLogoFileName, setSelectedLogoFileName] = useState("");
  const [selectedLogoDataUrl, setSelectedLogoDataUrl] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const storedBrandSettings = readStoredBrandSettings();
    const storedAppearanceSettings = readStoredAppearanceSettings();

    setBrandSettings(storedBrandSettings);
    setAppearanceSettings(storedAppearanceSettings);
    setSelectedLogoDataUrl(storedBrandSettings.logoDataUrl);
    setSelectedLogoFileName(storedBrandSettings.logoFileName);

    applyAppearanceSettings(storedAppearanceSettings);
  }, []);

  const logoPreview = useMemo(() => {
    return selectedLogoDataUrl || brandSettings.logoDataUrl;
  }, [selectedLogoDataUrl, brandSettings.logoDataUrl]);

  async function handleLogoFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);

    setSelectedLogoDataUrl(dataUrl);
    setSelectedLogoFileName(file.name);
    setSaveMessage("");
  }

  function handleSaveLogo() {
    const nextBrandSettings: BrandSettings = {
      ...brandSettings,
      logoDataUrl: selectedLogoDataUrl,
      logoFileName: selectedLogoFileName,
      updatedDate: new Date().toISOString(),
    };

    setBrandSettings(nextBrandSettings);
    saveBrandSettings(nextBrandSettings);
    setSaveMessage("Logo saved.");
  }

  function handleSaveAppearance() {
    saveAppearanceSettings(appearanceSettings);
    setSaveMessage("Appearance saved.");
  }

  function handleResetAppearance() {
    setAppearanceSettings(DEFAULT_APPEARANCE);
    saveAppearanceSettings(DEFAULT_APPEARANCE);
    setSaveMessage("Appearance reset.");
  }

  function updateAppearance<K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) {
    const nextSettings = {
      ...appearanceSettings,
      [key]: value,
    };

    setAppearanceSettings(nextSettings);
    applyAppearanceSettings(nextSettings);
    setSaveMessage("");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl space-y-8">
        <header data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-300">
            Tier One Equipment
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Settings
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-300">
            Manage the application logo and appearance settings. Changes are
            saved locally and applied immediately.
          </p>

          {saveMessage && (
            <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200">
              {saveMessage}
            </div>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                Branding
              </p>
              <h2 className="mt-2 text-2xl font-black">Logo</h2>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Company Name
                </span>
                <input data-t1eq-field="true"
                  value={brandSettings.companyName}
                  onChange={(event) =>
                    setBrandSettings((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Upload Logo
                </span>
                <input data-t1eq-field="true"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white file:mr-4 file:rounded-xl file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                />
              </label>

              <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">
                  Preview
                </p>

                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Saved company logo preview"
                    className="max-h-32 max-w-full rounded-xl object-contain"
                  />
                ) : (
                  <div data-t1eq-tile="true" data-t1eq-page-card="true" className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/20 text-sm font-bold text-slate-500">
                    No logo selected
                  </div>
                )}

                {selectedLogoFileName && (
                  <p className="mt-3 text-xs font-bold text-slate-400">
                    {selectedLogoFileName}
                  </p>
                )}
              </div>

              <button data-t1eq-action-button="true"
                type="button"
                onClick={handleSaveLogo}
                className="w-full rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-orange-950/30 hover:bg-orange-400"
              >
                Save Logo
              </button>
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                Interface
              </p>
              <h2 className="mt-2 text-2xl font-black">Appearance</h2>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Theme Name
                </span>
                <input data-t1eq-field="true"
                  value={appearanceSettings.themeName}
                  onChange={(event) =>
                    updateAppearance("themeName", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Accent
                  </span>
                  <input data-t1eq-field="true"
                    type="color"
                    value={appearanceSettings.accentColor}
                    onChange={(event) =>
                      updateAppearance("accentColor", event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 p-1"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Background
                  </span>
                  <input data-t1eq-field="true"
                    type="color"
                    value={appearanceSettings.backgroundColor}
                    onChange={(event) =>
                      updateAppearance("backgroundColor", event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 p-1"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Panel
                  </span>
                  <input data-t1eq-field="true"
                    type="color"
                    value={appearanceSettings.panelColor}
                    onChange={(event) =>
                      updateAppearance("panelColor", event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 p-1"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Text
                  </span>
                  <input data-t1eq-field="true"
                    type="color"
                    value={appearanceSettings.textColor}
                    onChange={(event) =>
                      updateAppearance("textColor", event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 p-1"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Border Radius
                </span>
                <select data-t1eq-field="true"
                  value={appearanceSettings.borderRadius}
                  onChange={(event) =>
                    updateAppearance("borderRadius", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                >
                  <option value="8px">Sharp</option>
                  <option value="14px">Medium</option>
                  <option value="20px">Rounded</option>
                  <option value="28px">Heavy Rounded</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Glass Opacity
                </span>
                <input data-t1eq-field="true"
                  type="range"
                  min="0.25"
                  max="1"
                  step="0.01"
                  value={appearanceSettings.glassOpacity}
                  onChange={(event) =>
                    updateAppearance("glassOpacity", event.target.value)
                  }
                  className="mt-2 w-full"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={handleSaveAppearance}
                  className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-orange-950/30 hover:bg-orange-400"
                >
                  Save Appearance
                </button>

                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={handleResetAppearance}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white/20"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          className="rounded-[28px] border border-white/10 p-6 shadow-2xl"
          style={{
            backgroundColor: appearanceSettings.panelColor,
            color: appearanceSettings.textColor,
            borderRadius: appearanceSettings.borderRadius,
            boxShadow: appearanceSettings.shadowDepth,
          }}
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] opacity-70">
            Live Preview
          </p>
          <h2 className="mt-2 text-2xl font-black">
            {brandSettings.companyName || "Tier One Equipment"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-medium opacity-80">
            This preview updates as you change the appearance settings. Press
            Save Appearance to persist the final configuration.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <span
              className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide text-white"
              style={{ backgroundColor: appearanceSettings.accentColor }}
            >
              Accent Sample
            </span>
            <span data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-full border border-white/20 px-4 py-2 text-xs font-black uppercase tracking-wide">
              Panel Sample
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}