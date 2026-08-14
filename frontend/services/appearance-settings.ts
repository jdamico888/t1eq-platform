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
  QBitEditableGroup,
  QBitOutputScope,
  QBitPageScope,
  QBitScope,
  QBitScopeType,
  ThreeDEffectLevel,
  TileOrientation,
  TileSize,
} from "@/types/appearance-settings";

const STORAGE_KEY = "t1eq-appearance-settings";

export const qBitPageScopes: QBitPageScope[] = [
  "Dashboard",
  "Repair Order Detail",
  "Invoice Detail",
];

export const qBitOutputScopes: QBitOutputScope[] = [
  "Printable Invoice",
  "Email Invoice",
  "Printable Work Order",
  "Email Work Order",
];

export const qBitEditableGroups: QBitEditableGroup[] = [
  "Global Appearance",
  "Page Background",
  "Page Cards",
  "Dashboard Tiles",
  "Sidebar",
  "Invoice Header",
  "Invoice Line Items",
  "Invoice Totals",
  "Invoice Footer",
  "Work Order Header",
  "Work Order Tasks",
  "Work Order Footer",
  "Email Body",
  "Advertising Blocks",
];

export const outputTemplateDensityOptions: OutputTemplateDensity[] = [
  "Compact",
  "Standard",
  "Detailed",
];

export const outputHeaderLayoutOptions: OutputHeaderLayout[] = [
  "Logo Left",
  "Centered",
  "Minimal",
];

export const outputFooterLayoutOptions: OutputFooterLayout[] = [
  "Standard",
  "Payment Focused",
  "Legal Focused",
];

export const outputAdvertisingPlacementOptions: OutputAdvertisingPlacement[] = [
  "None",
  "Top",
  "Bottom",
  "Both",
  "Email Body",
];

export const advertisingBlockPlacementOptions: AdvertisingBlockPlacement[] = [
  "Invoice Top",
  "Invoice Bottom",
  "Work Order Bottom",
  "Email Body",
];

export const defaultQBitScopes: QBitScope[] = [
  {
    id: "page-dashboard",
    type: "Page",
    label: "Dashboard",
    editableGroups: [
      "Global Appearance",
      "Page Background",
      "Page Cards",
      "Dashboard Tiles",
      "Sidebar",
    ],
  },
  {
    id: "page-repair-order-detail",
    type: "Page",
    label: "Repair Order Detail",
    editableGroups: [
      "Global Appearance",
      "Page Background",
      "Page Cards",
      "Sidebar",
    ],
  },
  {
    id: "page-invoice-detail",
    type: "Page",
    label: "Invoice Detail",
    editableGroups: [
      "Global Appearance",
      "Page Background",
      "Page Cards",
      "Sidebar",
    ],
  },
  {
    id: "output-printable-invoice",
    type: "Output",
    label: "Printable Invoice",
    editableGroups: [
      "Invoice Header",
      "Invoice Line Items",
      "Invoice Totals",
      "Invoice Footer",
      "Advertising Blocks",
    ],
  },
  {
    id: "output-email-invoice",
    type: "Output",
    label: "Email Invoice",
    editableGroups: ["Email Body", "Invoice Totals", "Advertising Blocks"],
  },
  {
    id: "output-printable-work-order",
    type: "Output",
    label: "Printable Work Order",
    editableGroups: [
      "Work Order Header",
      "Work Order Tasks",
      "Work Order Footer",
      "Advertising Blocks",
    ],
  },
  {
    id: "output-email-work-order",
    type: "Output",
    label: "Email Work Order",
    editableGroups: ["Email Body", "Work Order Tasks", "Advertising Blocks"],
  },
];

