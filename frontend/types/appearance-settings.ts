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

export type AppearanceSettings = {
  logoUrl: string;

  tileOrientation: TileOrientation;
  tileSize: TileSize;

  fontFamily: AppFontFamily;
  fontSize: AppFontSize;

  sidebarThreeDEffect: ThreeDEffectLevel;
  pageThreeDEffect: ThreeDEffectLevel;

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

  updatedDate: string;
};