"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  APP_SETTINGS_UPDATED_EVENT,
  getAppSettings,
} from "../../../services/app-settings";

export default function SidebarHeader() {
  const [companyName, setCompanyName] = useState("Tier One Equipment");

  useEffect(() => {
    function loadSettings() {
      const settings = getAppSettings();

      setCompanyName(settings.companyName || "Tier One Equipment");
    }

    loadSettings();

    window.addEventListener(APP_SETTINGS_UPDATED_EVENT, loadSettings);

    return () => {
      window.removeEventListener(APP_SETTINGS_UPDATED_EVENT, loadSettings);
    };
  }, []);

  return (
    <Link
      href="/dashboard"
      data-t1eq-business-card="true"
      className="
        flex
        min-h-28
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-black/10
        bg-white/20
        bg-contain
        bg-center
        bg-no-repeat
        p-4
        text-center
        transition
        hover:bg-white/30
      "
    >
      <div
        className="
          max-w-full
          truncate
          text-lg
          font-black
          leading-tight
          text-black
        "
      >
        {companyName}
      </div>

      <div
        className="
          mt-1
          text-xs
          font-black
          uppercase
          tracking-[0.22em]
          text-black/60
        "
      >
        Operations Platform
      </div>
    </Link>
  );
}