export const defaultOutputTemplates: OutputTemplateSettings[] = [
  {
    scope: "Printable Invoice",
    enabled: true,
    headerLayout: "Logo Left",
    footerLayout: "Payment Focused",
    density: "Standard",
    showLogo: true,
    showCustomerSummary: true,
    showEquipmentSummary: true,
    showRepairOrderReference: true,
    showTechnicianSummary: false,
    showTerms: true,
    showSignatureLine: false,
    advertisingPlacement: "Bottom",
    activeAdvertisingBlockIds: [],
  },
  {
    scope: "Email Invoice",
    enabled: true,
    headerLayout: "Minimal",
    footerLayout: "Standard",
    density: "Compact",
    showLogo: true,
    showCustomerSummary: true,
    showEquipmentSummary: false,
    showRepairOrderReference: true,
    showTechnicianSummary: false,
    showTerms: true,
    showSignatureLine: false,
    advertisingPlacement: "Email Body",
    activeAdvertisingBlockIds: [],
  },
  {
    scope: "Printable Work Order",
    enabled: true,
    headerLayout: "Logo Left",
    footerLayout: "Standard",
    density: "Detailed",
    showLogo: true,
    showCustomerSummary: true,
    showEquipmentSummary: true,
    showRepairOrderReference: true,
    showTechnicianSummary: true,
    showTerms: false,
    showSignatureLine: true,
    advertisingPlacement: "Bottom",
    activeAdvertisingBlockIds: [],
  },
  {
    scope: "Email Work Order",
    enabled: true,
    headerLayout: "Minimal",
    footerLayout: "Standard",
    density: "Standard",
    showLogo: true,
    showCustomerSummary: true,
    showEquipmentSummary: true,
    showRepairOrderReference: true,
    showTechnicianSummary: true,
    showTerms: false,
    showSignatureLine: false,
    advertisingPlacement: "Email Body",
    activeAdvertisingBlockIds: [],
  },
];

export const defaultAdvertisingBlocks: AdvertisingBlock[] = [];

export const defaultAppearanceSettings: AppearanceSettings = {
  logoUrl: "",
  logoPlacement: "Task Bar",

  tileOrientation: "Grid",
  tileSize: "Medium",

  fontFamily: "System",
  fontSize: "Medium",

  sidebarThreeDEffect: "Subtle",
  pageThreeDEffect: "Subtle",

  sidebarItemBackgroundColor: "#18181b",
  sidebarItemTextColor: "#ffffff",
  sidebarItemActiveBackgroundColor: "#f97316",
  sidebarItemActiveTextColor: "#ffffff",

  balloonBackgroundColor: "#020617",
  balloonTextColor: "#ffffff",
  balloonBorderColor: "#fb923c",

  accentHue: 24,
  accentColor: "#e26209",

  tileBackgroundColor: "#ffffff",
  tileBorderColor: "#e4e4e7",

  sidebarBackgroundColor: "#09090b",
  pageBackgroundColor: "#f4f4f5",

  qBitScopes: defaultQBitScopes,
  outputTemplates: defaultOutputTemplates,
  advertisingBlocks: defaultAdvertisingBlocks,

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

export const logoPlacementOptions: LogoPlacement[] = [
  "Task Bar",
  "Page Background",
  "Both",
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

function valueIsOneOf<T extends string>(
  value: unknown,
  options: readonly T[]
): value is T {
  return typeof value === "string" && options.includes(value as T);
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

function normalizeString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value !== "boolean") {
    return fallback;
  }

  return value;
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

function normalizeEditableGroups(value: unknown): QBitEditableGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is QBitEditableGroup =>
    valueIsOneOf(entry, qBitEditableGroups)
  );
}

function normalizeQBitScope(
  scope: unknown,
  fallback: QBitScope
): QBitScope {
  if (!scope || typeof scope !== "object") {
    return fallback;
  }

  const partialScope = scope as Partial<QBitScope>;

  const scopeType: QBitScopeType = valueIsOneOf(partialScope.type, [
    "Page",
    "Output",
  ])
    ? partialScope.type
    : fallback.type;

  const pageOrOutputLabel =
    scopeType === "Page"
      ? valueIsOneOf(partialScope.label, qBitPageScopes)
        ? partialScope.label
        : fallback.label
      : valueIsOneOf(partialScope.label, qBitOutputScopes)
        ? partialScope.label
        : fallback.label;

  const editableGroups = normalizeEditableGroups(partialScope.editableGroups);

  return {
    id: normalizeString(partialScope.id, fallback.id),
    type: scopeType,
    label: pageOrOutputLabel,
    editableGroups:
      editableGroups.length > 0 ? editableGroups : fallback.editableGroups,
  };
}

function normalizeQBitScopes(value: unknown): QBitScope[] {
  if (!Array.isArray(value)) {
    return defaultQBitScopes;
  }

  return defaultQBitScopes.map((fallbackScope) => {
    const matchingScope = value.find(
      (scope) =>
        scope &&
        typeof scope === "object" &&
        (scope as Partial<QBitScope>).id === fallbackScope.id
    );

    return normalizeQBitScope(matchingScope, fallbackScope);
  });
}

