"use client";

import type {
  ReactNode,
} from "react";

import {
  useEffect,
  useState,
} from "react";

import {
  APP_SETTINGS_UPDATED_EVENT,
  getAppSettings,
} from "../../../services/app-settings";

type AppBackgroundProps = {
  children?: ReactNode;
};

export default function AppBackground({
  children,
}: AppBackgroundProps) {
  const [wallpaperPath, setWallpaperPath] =
    useState("");

  useEffect(() => {
    function loadSettings() {
      const settings =
        getAppSettings();

      setWallpaperPath(
        settings.wallpaperPath || ""
      );
    }

    loadSettings();

    window.addEventListener(
      APP_SETTINGS_UPDATED_EVENT,
      loadSettings
    );

    return () => {
      window.removeEventListener(
        APP_SETTINGS_UPDATED_EVENT,
        loadSettings
      );
    };
  }, []);

  return (
    <div
      className="
        min-h-screen
        bg-cover
        bg-center
        bg-fixed
        bg-no-repeat
      "
      style={{
        backgroundImage: wallpaperPath
          ? `url(${wallpaperPath})`
          : undefined,
      }}
    >
      <div
        className="
          min-h-screen
          bg-black/10
          backdrop-blur-[2px]
        "
      >
        {children}
      </div>
    </div>
  );
}