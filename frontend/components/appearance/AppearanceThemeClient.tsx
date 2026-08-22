"use client";

import { useEffect } from "react";

import { getAppearanceSettings } from "@/services/appearance-settings";

function hexToRgb(hexColor: string) {
  const cleanHexColor = hexColor.trim();

  if (!/^#[0-9A-Fa-f]{6}$/.test(cleanHexColor)) {
    return null;
  }

  return {
    r: parseInt(cleanHexColor.slice(1, 3), 16),
    g: parseInt(cleanHexColor.slice(3, 5), 16),
    b: parseInt(cleanHexColor.slice(5, 7), 16),
  };
}

function getSoftAccentColor(hexColor: string) {
  const rgbColor = hexToRgb(hexColor);

  if (!rgbColor) {
    return "rgb(226 98 9 / 0.12)";
  }

  return `rgb(${rgbColor.r} ${rgbColor.g} ${rgbColor.b} / 0.12)`;
}

function applyAppearanceSettings() {
  const settings = getAppearanceSettings();
  const root = document.documentElement;

  root.dataset.t1eqFontFamily = settings.fontFamily;
  root.dataset.t1eqFontSize = settings.fontSize;
  root.dataset.t1eqTileOrientation = settings.tileOrientation;
  root.dataset.t1eqTileSize = settings.tileSize;
  root.dataset.t1eqSidebarDepth = settings.sidebarThreeDEffect;
  root.dataset.t1eqPageDepth = settings.pageThreeDEffect;
  root.dataset.t1eqLogoPlacement = settings.logoPlacement;

  root.style.setProperty("--t1eq-accent-color", settings.accentColor);
  root.style.setProperty(
    "--t1eq-accent-color-soft",
    getSoftAccentColor(settings.accentColor)
  );

  root.style.setProperty(
    "--t1eq-tile-background-color",
    settings.tileBackgroundColor
  );

  root.style.setProperty(
    "--t1eq-tile-border-color",
    settings.tileBorderColor
  );

  root.style.setProperty(
    "--t1eq-sidebar-background-color",
    settings.sidebarBackgroundColor
  );

  root.style.setProperty(
    "--t1eq-sidebar-button-color",
    settings.sidebarButtonColor
  );

  root.style.setProperty(
    "--t1eq-sidebar-button-text-color",
    settings.sidebarButtonTextColor
  );

  root.style.setProperty(
    "--t1eq-page-background-color",
    settings.pageBackgroundColor
  );

  root.style.setProperty(
    "--t1eq-balloon-background-color",
    settings.balloonBackgroundColor
  );

  root.style.setProperty(
    "--t1eq-balloon-text-color",
    settings.balloonTextColor
  );

  if (settings.logoUrl.trim().length > 0) {
    root.style.setProperty("--t1eq-logo-url", `url("${settings.logoUrl}")`);
  } else {
    root.style.removeProperty("--t1eq-logo-url");
  }
}

export default function AppearanceThemeClient() {
  useEffect(() => {
    applyAppearanceSettings();

    function handleStorageChange(event: StorageEvent) {
      if (event.key === "t1eq-appearance-settings") {
        applyAppearanceSettings();
      }
    }

    function handleAppearanceChange() {
      applyAppearanceSettings();
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "t1eq-appearance-settings-changed",
      handleAppearanceChange
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "t1eq-appearance-settings-changed",
        handleAppearanceChange
      );
    };
  }, []);

  return null;
}