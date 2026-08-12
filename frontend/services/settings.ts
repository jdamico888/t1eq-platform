import { AppSettings }
from "../types/settings";

import {
  settings as defaultSettings,
} from "../data/settings";

const STORAGE_KEY =
  "appSettings";

export function getSettings():
AppSettings {

  if (
    typeof window ===
    "undefined"
  ) {
    return defaultSettings;
  }

  const savedSettings =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!savedSettings) {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultSettings
      )
    );

    return defaultSettings;
  }

  return JSON.parse(
    savedSettings
  );
}

export function saveSettings(
  settings: AppSettings
) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      settings
    )
  );
}