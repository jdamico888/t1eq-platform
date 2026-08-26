"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { usePageHeader } from "@/components/navigation/page-header-slot";

import type {
  AdvertisingBlock,
  AdvertisingBlockPlacement,
  AppearanceSettings,
  AppFontFamily,
  AppFontSize,
  OutputAdvertisingPlacement,
  OutputFooterLayout,
  OutputHeaderLayout,
  OutputTemplateDensity,
  OutputTemplateSettings,
  QBitOutputScope,
  ThreeDEffectLevel,
  TileOrientation,
  TileSize,
} from "@/types/appearance-settings";

import {
  advertisingBlockPlacementOptions,
  defaultAppearanceSettings,
  fontFamilyOptions,
  fontSizeOptions,
  getAppearanceSettings,
  outputAdvertisingPlacementOptions,
  outputFooterLayoutOptions,
  outputHeaderLayoutOptions,
  outputTemplateDensityOptions,
  resetAppearanceSettings,
  saveAppearanceSettings,
  threeDEffectOptions,
  tileOrientationOptions,
  tileSizeOptions,
} from "@/services/appearance-settings";

import { downscaleImageFile } from "@/lib/storage";

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";
const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const labelClass = "text-sm font-black uppercase tracking-wide text-zinc-500";
const smallLabelClass =
  "text-xs font-black uppercase tracking-wide text-zinc-500";
const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";
const smallInputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";
const primaryButtonClass =
  "rounded-xl bg-black px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-zinc-800";
const secondaryButtonClass =
  "rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-black shadow-sm transition hover:bg-zinc-50";
const dangerButtonClass =
  "rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100";


function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function createAdvertisingBlock(): AdvertisingBlock {
  return {
    id: createId("ad"),
    title: "New Advertising Block",
    placement: "Invoice Bottom",
    imageUrl: "",
    headline: "",
    bodyText: "",
    callToAction: "",
    expirationDate: "",
    isActive: true,
    updatedDate: new Date().toISOString(),
  };
}

function getTemplateAllowedAdvertisingPlacements(
  template: OutputTemplateSettings
): AdvertisingBlockPlacement[] {
  if (template.advertisingPlacement === "None") {
    return [];
  }

  if (
    template.scope === "Email Invoice" ||
    template.scope === "Email Work Order" ||
    template.advertisingPlacement === "Email Body"
  ) {
    return ["Email Body"];
  }

  if (template.scope === "Printable Work Order") {
    return ["Work Order Bottom"];
  }

  if (template.scope === "Printable Invoice") {
    if (template.advertisingPlacement === "Top") {
      return ["Invoice Top"];
    }

    if (template.advertisingPlacement === "Both") {
      return ["Invoice Top", "Invoice Bottom"];
    }

    return ["Invoice Bottom"];
  }

  return [];
}

const QBIT_SCOPE = "appearance-settings";

/*
 * This page used to draw its own header card directly under the shared
 * header bar, so the screen carried two. The text and its buttons are
 * published upward now, and there is one.
 */
const APPEARANCE_HEADER = {
  overline: "Settings",
  title: "Appearance",
  description:
    "Control the app appearance, Q-Bit page scopes, invoice/work order " +
    "output templates, and reusable advertising blocks.",
};

function getOutputTemplateDescription(scope: QBitOutputScope) {
  switch (scope) {
    case "Printable Invoice":
      return "Controls the printed or PDF invoice layout.";
    case "Email Invoice":
      return "Controls the invoice email body and email-ready summary.";
    case "Printable Work Order":
      return "Controls the technician/customer work order print layout.";
    case "Email Work Order":
      return "Controls the work order email body and email-ready task summary.";
    default:
      return "Controls this output surface.";
  }
}

