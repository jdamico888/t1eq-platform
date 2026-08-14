"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import ColorSwatchPicker from "@/components/appearance/ColorSwatchPicker";

import type {
  AdvertisingBlock,
  AdvertisingBlockPlacement,
  AppearanceSettings,
  LogoPlacement,
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
  logoPlacementOptions,
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

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";
const headerClass =
  "mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
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
  "rounded-xl bg-[var(--t1eq-sidebar-item-active-background-color)] px-5 py-3 text-sm font-black text-[var(--t1eq-sidebar-item-active-text-color)] shadow-sm transition hover:brightness-110";
const secondaryButtonClass =
  "rounded-xl border border-[var(--t1eq-sidebar-item-active-background-color)] bg-[var(--t1eq-sidebar-item-background-color)] px-5 py-3 text-sm font-black text-[var(--t1eq-sidebar-item-text-color)] shadow-sm transition hover:brightness-110";
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
      const imageUrl = await readFileAsDataUrl(file);

      updateAdvertisingBlock(blockId, {
        imageUrl,
      });

      setStatusMessage("Advertising image added to draft. Save to keep it.");
    } catch {
      setStatusMessage("Advertising image upload failed.");
    }
  }

  function handleSave() {
    const updatedSettings = saveAppearanceSettings(settings);

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
            <p className="mt-2 max-w-4xl text-base font-semibold text-zinc-600">
              Control the app appearance, Q-Bit page scopes, invoice/work order
              output templates, and reusable advertising blocks.
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
            to the sidebar business card and output templates that show the
            company logo.
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

            <label className="space-y-2">
              <span className={labelClass}>Logo Placement</span>
              <select
                value={settings.logoPlacement}
                onChange={(event) =>
                  updateDraft({
                    logoPlacement: event.target.value as LogoPlacement,
                  })
                }
                className={inputClass}
              >
                {logoPlacementOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
          <p className="mt-1 text-sm font-semibold text-zinc-600">
            Preview where the saved logo will appear based on the selected
            placement.
          </p>

          <div className="mt-5 space-y-4 rounded-3xl border border-zinc-200 bg-zinc-950 p-5 text-white">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-white/50">
                Task Bar
              </p>

              <div className="mt-4 flex flex-col items-center text-center">
                <div
                  className="flex h-20 w-full max-w-[190px] items-center justify-center rounded-xl border border-white/10 bg-white/5 bg-contain bg-center bg-no-repeat text-xl font-black text-white"
                  style={
                    settings.logoUrl &&
                    (settings.logoPlacement === "Task Bar" ||
                      settings.logoPlacement === "Both")
                      ? {
                          backgroundImage: `url("${settings.logoUrl}")`,
                        }
                      : undefined
                  }
                >
                  {(!settings.logoUrl ||
                    settings.logoPlacement === "Page Background") &&
                    "T1"}
                </div>

                <div className="mt-3 max-w-full truncate text-lg font-black leading-tight">
                  Tier One Equipment
                </div>

                <div className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-white/60">
                  Operations Platform
                </div>
              </div>
            </div>

            <div
              className="min-h-36 rounded-2xl border border-white/10 bg-zinc-100 p-4 text-black"
              style={
                settings.logoUrl &&
                (settings.logoPlacement === "Page Background" ||
                  settings.logoPlacement === "Both")
                  ? {
                      backgroundImage: `linear-gradient(rgb(244 244 245 / 0.9), rgb(244 244 245 / 0.9)), url("${settings.logoUrl}")`,
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "cover, min(80%, 260px) auto",
                    }
                  : undefined
              }
            >
              <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                Page Background
              </p>

              <div className="mt-8 rounded-xl border border-zinc-300 bg-white/85 p-4 shadow-sm">
                <p className="text-sm font-black text-black">
                  Current placement: {settings.logoPlacement}
                </p>
                <p className="mt-1 text-xs font-semibold text-zinc-600">
                  Page background placement uses the logo as a muted watermark,
                  not as text behind the sidebar brand.
                </p>
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

            <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-lg font-black text-black">Sidebar Button Edit</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className={labelClass}>Button Background</span>
                  <ColorSwatchPicker value={settings.sidebarItemBackgroundColor} onChange={(hex) => updateDraft({ sidebarItemBackgroundColor: hex })} />
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>Button Text</span>
                  <ColorSwatchPicker value={settings.sidebarItemTextColor} onChange={(hex) => updateDraft({ sidebarItemTextColor: hex })} />
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>Active Button Background</span>
                  <ColorSwatchPicker value={settings.sidebarItemActiveBackgroundColor} onChange={(hex) => updateDraft({ sidebarItemActiveBackgroundColor: hex })} />
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>Active Button Text</span>
                  <ColorSwatchPicker value={settings.sidebarItemActiveTextColor} onChange={(hex) => updateDraft({ sidebarItemActiveTextColor: hex })} />
                </label>
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-lg font-black text-black">Balloon Edit</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className={labelClass}>Balloon Background</span>
                  <ColorSwatchPicker value={settings.balloonBackgroundColor} onChange={(hex) => updateDraft({ balloonBackgroundColor: hex })} />
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>Balloon Text</span>
                  <ColorSwatchPicker value={settings.balloonTextColor} onChange={(hex) => updateDraft({ balloonTextColor: hex })} />
                </label>
                <label className="space-y-2">
                  <span className={labelClass}>Balloon Border</span>
                  <ColorSwatchPicker value={settings.balloonBorderColor} onChange={(hex) => updateDraft({ balloonBorderColor: hex })} />
                </label>
              </div>
            </div>
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

        <section
          data-t1eq-page-card="true"
          className={`${sectionClass} xl:col-span-2`}
        >
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div>
              <h2 className="text-2xl font-black text-black">
                Q-Bit Context Scopes
              </h2>
              <p className="mt-1 max-w-4xl text-sm font-semibold text-zinc-600">
                Q-Bit now has page and output scopes. Later, the floating
                editor will use these scopes to show only controls that apply to
                the current page or output surface.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {settings.qBitScopes.map((scope) => (
              <div
                key={scope.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                      {scope.type} Scope
                    </p>
                    <h3 className="mt-1 text-lg font-black text-black">
                      {scope.label}
                    </h3>
                  </div>

                  <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-black text-zinc-700">
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
            ))}
          </div>
        </section>

        <section
          data-t1eq-page-card="true"
          className={`${sectionClass} xl:col-span-2`}
        >
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div>
              <h2 className="text-2xl font-black text-black">
                Output Templates
              </h2>
              <p className="mt-1 max-w-4xl text-sm font-semibold text-zinc-600">
                Configure the presentation layer for printable and email-ready
                invoices and work orders. These controls do not change invoice
                or repair order facts; they only control output layout.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
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

              return (
                <div
                  key={template.scope}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                        Output Surface
                      </p>
                      <h3 className="mt-1 text-xl font-black text-black">
                        {template.scope}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-zinc-600">
                        {getOutputTemplateDescription(template.scope)}
                      </p>
                    </div>

                    <label className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-black text-black">
                      <input
                        type="checkbox"
                        checked={template.enabled}
                        onChange={(event) =>
                          updateOutputTemplate(template.scope, {
                            enabled: event.target.checked,
                          })
                        }
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className={smallLabelClass}>Header Layout</span>
                      <select
                        value={template.headerLayout}
                        onChange={(event) =>
                          updateOutputTemplate(template.scope, {
                            headerLayout: event.target
                              .value as OutputHeaderLayout,
                          })
                        }
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
                      <select
                        value={template.footerLayout}
                        onChange={(event) =>
                          updateOutputTemplate(template.scope, {
                            footerLayout: event.target
                              .value as OutputFooterLayout,
                          })
                        }
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
                      <select
                        value={template.density}
                        onChange={(event) =>
                          updateOutputTemplate(template.scope, {
                            density: event.target
                              .value as OutputTemplateDensity,
                          })
                        }
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
                      <select
                        value={template.advertisingPlacement}
                        onChange={(event) =>
                          updateOutputTemplate(template.scope, {
                            advertisingPlacement: event.target
                              .value as OutputAdvertisingPlacement,
                            activeAdvertisingBlockIds: [],
                          })
                        }
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
                      <label
                        key={`${template.scope}-${key}`}
                        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-700"
                      >
                        <input
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
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className={smallLabelClass}>Selected Advertising</p>

                    {selectableAdvertisingBlocks.length === 0 ? (
                      <p className="mt-2 text-sm font-semibold text-zinc-500">
                        No active advertising blocks match this template
                        placement.
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-2">
                        {selectableAdvertisingBlocks.map((block) => (
                          <label
                            key={`${template.scope}-${block.id}`}
                            className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-700"
                          >
                            <input
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
          className={`${sectionClass} xl:col-span-2`}
        >
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div>
              <h2 className="text-2xl font-black text-black">
                Advertising Blocks
              </h2>
              <p className="mt-1 max-w-4xl text-sm font-semibold text-zinc-600">
                Create reusable advertising blocks for invoice tops, invoice
                bottoms, work order bottoms, and email bodies.
              </p>
            </div>

            <button
              type="button"
              onClick={addAdvertisingBlock}
              className={secondaryButtonClass}
            >
              Add Advertising Block
            </button>
          </div>

          {settings.advertisingBlocks.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
              <h3 className="text-xl font-black text-black">
                No advertising blocks yet
              </h3>
              <p className="mt-2 text-sm font-semibold text-zinc-600">
                Add one to place promotions, service reminders, or customer
                notices into invoices, work orders, and emails.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5">
              {settings.advertisingBlocks.map((block) => (
                <div
                  key={block.id}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                        Advertising Block
                      </p>
                      <h3 className="mt-1 text-xl font-black text-black">
                        {block.title || "Untitled Advertising Block"}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-zinc-600">
                        {block.placement} Â·{" "}
                        {block.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm font-black text-black">
                        <input
                          type="checkbox"
                          checked={block.isActive}
                          onChange={(event) =>
                            updateAdvertisingBlock(block.id, {
                              isActive: event.target.checked,
                            })
                          }
                        />
                        Active
                      </label>

                      <button
                        type="button"
                        onClick={() => deleteAdvertisingBlock(block.id)}
                        className={dangerButtonClass}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className={smallLabelClass}>Title</span>
                      <input
                        type="text"
                        value={block.title}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            title: event.target.value,
                          })
                        }
                        className={smallInputClass}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Placement</span>
                      <select
                        value={block.placement}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            placement: event.target
                              .value as AdvertisingBlockPlacement,
                          })
                        }
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
                      <input
                        type="text"
                        value={block.headline}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            headline: event.target.value,
                          })
                        }
                        className={smallInputClass}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Call To Action</span>
                      <input
                        type="text"
                        value={block.callToAction}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            callToAction: event.target.value,
                          })
                        }
                        className={smallInputClass}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Expiration Date</span>
                      <input
                        type="date"
                        value={block.expirationDate}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            expirationDate: event.target.value,
                          })
                        }
                        className={smallInputClass}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className={smallLabelClass}>Image Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          void handleAdvertisingImageUpload(block.id, event)
                        }
                        className={smallInputClass}
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
                    <label className="space-y-2">
                      <span className={smallLabelClass}>Body Text</span>
                      <textarea
                        value={block.bodyText}
                        onChange={(event) =>
                          updateAdvertisingBlock(block.id, {
                            bodyText: event.target.value,
                          })
                        }
                        rows={5}
                        className={smallInputClass}
                      />
                    </label>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <p className={smallLabelClass}>Preview</p>

                      {block.imageUrl ? (
                        <div
                          className="mt-3 h-28 rounded-xl border border-zinc-200 bg-cover bg-center"
                          style={{
                            backgroundImage: `url("${block.imageUrl}")`,
                          }}
                        />
                      ) : (
                        <div className="mt-3 flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-xs font-black uppercase tracking-wide text-zinc-400">
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
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}



