"use client";

import { ChangeEvent, useEffect, useState } from "react";

import type {
  AppearanceSettings,
  AppFontFamily,
  AppFontSize,
  ThreeDEffectLevel,
  TileOrientation,
  TileSize,
} from "@/types/appearance-settings";

import {
  defaultAppearanceSettings,
  fontFamilyOptions,
  fontSizeOptions,
  getAppearanceSettings,
  resetAppearanceSettings,
  saveAppearanceSettings,
  threeDEffectOptions,
  tileOrientationOptions,
  tileSizeOptions,
} from "@/services/appearance-settings";

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";
const headerClass =
  "mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const labelClass = "text-sm font-black uppercase tracking-wide text-zinc-500";
const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";
const primaryButtonClass =
  "rounded-xl bg-black px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-zinc-800";
const secondaryButtonClass =
  "rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-black shadow-sm transition hover:bg-zinc-50";
const dangerButtonClass =
  "rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read uploaded image."));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read uploaded image."));
    };

    reader.readAsDataURL(file);
  });
}

export default function AppearanceSettingsPage() {
  const [settings, setSettings] = useState<AppearanceSettings>(
    defaultAppearanceSettings
  );
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setSettings(getAppearanceSettings());
  }, []);

  function updateDraft(updates: Partial<AppearanceSettings>) {
    setSettings((current) => ({
      ...current,
      ...updates,
    }));
    setStatusMessage("");
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Please upload an image file.");
      return;
    }

    try {
      const logoUrl = await readFileAsDataUrl(file);

      updateDraft({
        logoUrl,
      });

      const updatedSettings = saveAppearanceSettings({
        ...settings,
        logoUrl,
      });

      setSettings(updatedSettings);
      setStatusMessage("Logo uploaded and saved.");
    } catch {
      setStatusMessage("Logo upload failed.");
    }
  }

  function handleSave() {
    const updatedSettings = saveAppearanceSettings(settings);

    setSettings(updatedSettings);
    setStatusMessage("Appearance settings saved.");
  }

  function handleReset() {
    const resetSettings = resetAppearanceSettings();

    setSettings(resetSettings);
    setStatusMessage("Appearance settings reset.");
  }

  function handleRemoveLogo() {
    const updatedSettings = saveAppearanceSettings({
      ...settings,
      logoUrl: "",
    });

    setSettings(updatedSettings);
    setStatusMessage("Logo removed.");
  }

  return (
    <div className={pageClass}>
      <header data-t1eq-page-card="true" className={headerClass}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-zinc-500">
              Settings
            </p>
            <h1 className="mt-2 text-4xl font-black text-black">
              Appearance
            </h1>
            <p className="mt-2 max-w-3xl text-base font-semibold text-zinc-600">
              Control the logo, dashboard tile layout, font, sizing, and 3D
              depth effects used across the app.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              className={primaryButtonClass}
            >
              Save Appearance
            </button>

            <button
              type="button"
              onClick={handleReset}
              className={dangerButtonClass}
            >
              Reset
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
            {statusMessage}
          </div>
        )}
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section data-t1eq-page-card="true" className={sectionClass}>
          <h2 className="text-2xl font-black text-black">Logo</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-600">
            Uploading a logo saves it into local browser storage and applies it
            to the sidebar business card.
          </p>

          <div className="mt-5 grid gap-4">
            <label className="space-y-2">
              <span className={labelClass}>Upload Logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Logo URL / Data URL</span>
              <textarea
                value={settings.logoUrl}
                onChange={(event) =>
                  updateDraft({
                    logoUrl: event.target.value,
                  })
                }
                rows={4}
                className={inputClass}
                placeholder="Upload a logo or paste an image URL."
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                className={primaryButtonClass}
              >
                Save Logo
              </button>

              <button
                type="button"
                onClick={handleRemoveLogo}
                className={secondaryButtonClass}
              >
                Remove Logo
              </button>
            </div>
          </div>
        </section>

        <aside data-t1eq-page-card="true" className={sectionClass}>
          <h2 className="text-2xl font-black text-black">Logo Preview</h2>

          <div className="mt-5 rounded-3xl border border-zinc-200 bg-zinc-950 p-5 text-white">
            <div
              data-t1eq-business-card="true"
              className="rounded-2xl border border-white/10 bg-white/5 bg-cover bg-center p-4"
              style={
                settings.logoUrl
                  ? {
                      backgroundImage: `linear-gradient(rgb(0 0 0 / 0.45), rgb(0 0 0 / 0.45)), url("${settings.logoUrl}")`,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white bg-contain bg-center bg-no-repeat text-sm font-black text-black"
                  style={
                    settings.logoUrl
                      ? {
                          backgroundImage: `url("${settings.logoUrl}")`,
                        }
                      : undefined
                  }
                >
                  {!settings.logoUrl && "T1"}
                </div>

                <div>
                  <div className="text-lg font-black">Tier One Equipment</div>
                  <div className="text-xs font-bold uppercase tracking-wide text-white/60">
                    Operations Platform
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section data-t1eq-page-card="true" className={sectionClass}>
          <h2 className="text-2xl font-black text-black">Dashboard Tiles</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className={labelClass}>Tile Orientation</span>
              <select
                value={settings.tileOrientation}
                onChange={(event) =>
                  updateDraft({
                    tileOrientation: event.target.value as TileOrientation,
                  })
                }
                className={inputClass}
              >
                {tileOrientationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Tile Size</span>
              <select
                value={settings.tileSize}
                onChange={(event) =>
                  updateDraft({
                    tileSize: event.target.value as TileSize,
                  })
                }
                className={inputClass}
              >
                {tileSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section data-t1eq-page-card="true" className={sectionClass}>
          <h2 className="text-2xl font-black text-black">Typography</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className={labelClass}>Font Family</span>
              <select
                value={settings.fontFamily}
                onChange={(event) =>
                  updateDraft({
                    fontFamily: event.target.value as AppFontFamily,
                  })
                }
                className={inputClass}
              >
                {fontFamilyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Font Size</span>
              <select
                value={settings.fontSize}
                onChange={(event) =>
                  updateDraft({
                    fontSize: event.target.value as AppFontSize,
                  })
                }
                className={inputClass}
              >
                {fontSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section data-t1eq-page-card="true" className={sectionClass}>
          <h2 className="text-2xl font-black text-black">3D Effects</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className={labelClass}>Sidebar Depth</span>
              <select
                value={settings.sidebarThreeDEffect}
                onChange={(event) =>
                  updateDraft({
                    sidebarThreeDEffect: event.target
                      .value as ThreeDEffectLevel,
                  })
                }
                className={inputClass}
              >
                {threeDEffectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Page Card Depth</span>
              <select
                value={settings.pageThreeDEffect}
                onChange={(event) =>
                  updateDraft({
                    pageThreeDEffect: event.target.value as ThreeDEffectLevel,
                  })
                }
                className={inputClass}
              >
                {threeDEffectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section data-t1eq-page-card="true" className={sectionClass}>
          <h2 className="text-2xl font-black text-black">Preview Tiles</h2>

          <div data-t1eq-tile-grid="true" className="mt-5 grid gap-4">
            <div
              data-t1eq-tile="true"
              data-t1eq-page-card="true"
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm font-black uppercase tracking-wide text-zinc-500">
                Preview
              </div>
              <div className="mt-2 text-3xl font-black text-black">Tile A</div>
              <div className="mt-2 text-sm font-semibold text-zinc-600">
                This card reflects saved tile size, orientation, font, and depth.
              </div>
            </div>

            <div
              data-t1eq-tile="true"
              data-t1eq-page-card="true"
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm font-black uppercase tracking-wide text-zinc-500">
                Preview
              </div>
              <div className="mt-2 text-3xl font-black text-black">Tile B</div>
              <div className="mt-2 text-sm font-semibold text-zinc-600">
                Use Q-Bit on the dashboard to edit individual page cards.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}