export default function AppearanceSettingsPage() {
  const [settings, setSettings] = useState<AppearanceSettings>(
    defaultAppearanceSettings
  );
  const [statusMessage, setStatusMessage] = useState("");

  /*
   * The header publishes its buttons once, so the Save button's closure
   * would otherwise keep the settings from the very first render — the
   * defaults, saved over whatever the user had. It reads the live draft
   * through this ref instead.
   */
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    setSettings(getAppearanceSettings());
  }, []);

  const activeAdvertisingBlocks = useMemo(
    () => settings.advertisingBlocks.filter((block) => block.isActive),
    [settings.advertisingBlocks]
  );

  function updateDraft(updates: Partial<AppearanceSettings>) {
    setSettings((current) => ({
      ...current,
      ...updates,
    }));
    setStatusMessage("");
  }

  function updateOutputTemplate(
    scope: QBitOutputScope,
    updates: Partial<OutputTemplateSettings>
  ) {
    setSettings((current) => ({
      ...current,
      outputTemplates: current.outputTemplates.map((template) =>
        template.scope === scope
          ? {
              ...template,
              ...updates,
            }
          : template
      ),
    }));
    setStatusMessage("");
  }

  function toggleOutputTemplateAdvertisingBlock(
    scope: QBitOutputScope,
    blockId: string
  ) {
    setSettings((current) => ({
      ...current,
      outputTemplates: current.outputTemplates.map((template) => {
        if (template.scope !== scope) {
          return template;
        }

        const blockAlreadySelected =
          template.activeAdvertisingBlockIds.includes(blockId);

        return {
          ...template,
          activeAdvertisingBlockIds: blockAlreadySelected
            ? template.activeAdvertisingBlockIds.filter((id) => id !== blockId)
            : [...template.activeAdvertisingBlockIds, blockId],
        };
      }),
    }));
    setStatusMessage("");
  }

  function addAdvertisingBlock() {
    setSettings((current) => ({
      ...current,
      advertisingBlocks: [...current.advertisingBlocks, createAdvertisingBlock()],
    }));
    setStatusMessage("");
  }

  function updateAdvertisingBlock(
    blockId: string,
    updates: Partial<AdvertisingBlock>
  ) {
    setSettings((current) => ({
      ...current,
      advertisingBlocks: current.advertisingBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              ...updates,
              updatedDate: new Date().toISOString(),
            }
          : block
      ),
    }));
    setStatusMessage("");
  }

  function deleteAdvertisingBlock(blockId: string) {
    setSettings((current) => ({
      ...current,
      advertisingBlocks: current.advertisingBlocks.filter(
        (block) => block.id !== blockId
      ),
      outputTemplates: current.outputTemplates.map((template) => ({
        ...template,
        activeAdvertisingBlockIds: template.activeAdvertisingBlockIds.filter(
          (activeBlockId) => activeBlockId !== blockId
        ),
      })),
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
      const logoUrl = await downscaleImageFile(file);

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

  async function handleAdvertisingImageUpload(
    blockId: string,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Please upload an image file for the advertising block.");
      return;
    }

    try {
      const imageUrl = await downscaleImageFile(file, 1024);

      updateAdvertisingBlock(blockId, {
        imageUrl,
      });

      setStatusMessage("Advertising image added to draft. Save to keep it.");
    } catch {
      setStatusMessage("Advertising image upload failed.");
    }
  }

  function handleSave() {
    const updatedSettings = saveAppearanceSettings(settingsRef.current);

    setSettings(updatedSettings);
    setStatusMessage("Appearance and output settings saved.");
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

  /*
   * Declared here, below every handler the buttons call, because a `const`
   * is not hoisted and the hook reads them as it runs.
   *
   * The buttons hold no page state of their own, so nothing needs to go in
   * actionsKey: Save reads the draft through settingsRef, and Reset takes
   * no input at all.
   */
  usePageHeader({
    ...APPEARANCE_HEADER,
    actions: (
      <>
        <button data-t1eq-action-button="true"
          type="button"
          onClick={handleSave}
          data-t1eq-qbit-id="appearance-settings-save"
          data-t1eq-qbit-type="action-button"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className={primaryButtonClass}
        >
          Save Appearance
        </button>

        <button data-t1eq-action-button="true"
          type="button"
          onClick={handleReset}
          data-t1eq-qbit-id="appearance-settings-reset"
          data-t1eq-qbit-type="action-button"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className={dangerButtonClass}
        >
          Reset
        </button>
      </>
    ),
  });

  return (
    <div className={pageClass}>
      {statusMessage && (
        <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="appearance-settings-status-message" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          {statusMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section data-t1eq-page-card="true" data-t1eq-qbit-id="appearance-settings-logo" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className={sectionClass}>
          <h2 data-t1eq-qbit-id="appearance-settings-logo-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-black text-black">Logo</h2>
          <p data-t1eq-qbit-id="appearance-settings-logo-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-sm font-semibold text-zinc-600">
            Uploading a logo saves it into local browser storage and applies it
            to the sidebar business card and output templates that show the
            company logo.
          </p>

          <div className="mt-5 grid gap-4">
            <label className="space-y-2">
              <span data-t1eq-qbit-id="appearance-settings-logo-upload-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className={labelClass}>Upload Logo</span>
              <input data-t1eq-field="true"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                data-t1eq-qbit-id="appearance-settings-logo-upload"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span data-t1eq-qbit-id="appearance-settings-logo-url-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className={labelClass}>Logo URL / Data URL</span>
              <textarea data-t1eq-field="true"
                value={settings.logoUrl}
                onChange={(event) =>
                  updateDraft({
                    logoUrl: event.target.value,
                  })
                }
                rows={4}
                data-t1eq-qbit-id="appearance-settings-logo-url"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={inputClass}
                placeholder="Upload a logo or paste an image URL."
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button data-t1eq-action-button="true"
                type="button"
                onClick={handleSave}
                data-t1eq-qbit-id="appearance-settings-logo-save"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={primaryButtonClass}
              >
                Save Logo
              </button>

              <button data-t1eq-action-button="true"
                type="button"
                onClick={handleRemoveLogo}
                data-t1eq-qbit-id="appearance-settings-logo-remove"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={secondaryButtonClass}
              >
                Remove Logo
              </button>
            </div>
          </div>
        </section>

        <aside data-t1eq-page-card="true" data-t1eq-qbit-id="appearance-settings-logo-preview" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className={sectionClass}>
          <h2 data-t1eq-qbit-id="appearance-settings-logo-preview-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-black text-black">Logo Preview</h2>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-5 rounded-3xl border border-zinc-200 bg-zinc-950 p-5 text-white">
            <div data-t1eq-tile="true" data-t1eq-page-card="true"
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

        <section data-t1eq-page-card="true" data-t1eq-qbit-id="appearance-settings-tiles" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className={sectionClass}>
          <h2 data-t1eq-qbit-id="appearance-settings-tiles-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-black text-black">Dashboard Tiles</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span data-t1eq-qbit-id="appearance-settings-tile-orientation-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className={labelClass}>Tile Orientation</span>
              <select data-t1eq-field="true"
                value={settings.tileOrientation}
                onChange={(event) =>
                  updateDraft({
                    tileOrientation: event.target.value as TileOrientation,
                  })
                }
                data-t1eq-qbit-id="appearance-settings-tile-orientation"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
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
              <span data-t1eq-qbit-id="appearance-settings-tile-size-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className={labelClass}>Tile Size</span>
              <select data-t1eq-field="true"
                value={settings.tileSize}
                onChange={(event) =>
                  updateDraft({
                    tileSize: event.target.value as TileSize,
                  })
                }
                data-t1eq-qbit-id="appearance-settings-tile-size"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
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

        <section data-t1eq-page-card="true" data-t1eq-qbit-id="appearance-settings-typography" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className={sectionClass}>
          <h2 data-t1eq-qbit-id="appearance-settings-typography-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-black text-black">Typography</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span data-t1eq-qbit-id="appearance-settings-font-family-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className={labelClass}>Font Family</span>
              <select data-t1eq-field="true"
                value={settings.fontFamily}
                onChange={(event) =>
                  updateDraft({
                    fontFamily: event.target.value as AppFontFamily,
                  })
                }
                data-t1eq-qbit-id="appearance-settings-font-family"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
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
              <span data-t1eq-qbit-id="appearance-settings-font-size-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className={labelClass}>Font Size</span>
              <select data-t1eq-field="true"
                value={settings.fontSize}
                onChange={(event) =>
                  updateDraft({
                    fontSize: event.target.value as AppFontSize,
                  })
                }
                data-t1eq-qbit-id="appearance-settings-font-size"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
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

        <section data-t1eq-page-card="true" data-t1eq-qbit-id="appearance-settings-3d-effects" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className={sectionClass}>
          <h2 data-t1eq-qbit-id="appearance-settings-3d-effects-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-black text-black">3D Effects</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span data-t1eq-qbit-id="appearance-settings-sidebar-depth-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className={labelClass}>Sidebar Depth</span>
              <select data-t1eq-field="true"
                value={settings.sidebarThreeDEffect}
                onChange={(event) =>
                  updateDraft({
                    sidebarThreeDEffect: event.target
                      .value as ThreeDEffectLevel,
                  })
                }
                data-t1eq-qbit-id="appearance-settings-sidebar-depth"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
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
              <span data-t1eq-qbit-id="appearance-settings-page-depth-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className={labelClass}>Page Card Depth</span>
              <select data-t1eq-field="true"
                value={settings.pageThreeDEffect}
                onChange={(event) =>
                  updateDraft({
                    pageThreeDEffect: event.target.value as ThreeDEffectLevel,
                  })
                }
                data-t1eq-qbit-id="appearance-settings-page-depth"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
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

        <section data-t1eq-page-card="true" data-t1eq-qbit-id="appearance-settings-preview-tiles" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className={sectionClass}>
          <h2 data-t1eq-qbit-id="appearance-settings-preview-tiles-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-black text-black">Preview Tiles</h2>

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

        <section
          data-t1eq-page-card="true"
          data-t1eq-qbit-id="appearance-settings-qbit-scopes"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className={`${sectionClass} xl:col-span-2`}
        >
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div>
              <h2 data-t1eq-qbit-id="appearance-settings-qbit-scopes-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-black text-black">
                Q-Bit Context Scopes
              </h2>
              <p data-t1eq-qbit-id="appearance-settings-qbit-scopes-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 max-w-4xl text-sm font-semibold text-zinc-600">
                Q-Bit now has page and output scopes. Later, the floating
                editor will use these scopes to show only controls that apply to
                the current page or output surface.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {settings.qBitScopes.map((scope) => {
              const qbitScopeCardId = `appearance-settings-qbit-scope-${scope.id}`;

              return (
              <div data-t1eq-tile="true" data-t1eq-page-card="true"
                key={scope.id}
                data-t1eq-qbit-id={qbitScopeCardId}
                data-t1eq-qbit-type="tile"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p data-t1eq-qbit-id={`${qbitScopeCardId}-type`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xs font-black uppercase tracking-wide text-zinc-500">
                      {scope.type} Scope
                    </p>
                    <h3 data-t1eq-qbit-id={`${qbitScopeCardId}-label`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-lg font-black text-black">
                      {scope.label}
                    </h3>
                  </div>

                  <span data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id={`${qbitScopeCardId}-groups-count`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-black text-zinc-700">
                    {scope.editableGroups.length} groups
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {scope.editableGroups.map((group) => (
                    <span
                      key={`${scope.id}-${group}`}
                      className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-700 ring-1 ring-zinc-200"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        </section>

        <section
          data-t1eq-page-card="true"
          data-t1eq-qbit-id="appearance-settings-output-templates"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className={`${sectionClass} xl:col-span-2`}
        >
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div>
              <h2 data-t1eq-qbit-id="appearance-settings-output-templates-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-black text-black">
                Output Templates
              </h2>
              <p data-t1eq-qbit-id="appearance-settings-output-templates-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 max-w-4xl text-sm font-semibold text-zinc-600">
                Configure the presentation layer for printable and email-ready
                invoices and work orders. These controls do not change invoice
                or repair order facts; they only control output layout.
              </p>
            </div>

            <button data-t1eq-action-button="true"
              type="button"
              onClick={handleSave}
              data-t1eq-qbit-id="appearance-settings-output-templates-save"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className={primaryButtonClass}
            >
              Save Output Settings
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            {settings.outputTemplates.map((template) => {
              const allowedPlacements =
                getTemplateAllowedAdvertisingPlacements(template);
              const selectableAdvertisingBlocks = activeAdvertisingBlocks.filter(
                (block) => allowedPlacements.includes(block.placement)
              );
              const templateQbitId = `appearance-settings-output-template-${template.scope.replace(/\s+/g, "-").toLowerCase()}`;

              return (
                <div data-t1eq-tile="true" data-t1eq-page-card="true"
                  key={template.scope}
                  data-t1eq-qbit-id={templateQbitId}
                  data-t1eq-qbit-type="tile"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p data-t1eq-qbit-id={`${templateQbitId}-overline`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xs font-black uppercase tracking-wide text-zinc-500">
                        Output Surface
                      </p>
                      <h3 data-t1eq-qbit-id={`${templateQbitId}-title`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-xl font-black text-black">
                        {template.scope}
                      </h3>
                      <p data-t1eq-qbit-id={`${templateQbitId}-description`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-sm font-semibold text-zinc-600">
                        {getOutputTemplateDescription(template.scope)}
                      </p>
                    </div>

                    <label data-t1eq-tile="true" data-t1eq-page-card="true" className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-black text-black">
                      <input data-t1eq-field="true"
                        type="checkbox"
                        checked={template.enabled}
                        onChange={(event) =>
                          updateOutputTemplate(template.scope, {
                            enabled: event.target.checked,
                          })
                        }
                        data-t1eq-qbit-id={`${templateQbitId}-enabled`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className={smallLabelClass}>Header Layout</span>
                      <select data-t1eq-field="true"
                        value={template.headerLayout}
                        onChange={(event) =>
                          updateOutputTemplate(template.scope, {
                            headerLayout: event.target
                              .value as OutputHeaderLayout,
                          })
                        }
                        data-t1eq-qbit-id={`${templateQbitId}-header-layout`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      >
                        {outputHeaderLayoutOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Footer Layout</span>
                      <select data-t1eq-field="true"
                        value={template.footerLayout}
                        onChange={(event) =>
                          updateOutputTemplate(template.scope, {
                            footerLayout: event.target
                              .value as OutputFooterLayout,
                          })
                        }
                        data-t1eq-qbit-id={`${templateQbitId}-footer-layout`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      >
                        {outputFooterLayoutOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Density</span>
                      <select data-t1eq-field="true"
                        value={template.density}
                        onChange={(event) =>
                          updateOutputTemplate(template.scope, {
                            density: event.target
                              .value as OutputTemplateDensity,
                          })
                        }
                        data-t1eq-qbit-id={`${templateQbitId}-density`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      >
                        {outputTemplateDensityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>
                        Advertising Placement
                      </span>
                      <select data-t1eq-field="true"
                        value={template.advertisingPlacement}
                        onChange={(event) =>
                          updateOutputTemplate(template.scope, {
                            advertisingPlacement: event.target
                              .value as OutputAdvertisingPlacement,
                            activeAdvertisingBlockIds: [],
                          })
                        }
                        data-t1eq-qbit-id={`${templateQbitId}-advertising-placement`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      >
                        {outputAdvertisingPlacementOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-5 grid gap-2 md:grid-cols-2">
                    {[
                      ["showLogo", "Show Logo"],
                      ["showCustomerSummary", "Customer Summary"],
                      ["showEquipmentSummary", "Equipment Summary"],
                      ["showRepairOrderReference", "RO Reference"],
                      ["showTechnicianSummary", "Technician Summary"],
                      ["showTerms", "Terms"],
                      ["showSignatureLine", "Signature Line"],
                    ].map(([key, label]) => (
                      <label data-t1eq-tile="true" data-t1eq-page-card="true"
                        key={`${template.scope}-${key}`}
                        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-700"
                      >
                        <input data-t1eq-field="true"
                          type="checkbox"
                          checked={
                            template[
                              key as keyof Pick<
                                OutputTemplateSettings,
                                | "showLogo"
                                | "showCustomerSummary"
                                | "showEquipmentSummary"
                                | "showRepairOrderReference"
                                | "showTechnicianSummary"
                                | "showTerms"
                                | "showSignatureLine"
                              >
                            ] as boolean
                          }
                          onChange={(event) =>
                            updateOutputTemplate(template.scope, {
                              [key]: event.target.checked,
                            } as Partial<OutputTemplateSettings>)
                          }
                          data-t1eq-qbit-id={`${templateQbitId}-${key}`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id={`${templateQbitId}-advertising`} data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className={smallLabelClass}>Selected Advertising</p>

                    {selectableAdvertisingBlocks.length === 0 ? (
                      <p className="mt-2 text-sm font-semibold text-zinc-500">
                        No active advertising blocks match this template
                        placement.
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-2">
                        {selectableAdvertisingBlocks.map((block) => (
                          <label data-t1eq-tile="true" data-t1eq-page-card="true"
                            key={`${template.scope}-${block.id}`}
                            className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-700"
                          >
                            <input data-t1eq-field="true"
                              type="checkbox"
                              checked={template.activeAdvertisingBlockIds.includes(
                                block.id
                              )}
                              onChange={() =>
                                toggleOutputTemplateAdvertisingBlock(
                                  template.scope,
                                  block.id
                                )
                              }
                              data-t1eq-qbit-id={`${templateQbitId}-advertising-${block.id}`}
                              data-t1eq-qbit-type="field"
                              data-t1eq-qbit-scope={QBIT_SCOPE}
                              className="mt-1"
                            />
                            <span>
                              <span className="block text-black">
                                {block.title}
                              </span>
                              <span className="block text-xs text-zinc-500">
                                {block.placement}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          data-t1eq-page-card="true"
          data-t1eq-qbit-id="appearance-settings-advertising-blocks"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className={`${sectionClass} xl:col-span-2`}
        >
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div>
              <h2 data-t1eq-qbit-id="appearance-settings-advertising-blocks-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-black text-black">
                Advertising Blocks
              </h2>
              <p data-t1eq-qbit-id="appearance-settings-advertising-blocks-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 max-w-4xl text-sm font-semibold text-zinc-600">
                Create reusable advertising blocks for invoice tops, invoice
                bottoms, work order bottoms, and email bodies.
              </p>
            </div>

            <button data-t1eq-action-button="true"
              type="button"
              onClick={addAdvertisingBlock}
              data-t1eq-qbit-id="appearance-settings-advertising-blocks-add"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className={secondaryButtonClass}
            >
              Add Advertising Block
            </button>
          </div>

          {settings.advertisingBlocks.length === 0 ? (
            <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="appearance-settings-advertising-blocks-empty" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
              <h3 data-t1eq-qbit-id="appearance-settings-advertising-blocks-empty-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xl font-black text-black">
                No advertising blocks yet
              </h3>
              <p data-t1eq-qbit-id="appearance-settings-advertising-blocks-empty-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-sm font-semibold text-zinc-600">
                Add one to place promotions, service reminders, or customer
                notices into invoices, work orders, and emails.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5">
              {settings.advertisingBlocks.map((block) => {
                const advertisingBlockQbitId = `appearance-settings-advertising-block-${block.id}`;

                return (
                <div data-t1eq-tile="true" data-t1eq-page-card="true"
                  key={block.id}
                  data-t1eq-qbit-id={advertisingBlockQbitId}
                  data-t1eq-qbit-type="tile"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <p data-t1eq-qbit-id={`${advertisingBlockQbitId}-overline`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xs font-black uppercase tracking-wide text-zinc-500">
                        Advertising Block
                      </p>
                      <h3 data-t1eq-qbit-id={`${advertisingBlockQbitId}-title`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-xl font-black text-black">
                        {block.title || "Untitled Advertising Block"}
                      </h3>
                      <p data-t1eq-qbit-id={`${advertisingBlockQbitId}-subtitle`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-sm font-semibold text-zinc-600">
                        {block.placement} ·{" "}
                        {block.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label data-t1eq-tile="true" data-t1eq-page-card="true" className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-black text-black">
                        <input data-t1eq-field="true"
                          type="checkbox"
                          checked={block.isActive}
                          onChange={(event) =>
                            updateAdvertisingBlock(block.id, {
                              isActive: event.target.checked,
                            })
                          }
                          data-t1eq-qbit-id={`${advertisingBlockQbitId}-active`}
                          data-t1eq-qbit-type="field"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                        />
                        Active
                      </label>

                      <button data-t1eq-action-button="true"
                        type="button"
                        onClick={() => deleteAdvertisingBlock(block.id)}
                        data-t1eq-qbit-id={`${advertisingBlockQbitId}-delete`}
                        data-t1eq-qbit-type="action-button"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={dangerButtonClass}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className={smallLabelClass}>Title</span>
                      <input data-t1eq-field="true"
                        type="text"
                        value={block.title}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            title: event.target.value,
                          })
                        }
                        data-t1eq-qbit-id={`${advertisingBlockQbitId}-title-field`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Placement</span>
                      <select data-t1eq-field="true"
                        value={block.placement}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            placement: event.target
                              .value as AdvertisingBlockPlacement,
                          })
                        }
                        data-t1eq-qbit-id={`${advertisingBlockQbitId}-placement`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      >
                        {advertisingBlockPlacementOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Headline</span>
                      <input data-t1eq-field="true"
                        type="text"
                        value={block.headline}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            headline: event.target.value,
                          })
                        }
                        data-t1eq-qbit-id={`${advertisingBlockQbitId}-headline`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Call To Action</span>
                      <input data-t1eq-field="true"
                        type="text"
                        value={block.callToAction}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            callToAction: event.target.value,
                          })
                        }
                        data-t1eq-qbit-id={`${advertisingBlockQbitId}-call-to-action`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Expiration Date</span>
                      <input data-t1eq-field="true"
                        type="date"
                        value={block.expirationDate}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            expirationDate: event.target.value,
                          })
                        }
                        data-t1eq-qbit-id={`${advertisingBlockQbitId}-expiration`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Image Upload</span>
                      <input data-t1eq-field="true"
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          void handleAdvertisingImageUpload(block.id, event)
                        }
                        data-t1eq-qbit-id={`${advertisingBlockQbitId}-image-upload`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
                    <label className="space-y-2">
                      <span className={smallLabelClass}>Body Text</span>
                      <textarea data-t1eq-field="true"
                        value={block.bodyText}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            bodyText: event.target.value,
                          })
                        }
                        rows={5}
                        data-t1eq-qbit-id={`${advertisingBlockQbitId}-body-text`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className={smallInputClass}
                      />
                    </label>

                    <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id={`${advertisingBlockQbitId}-preview`} data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <p className={smallLabelClass}>Preview</p>

                      {block.imageUrl ? (
                        <div data-t1eq-tile="true" data-t1eq-page-card="true"
                          className="mt-3 h-28 rounded-xl border border-zinc-200 bg-cover bg-center"
                          style={{
                            backgroundImage: `url("${block.imageUrl}")`,
                          }}
                        />
                      ) : (
                        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-3 flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-xs font-black uppercase tracking-wide text-zinc-400">
                          No Image
                        </div>
                      )}

                      <h4 className="mt-3 text-base font-black text-black">
                        {block.headline || block.title}
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-zinc-600">
                        {block.bodyText || "Advertising body text preview."}
                      </p>
                      {block.callToAction && (
                        <p className="mt-2 text-sm font-black text-orange-700">
                          {block.callToAction}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}