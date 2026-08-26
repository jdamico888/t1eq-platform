"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getBusinessDisplayName,
  getBusinessProfile,
} from "@/services/business-profile";

import type { AppSettings } from "@/services/app-settings";
import {
  defaultAppSettings,
  getAppSettings,
  saveAppSettings,
} from "@/services/app-settings";

import type { MarkupTier } from "@/types/pricing";
import {
  createMarkupTierId,
  sortMarkupTiers,
  validateMarkupTiers,
} from "@/services/pricing";

import { usePageHeader } from "@/components/navigation/page-header-slot";

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

const QBIT_SCOPE = "settings-page";

const APPEARANCE_STORAGE_KEY = "t1eq-appearance-settings";

const SETTINGS_HEADER = {
  overline: "Tier One Equipment",
  title: "Settings",
  description:
    "Manage the application logo and appearance settings. Changes are saved locally and applied immediately.",
};

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

export default function SettingsPage() {
  usePageHeader(SETTINGS_HEADER);

  /*
   * Just the name, for the preview below. The record itself is edited on
   * Business Setup — this page only shows what it is called.
   */
  const [businessName, setBusinessName] = useState("");
  const [appearanceSettings, setAppearanceSettings] =
    useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  const [saveMessage, setSaveMessage] = useState("");

  const [appSettings, setAppSettings] = useState<AppSettings>(
    defaultAppSettings
  );

  useEffect(() => {
    const storedAppearanceSettings = readStoredAppearanceSettings();

    setAppearanceSettings(storedAppearanceSettings);
    setAppSettings(getAppSettings());
    setBusinessName(getBusinessDisplayName(getBusinessProfile()));

    applyAppearanceSettings(storedAppearanceSettings);
  }, []);

  function handleSaveAppearance() {
    saveAppearanceSettings(appearanceSettings);
    setSaveMessage("Appearance saved.");
  }

  function updateBusinessSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) {
    setAppSettings((current) => ({ ...current, [key]: value }));
    setSaveMessage("");
  }

  function handleSaveBusinessSetup() {
    saveAppSettings(appSettings);
    setSaveMessage("Business setup saved.");
  }

  const markupTierValidation = useMemo(
    () => validateMarkupTiers(appSettings.partsMarkupTiers),
    [appSettings.partsMarkupTiers]
  );

  function updateMarkupTier<K extends keyof MarkupTier>(
    tierId: string,
    key: K,
    value: MarkupTier[K]
  ) {
    setAppSettings((current) => ({
      ...current,
      partsMarkupTiers: current.partsMarkupTiers.map((tier) =>
        tier.id === tierId ? { ...tier, [key]: value } : tier
      ),
    }));

    setSaveMessage("");
  }

  function handleAddMarkupTier() {
    setAppSettings((current) => {
      const sortedTiers = sortMarkupTiers(current.partsMarkupTiers);
      const highestTier = sortedTiers[sortedTiers.length - 1];

      // Start the new band just above wherever the current rules end, so
      // the common case needs no editing to be valid.
      const nextMinCost =
        highestTier && highestTier.maxCost !== null
          ? Math.round((highestTier.maxCost + 0.01) * 100) / 100
          : 0;

      return {
        ...current,
        partsMarkupTiers: [
          ...current.partsMarkupTiers,
          {
            id: createMarkupTierId(),
            minCost: nextMinCost,
            maxCost: null,
            markupPercent: current.partsMarkupPercent,
          },
        ],
      };
    });

    setSaveMessage("");
  }

  function handleRemoveMarkupTier(tierId: string) {
    setAppSettings((current) => ({
      ...current,
      partsMarkupTiers: current.partsMarkupTiers.filter(
        (tier) => tier.id !== tierId
      ),
    }));

    setSaveMessage("");
  }

  function handleSaveParts() {
    // Overlapping rules have no single right answer, so they block the save.
    // Gaps are only warnings — the general markup covers them.
    if (markupTierValidation.errors.length > 0) {
      setSaveMessage(`Not saved — ${markupTierValidation.errors[0]}`);
      return;
    }

    saveAppSettings(appSettings);
    setSaveMessage("Parts setup saved.");
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
        {saveMessage && (
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="settings-page-save-message"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200">
            {saveMessage}
          </div>
        )}

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="settings-page-business-setup"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <div className="mb-6">
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-business-setup-overline"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs font-black uppercase tracking-[0.24em] text-slate-400"
            >
              Business Setup
            </p>

            <h2
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-business-setup-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-2xl font-black"
            >
              Rates &amp; Markup
            </h2>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-business-setup-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 max-w-3xl text-sm font-medium text-slate-300"
            >
              These drive invoice totals and the suggested retail price on new
              inventory items.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="block">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-labor-rate-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xs font-black uppercase tracking-wide text-slate-400"
              >
                Labor Rate ($/hr)
              </span>

              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="settings-page-labor-rate"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="number"
                min="0"
                step="1"
                value={appSettings.laborRate}
                onChange={(event) =>
                  updateBusinessSetting("laborRate", Number(event.target.value))
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
              />
            </label>

            <label className="block">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-inspection-rate-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xs font-black uppercase tracking-wide text-slate-400"
              >
                Inspection Rate ($/hr)
              </span>

              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="settings-page-inspection-rate"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="number"
                min="0"
                step="1"
                value={appSettings.inspectionLaborRate}
                onChange={(event) =>
                  updateBusinessSetting(
                    "inspectionLaborRate",
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
              />
            </label>

            <label className="block">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-tax-rate-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xs font-black uppercase tracking-wide text-slate-400"
              >
                Tax Rate (%)
              </span>

              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="settings-page-tax-rate"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="number"
                min="0"
                step="0.001"
                value={(appSettings.taxRate * 100).toFixed(3)}
                onChange={(event) =>
                  updateBusinessSetting(
                    "taxRate",
                    Number(event.target.value) / 100
                  )
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
              />
            </label>

          </div>

          <div className="mt-6">
            <button data-t1eq-action-button="true"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="settings-page-save-business-setup"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="button"
              onClick={handleSaveBusinessSetup}
              className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-orange-950/30 hover:bg-orange-400"
            >
              Save Business Setup
            </button>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="settings-page-parts"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <div className="mb-6">
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-parts-overline"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs font-black uppercase tracking-[0.24em] text-slate-400"
            >
              Parts
            </p>

            <h2
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-parts-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-2xl font-black"
            >
              Pricing &amp; Stocking Thresholds
            </h2>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-parts-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 max-w-3xl text-sm font-medium text-slate-300"
            >
              How parts are priced, and when a part you keep buying should be
              suggested for stocking.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-parts-markup-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xs font-black uppercase tracking-wide text-slate-400"
              >
                General Markup (%)
              </span>

              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="settings-page-parts-markup"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="number"
                min="0"
                step="1"
                value={appSettings.partsMarkupPercent}
                onChange={(event) =>
                  updateBusinessSetting(
                    "partsMarkupPercent",
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
              />

              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-parts-markup-hint"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 block text-xs font-semibold text-slate-400"
              >
                A $100 part sells for{" "}
                {(100 * (1 + (appSettings.partsMarkupPercent || 0) / 100)).toFixed(2)}
                {appSettings.partsMarkupTiers.length > 0
                  ? " — unless a rule below covers that cost."
                  : ""}
              </span>
            </label>

            <label className="block">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-stocking-window-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xs font-black uppercase tracking-wide text-slate-400"
              >
                Look Back Over (days)
              </span>

              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="settings-page-stocking-window"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="number"
                min="1"
                step="1"
                value={appSettings.stockingLookbackDays}
                onChange={(event) =>
                  updateBusinessSetting(
                    "stockingLookbackDays",
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
              />

              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-stocking-window-hint"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 block text-xs font-semibold text-slate-400"
              >
                Usage older than this stops counting toward a suggestion.
              </span>
            </label>
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-markup-rules-heading"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Markup Rules By Cost (Optional)
                </p>

                <p
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-markup-rules-description"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="mt-1 text-sm font-medium text-slate-300"
                >
                  Override the general markup for parts in a cost range.
                  Ranges can&apos;t overlap; anything they don&apos;t cover
                  uses the general markup above.
                </p>
              </div>

              <button data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="settings-page-add-markup-rule"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="button"
                onClick={handleAddMarkupTier}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-wide text-white hover:bg-white/20"
              >
                + Add Rule
              </button>
            </div>

            {appSettings.partsMarkupTiers.length === 0 ? (
              <div data-t1eq-tile="true" data-t1eq-page-card="true"
                data-t1eq-qbit-type="tile"
                data-t1eq-qbit-id="settings-page-markup-rules-empty"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-center text-sm font-semibold text-slate-400"
              >
                No rules — every part uses the general markup.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {sortMarkupTiers(appSettings.partsMarkupTiers).map((tier) => (
                  <div data-t1eq-tile="true" data-t1eq-page-card="true"
                    key={tier.id}
                    data-t1eq-qbit-type="tile"
                    data-t1eq-qbit-id={`settings-page-markup-rule-${tier.id}`}
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="grid items-end gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-4"
                  >
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Cost From ($)
                      </span>

                      <input data-t1eq-field="true"
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-id={`settings-page-markup-rule-${tier.id}-min`}
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        type="number"
                        min="0"
                        step="0.01"
                        value={tier.minCost}
                        onChange={(event) =>
                          updateMarkupTier(
                            tier.id,
                            "minCost",
                            Number(event.target.value)
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none focus:border-orange-400"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Cost To ($)
                      </span>

                      <input data-t1eq-field="true"
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-id={`settings-page-markup-rule-${tier.id}-max`}
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        type="number"
                        min="0"
                        step="0.01"
                        value={tier.maxCost === null ? "" : tier.maxCost}
                        placeholder="No limit"
                        onChange={(event) =>
                          updateMarkupTier(
                            tier.id,
                            "maxCost",
                            event.target.value.trim() === ""
                              ? null
                              : Number(event.target.value)
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none focus:border-orange-400"
                      />

                      <span className="mt-1 block text-xs font-semibold text-slate-500">
                        Leave blank for &ldquo;and above&rdquo;.
                      </span>
                    </label>

                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Marked Up (%)
                      </span>

                      <input data-t1eq-field="true"
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-id={`settings-page-markup-rule-${tier.id}-percent`}
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        type="number"
                        min="0"
                        step="1"
                        value={tier.markupPercent}
                        onChange={(event) =>
                          updateMarkupTier(
                            tier.id,
                            "markupPercent",
                            Number(event.target.value)
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none focus:border-orange-400"
                      />
                    </label>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-400">
                        {tier.minCost >= 0 && tier.markupPercent >= 0
                          ? `$${tier.minCost.toFixed(2)} part → $${(
                              tier.minCost *
                              (1 + (tier.markupPercent || 0) / 100)
                            ).toFixed(2)}`
                          : ""}
                      </span>

                      <button data-t1eq-action-button="true"
                        data-t1eq-qbit-type="action-button"
                        data-t1eq-qbit-id={`settings-page-markup-rule-${tier.id}-remove`}
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        type="button"
                        onClick={() => handleRemoveMarkupTier(tier.id)}
                        className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-200 hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {markupTierValidation.errors.length > 0 && (
              <div data-t1eq-tile="true" data-t1eq-page-card="true"
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-markup-rule-errors"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3"
              >
                <div className="text-xs font-black uppercase tracking-wide text-red-200">
                  Fix before saving
                </div>

                <ul className="mt-2 space-y-1 text-sm font-semibold text-red-100">
                  {markupTierValidation.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {markupTierValidation.warnings.length > 0 && (
              <div data-t1eq-tile="true" data-t1eq-page-card="true"
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-markup-rule-warnings"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3"
              >
                <div className="text-xs font-black uppercase tracking-wide text-amber-200">
                  Worth knowing
                </div>

                <ul className="mt-2 space-y-1 text-sm font-semibold text-amber-100">
                  {markupTierValidation.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6">
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-stocking-heading"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs font-black uppercase tracking-wide text-slate-400"
            >
              Start Stocking A Part When Either Is Met
            </p>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-stocking-jobs-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Used On This Many Jobs
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-stocking-jobs"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="1"
                  step="1"
                  value={appSettings.stockingThresholdJobs}
                  onChange={(event) =>
                    updateBusinessSetting(
                      "stockingThresholdJobs",
                      Number(event.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />

                <span className="mt-2 block text-xs font-semibold text-slate-400">
                  Separate jobs, not pieces — recurring demand.
                </span>
              </label>

              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-stocking-quantity-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Or This Many Pieces Used
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-stocking-quantity"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="1"
                  step="1"
                  value={appSettings.stockingThresholdQuantity}
                  onChange={(event) =>
                    updateBusinessSetting(
                      "stockingThresholdQuantity",
                      Number(event.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />

                <span className="mt-2 block text-xs font-semibold text-slate-400">
                  Catches consumables. Set high to judge on jobs alone.
                </span>
              </label>
            </div>
          </div>

          {/*
            Turn categories.

            A turn is the stocking quantity selling through once: shelf set
            to 4, twelve went out, three turns. Each tier is set in the
            unit a shop naturally uses for parts at that speed, which is
            why the three boxes are not in the same unit — they are all
            checked against the same underlying rate.
          */}
          <div className="mt-6">
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-turn-heading"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs font-black uppercase tracking-wide text-slate-400"
            >
              Turn Categories For Stocked Parts
            </p>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-turn-explainer"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 max-w-3xl text-xs font-semibold text-slate-400"
            >
              One turn is the stocking quantity selling through once — a
              part set to stock 4 that sold 12 turned 3 times. Measured
              against Ideal Stock, so a part is judged against how deep its
              shelf is meant to be rather than what happens to be on it
              today. A part that clears none of these bars is reported as
              not turning.
            </p>

            <div className="mt-4 grid gap-5 md:grid-cols-3">
              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-turn-fast-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-emerald-300"
                >
                  Fast Turn — Turns Per Week
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-turn-fast"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="0"
                  step="0.25"
                  value={appSettings.turnFastPerWeek}
                  onChange={(event) =>
                    updateBusinessSetting(
                      "turnFastPerWeek",
                      Number(event.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />

                <span className="mt-2 block text-xs font-semibold text-slate-400">
                  Sells through its shelf this often each week.
                </span>
              </label>

              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-turn-medium-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-sky-300"
                >
                  Medium Turn — Turns Per Month
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-turn-medium"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="0"
                  step="0.25"
                  value={appSettings.turnMediumPerMonth}
                  onChange={(event) =>
                    updateBusinessSetting(
                      "turnMediumPerMonth",
                      Number(event.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />

                <span className="mt-2 block text-xs font-semibold text-slate-400">
                  Anything below the weekly bar that clears this.
                </span>
              </label>

              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-turn-slow-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-amber-300"
                >
                  Slow Turn — Turns Per Year
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-turn-slow"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="0"
                  step="0.25"
                  value={appSettings.turnSlowPerYear}
                  onChange={(event) =>
                    updateBusinessSetting(
                      "turnSlowPerYear",
                      Number(event.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />

                <span className="mt-2 block text-xs font-semibold text-slate-400">
                  Below this, the part is not turning at all.
                </span>
              </label>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-turn-fast-sales-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Fast Turn Also Needs — Sales Per Month
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-turn-fast-sales"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="0"
                  step="1"
                  value={appSettings.turnFastMinSalesPerMonth}
                  onChange={(event) =>
                    updateBusinessSetting(
                      "turnFastMinSalesPerMonth",
                      Number(event.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />

                <span className="mt-2 block text-xs font-semibold text-slate-400">
                  A part stocked one deep turns every time it sells. This
                  is the volume floor under Fast. Set 0 to judge on turns
                  alone.
                </span>
              </label>

              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-turn-lookback-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Measured Over — Days
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-turn-lookback"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="30"
                  step="1"
                  value={appSettings.turnLookbackDays}
                  onChange={(event) =>
                    updateBusinessSetting(
                      "turnLookbackDays",
                      Number(event.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />

                <span className="mt-2 block text-xs font-semibold text-slate-400">
                  A part newer than this is measured over its own age
                  instead, and its rate is marked as an estimate.
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-restocking-heading"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs font-black uppercase tracking-wide text-slate-400"
            >
              Restocking Defaults For Newly Stocked Parts
            </p>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-default-minimum-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Minimum On Hand
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-default-minimum"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="0"
                  step="1"
                  value={appSettings.defaultMinimumStock}
                  onChange={(event) =>
                    updateBusinessSetting(
                      "defaultMinimumStock",
                      Number(event.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />

                <span className="mt-2 block text-xs font-semibold text-slate-400">
                  Drop to this and the part is due for reorder.
                </span>
              </label>

              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-default-ideal-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Restock Up To
                </span>

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-default-ideal"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="0"
                  step="1"
                  value={appSettings.defaultIdealStock}
                  onChange={(event) =>
                    updateBusinessSetting(
                      "defaultIdealStock",
                      Number(event.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />

                <span className="mt-2 block text-xs font-semibold text-slate-400">
                  How many to bring it back to when reordering.
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-special-order-heading"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs font-black uppercase tracking-wide text-slate-400"
            >
              Special Order Parts
            </p>

            <label className="mt-4 flex items-start gap-3">
              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="settings-page-special-order-prepayment"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="checkbox"
                checked={appSettings.specialOrderRequiresPrepayment}
                onChange={(event) =>
                  updateBusinessSetting(
                    "specialOrderRequiresPrepayment",
                    event.target.checked
                  )
                }
                className="mt-1 h-5 w-5 shrink-0 rounded border-white/20 bg-black/30"
              />

              <span>
                <span className="block text-sm font-bold text-white">
                  Require prepayment before ordering
                </span>

                <span className="mt-1 block text-xs font-semibold text-slate-400">
                  A part the shop does not stock is money out the door the
                  moment it is ordered. With this on, an appointment can
                  raise a parts-only prepayment invoice before anyone
                  orders anything &mdash; no repair order needed. What the
                  customer prepays is credited back on the final invoice.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-6">
            <button data-t1eq-action-button="true"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="settings-page-save-parts"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="button"
              onClick={handleSaveParts}
              className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-orange-950/30 hover:bg-orange-400"
            >
              Save Parts Setup
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="settings-page-branding"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6">
              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-branding-overline"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xs font-black uppercase tracking-[0.24em] text-slate-400"
              >
                Branding
              </p>
              <h2
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-branding-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-2xl font-black"
              >
                Company Name &amp; Logo
              </h2>
            </div>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-branding-moved"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-medium text-slate-300"
            >
              These moved to Business Setup, along with the rest of the
              company&rsquo;s own details — address, phone numbers, FEIN,
              owner. The name and logo belong with them rather than sitting
              on their own.
            </p>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-branding-moved-note"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-3 text-xs font-medium text-slate-500"
            >
              The logo control here never worked: it saved to a store
              nothing read, so uploading one changed nothing on screen. The
              one on Business Setup edits the logo the sidebar actually
              paints.
            </p>

            <Link
              data-t1eq-action-button="true"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="settings-page-branding-link"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              href="/settings/business"
              className="mt-6 inline-block rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-orange-950/30 hover:bg-orange-400"
            >
              Open Business Setup
            </Link>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="settings-page-appearance"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6">
              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-appearance-overline"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xs font-black uppercase tracking-[0.24em] text-slate-400"
              >
                Interface
              </p>
              <h2
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="settings-page-appearance-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-2xl font-black"
              >
                Appearance
              </h2>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-theme-name-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Theme Name
                </span>
                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-theme-name"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  value={appearanceSettings.themeName}
                  onChange={(event) =>
                    updateAppearance("themeName", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span
                    data-t1eq-qbit-type="text"
                    data-t1eq-qbit-id="settings-page-accent-color-label"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="text-xs font-black uppercase tracking-wide text-slate-400"
                  >
                    Accent
                  </span>
                  <input data-t1eq-field="true"
                    data-t1eq-qbit-type="field"
                    data-t1eq-qbit-id="settings-page-accent-color"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    type="color"
                    value={appearanceSettings.accentColor}
                    onChange={(event) =>
                      updateAppearance("accentColor", event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 p-1"
                  />
                </label>

                <label className="block">
                  <span
                    data-t1eq-qbit-type="text"
                    data-t1eq-qbit-id="settings-page-background-color-label"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="text-xs font-black uppercase tracking-wide text-slate-400"
                  >
                    Background
                  </span>
                  <input data-t1eq-field="true"
                    data-t1eq-qbit-type="field"
                    data-t1eq-qbit-id="settings-page-background-color"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    type="color"
                    value={appearanceSettings.backgroundColor}
                    onChange={(event) =>
                      updateAppearance("backgroundColor", event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 p-1"
                  />
                </label>

                <label className="block">
                  <span
                    data-t1eq-qbit-type="text"
                    data-t1eq-qbit-id="settings-page-panel-color-label"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="text-xs font-black uppercase tracking-wide text-slate-400"
                  >
                    Panel
                  </span>
                  <input data-t1eq-field="true"
                    data-t1eq-qbit-type="field"
                    data-t1eq-qbit-id="settings-page-panel-color"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    type="color"
                    value={appearanceSettings.panelColor}
                    onChange={(event) =>
                      updateAppearance("panelColor", event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 p-1"
                  />
                </label>

                <label className="block">
                  <span
                    data-t1eq-qbit-type="text"
                    data-t1eq-qbit-id="settings-page-text-color-label"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="text-xs font-black uppercase tracking-wide text-slate-400"
                  >
                    Text
                  </span>
                  <input data-t1eq-field="true"
                    data-t1eq-qbit-type="field"
                    data-t1eq-qbit-id="settings-page-text-color"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
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
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-border-radius-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Border Radius
                </span>
                <select data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-border-radius"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
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
                <span
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="settings-page-glass-opacity-label"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Glass Opacity
                </span>
                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id="settings-page-glass-opacity"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
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
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="settings-page-save-appearance"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="button"
                  onClick={handleSaveAppearance}
                  className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-orange-950/30 hover:bg-orange-400"
                >
                  Save Appearance
                </button>

                <button data-t1eq-action-button="true"
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="settings-page-reset-appearance"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
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
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="settings-page-live-preview"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-[28px] border border-white/10 p-6 shadow-2xl"
          style={{
            backgroundColor: appearanceSettings.panelColor,
            color: appearanceSettings.textColor,
            borderRadius: appearanceSettings.borderRadius,
            boxShadow: appearanceSettings.shadowDepth,
          }}
        >
          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="settings-page-live-preview-overline"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-xs font-black uppercase tracking-[0.24em] opacity-70"
          >
            Live Preview
          </p>
          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="settings-page-live-preview-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 text-2xl font-black"
          >
            {businessName || "Tier One Equipment"}
          </h2>
          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="settings-page-live-preview-description"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 max-w-2xl text-sm font-medium opacity-80"
          >
            This preview updates as you change the appearance settings. Press
            Save Appearance to persist the final configuration.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-live-preview-accent-sample"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide text-white"
              style={{ backgroundColor: appearanceSettings.accentColor }}
            >
              Accent Sample
            </span>
            <span data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="settings-page-live-preview-panel-sample"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-black uppercase tracking-wide">
              Panel Sample
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}