function normalizeOutputTemplateSettings(
  template: unknown,
  fallback: OutputTemplateSettings
): OutputTemplateSettings {
  if (!template || typeof template !== "object") {
    return fallback;
  }

  const partialTemplate = template as Partial<OutputTemplateSettings>;

  return {
    scope: valueIsOneOf(partialTemplate.scope, qBitOutputScopes)
      ? partialTemplate.scope
      : fallback.scope,
    enabled: normalizeBoolean(partialTemplate.enabled, fallback.enabled),
    headerLayout: valueIsOneOf(
      partialTemplate.headerLayout,
      outputHeaderLayoutOptions
    )
      ? partialTemplate.headerLayout
      : fallback.headerLayout,
    footerLayout: valueIsOneOf(
      partialTemplate.footerLayout,
      outputFooterLayoutOptions
    )
      ? partialTemplate.footerLayout
      : fallback.footerLayout,
    density: valueIsOneOf(
      partialTemplate.density,
      outputTemplateDensityOptions
    )
      ? partialTemplate.density
      : fallback.density,
    showLogo: normalizeBoolean(partialTemplate.showLogo, fallback.showLogo),
    showCustomerSummary: normalizeBoolean(
      partialTemplate.showCustomerSummary,
      fallback.showCustomerSummary
    ),
    showEquipmentSummary: normalizeBoolean(
      partialTemplate.showEquipmentSummary,
      fallback.showEquipmentSummary
    ),
    showRepairOrderReference: normalizeBoolean(
      partialTemplate.showRepairOrderReference,
      fallback.showRepairOrderReference
    ),
    showTechnicianSummary: normalizeBoolean(
      partialTemplate.showTechnicianSummary,
      fallback.showTechnicianSummary
    ),
    showTerms: normalizeBoolean(partialTemplate.showTerms, fallback.showTerms),
    showSignatureLine: normalizeBoolean(
      partialTemplate.showSignatureLine,
      fallback.showSignatureLine
    ),
    advertisingPlacement: valueIsOneOf(
      partialTemplate.advertisingPlacement,
      outputAdvertisingPlacementOptions
    )
      ? partialTemplate.advertisingPlacement
      : fallback.advertisingPlacement,
    activeAdvertisingBlockIds: Array.isArray(
      partialTemplate.activeAdvertisingBlockIds
    )
      ? partialTemplate.activeAdvertisingBlockIds.filter(
          (entry): entry is string => typeof entry === "string"
        )
      : fallback.activeAdvertisingBlockIds,
  };
}

function normalizeOutputTemplates(value: unknown): OutputTemplateSettings[] {
  if (!Array.isArray(value)) {
    return defaultOutputTemplates;
  }

  return defaultOutputTemplates.map((fallbackTemplate) => {
    const matchingTemplate = value.find(
      (template) =>
        template &&
        typeof template === "object" &&
        (template as Partial<OutputTemplateSettings>).scope ===
          fallbackTemplate.scope
    );

    return normalizeOutputTemplateSettings(matchingTemplate, fallbackTemplate);
  });
}

function normalizeAdvertisingBlock(block: unknown): AdvertisingBlock | null {
  if (!block || typeof block !== "object") {
    return null;
  }

  const partialBlock = block as Partial<AdvertisingBlock>;

  if (typeof partialBlock.id !== "string" || !partialBlock.id.trim()) {
    return null;
  }

  return {
    id: partialBlock.id,
    title: normalizeString(partialBlock.title, "Untitled Advertising Block"),
    placement: valueIsOneOf(
      partialBlock.placement,
      advertisingBlockPlacementOptions
    )
      ? partialBlock.placement
      : "Invoice Bottom",
    imageUrl: normalizeString(partialBlock.imageUrl),
    headline: normalizeString(partialBlock.headline),
    bodyText: normalizeString(partialBlock.bodyText),
    callToAction: normalizeString(partialBlock.callToAction),
    expirationDate: normalizeString(partialBlock.expirationDate),
    isActive: normalizeBoolean(partialBlock.isActive, true),
    updatedDate: normalizeString(
      partialBlock.updatedDate,
      new Date().toISOString()
    ),
  };
}

