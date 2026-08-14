export type TileOrientation = "Grid" | "List" | "Compact";
export type TileSize = "Small" | "Medium" | "Large";
export type AppFontFamily =
  | "System"
  | "Inter"
  | "Arial"
  | "Georgia"
  | "Courier New";
export type AppFontSize = "Small" | "Medium" | "Large" | "Extra Large";
export type ThreeDEffectLevel = "Off" | "Subtle" | "Medium" | "Strong";
export type LogoPlacement = "Task Bar" | "Page Background" | "Both";

export type QBitPageScope =
  | "Dashboard"
  | "Repair Order Detail"
  | "Invoice Detail";

export type QBitOutputScope =
  | "Printable Invoice"
  | "Email Invoice"
  | "Printable Work Order"
  | "Email Work Order";

export type QBitScopeType = "Page" | "Output";

export type QBitEditableGroup =
  | "Global Appearance"
  | "Page Background"
  | "Page Cards"
  | "Dashboard Tiles"
  | "Sidebar"
  | "Invoice Header"
  | "Invoice Line Items"
  | "Invoice Totals"
  | "Invoice Footer"
  | "Work Order Header"
  | "Work Order Tasks"
  | "Work Order Footer"
  | "Email Body"
  | "Advertising Blocks";

export type QBitScope = {
  id: string;
  type: QBitScopeType;
  label: QBitPageScope | QBitOutputScope;
  editableGroups: QBitEditableGroup[];
};

export type OutputTemplateDensity = "Compact" | "Standard" | "Detailed";
export type OutputHeaderLayout = "Logo Left" | "Centered" | "Minimal";
export type OutputFooterLayout = "Standard" | "Payment Focused" | "Legal Focused";
export type OutputAdvertisingPlacement =
  | "None"
  | "Top"
  | "Bottom"
  | "Both"
  | "Email Body";

export type OutputTemplateSettings = {
  scope: QBitOutputScope;
  enabled: boolean;

  headerLayout: OutputHeaderLayout;
  footerLayout: OutputFooterLayout;
  density: OutputTemplateDensity;

  showLogo: boolean;
  showCustomerSummary: boolean;
  showEquipmentSummary: boolean;
  showRepairOrderReference: boolean;
  showTechnicianSummary: boolean;
  showTerms: boolean;
  showSignatureLine: boolean;

  advertisingPlacement: OutputAdvertisingPlacement;
  activeAdvertisingBlockIds: string[];
};

export type AdvertisingBlockPlacement =
  | "Invoice Top"
  | "Invoice Bottom"
  | "Work Order Bottom"
  | "Email Body";

export type AdvertisingBlock = {
  id: string;
  title: string;
  placement: AdvertisingBlockPlacement;
  imageUrl: string;
  headline: string;
  bodyText: string;
  callToAction: string;
  expirationDate: string;
  isActive: boolean;
  updatedDate: string;
};

export type AppearanceSettings = {
  logoUrl: string;
  logoPlacement: LogoPlacement;

  tileOrientation: TileOrientation;
  tileSize: TileSize;

  fontFamily: AppFontFamily;
  fontSize: AppFontSize;

  sidebarThreeDEffect: ThreeDEffectLevel;
  pageThreeDEffect: ThreeDEffectLevel;

  sidebarItemBackgroundColor: string;
  sidebarItemTextColor: string;
  sidebarItemActiveBackgroundColor: string;
  sidebarItemActiveTextColor: string;

  balloonBackgroundColor: string;
  balloonTextColor: string;
  balloonBorderColor: string;

  /**
   * Kept for backward compatibility with older saved appearance settings.
   * New color control uses accentColor directly.
   */
  accentHue: number;

  /**
   * Exact color selected from the color palette.
   */
  accentColor: string;

  /**
   * Exact normal tile background color.
   */
  tileBackgroundColor: string;

  /**
   * Exact normal tile border color.
   */
  tileBorderColor: string;

  /**
   * Exact sidebar background color.
   */
  sidebarBackgroundColor: string;

  /**
   * Exact main page/background color.
   */
  pageBackgroundColor: string;

  qBitScopes: QBitScope[];
  outputTemplates: OutputTemplateSettings[];
  advertisingBlocks: AdvertisingBlock[];

  updatedDate: string;
};