function normalizeAdvertisingBlocks(value: unknown): AdvertisingBlock[] {
  if (!Array.isArray(value)) {
    return defaultAdvertisingBlocks;
  }

  return value
    .map((block) => normalizeAdvertisingBlock(block))
    .filter((block): block is AdvertisingBlock => Boolean(block));
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
    logoPlacement: valueIsOneOf(settings.logoPlacement, logoPlacementOptions)
      ? settings.logoPlacement
      : defaultAppearanceSettings.logoPlacement,

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

    sidebarItemBackgroundColor: normalizeColor(
      settings.sidebarItemBackgroundColor,
      defaultAppearanceSettings.sidebarItemBackgroundColor
    ),
    sidebarItemTextColor: normalizeColor(
      settings.sidebarItemTextColor,
      defaultAppearanceSettings.sidebarItemTextColor
    ),
    sidebarItemActiveBackgroundColor: normalizeColor(
      settings.sidebarItemActiveBackgroundColor,
      defaultAppearanceSettings.sidebarItemActiveBackgroundColor
    ),
    sidebarItemActiveTextColor: normalizeColor(
      settings.sidebarItemActiveTextColor,
      defaultAppearanceSettings.sidebarItemActiveTextColor
    ),

    balloonBackgroundColor: normalizeColor(
      settings.balloonBackgroundColor,
      defaultAppearanceSettings.balloonBackgroundColor
    ),
    balloonTextColor: normalizeColor(
      settings.balloonTextColor,
      defaultAppearanceSettings.balloonTextColor
    ),
    balloonBorderColor: normalizeColor(
      settings.balloonBorderColor,
      defaultAppearanceSettings.balloonBorderColor
    ),

    qBitScopes: normalizeQBitScopes(settings.qBitScopes),
    outputTemplates: normalizeOutputTemplates(settings.outputTemplates),
    advertisingBlocks: normalizeAdvertisingBlocks(settings.advertisingBlocks),

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

export function getQBitScopeById(scopeId: string): QBitScope | null {
  return getAppearanceSettings().qBitScopes.find(
    (scope) => scope.id === scopeId
  ) ?? null;
}

export function getOutputTemplateSettings(
  scope: QBitOutputScope
): OutputTemplateSettings {
  return (
    getAppearanceSettings().outputTemplates.find(
      (template) => template.scope === scope
    ) ??
    defaultOutputTemplates.find((template) => template.scope === scope) ??
    defaultOutputTemplates[0]
  );
}

export function saveOutputTemplateSettings(
  template: OutputTemplateSettings
): OutputTemplateSettings {
  const currentSettings = getAppearanceSettings();
  const normalizedTemplate = normalizeOutputTemplateSettings(template, template);

  const nextTemplates = currentSettings.outputTemplates.map((currentTemplate) =>
    currentTemplate.scope === normalizedTemplate.scope
      ? normalizedTemplate
      : currentTemplate
  );

  saveAppearanceSettings({
    ...currentSettings,
    outputTemplates: nextTemplates,
  });

  return normalizedTemplate;
}

export function getAdvertisingBlocks(): AdvertisingBlock[] {
  return getAppearanceSettings().advertisingBlocks;
}

export function saveAdvertisingBlock(block: AdvertisingBlock): AdvertisingBlock {
  const currentSettings = getAppearanceSettings();
  const normalizedBlock = normalizeAdvertisingBlock(block);

  if (!normalizedBlock) {
    throw new Error("Invalid advertising block.");
  }

  const existingBlock = currentSettings.advertisingBlocks.find(
    (currentBlock) => currentBlock.id === normalizedBlock.id
  );

  const nextBlock: AdvertisingBlock = {
    ...(existingBlock ?? normalizedBlock),
    ...normalizedBlock,
    updatedDate: new Date().toISOString(),
  };

  const nextBlocks = existingBlock
    ? currentSettings.advertisingBlocks.map((currentBlock) =>
        currentBlock.id === nextBlock.id ? nextBlock : currentBlock
      )
    : [...currentSettings.advertisingBlocks, nextBlock];

  saveAppearanceSettings({
    ...currentSettings,
    advertisingBlocks: nextBlocks,
  });

  return nextBlock;
}

export function deleteAdvertisingBlock(blockId: string): void {
  const currentSettings = getAppearanceSettings();

  saveAppearanceSettings({
    ...currentSettings,
    advertisingBlocks: currentSettings.advertisingBlocks.filter(
      (block) => block.id !== blockId
    ),
    outputTemplates: currentSettings.outputTemplates.map((template) => ({
      ...template,
      activeAdvertisingBlockIds: template.activeAdvertisingBlockIds.filter(
        (activeBlockId) => activeBlockId !== blockId
      ),
    })),
  });
}




