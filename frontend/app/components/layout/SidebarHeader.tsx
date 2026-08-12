"use client";

import Image from "next/image";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  APP_SETTINGS_UPDATED_EVENT,
  getAppSettings,
} from "../../../services/app-settings";

export default function SidebarHeader() {
  const [companyName, setCompanyName] =
    useState("Tier One Equipment");

  const [logoPath, setLogoPath] =
    useState("");

  useEffect(() => {
    function loadSettings() {
      const settings =
        getAppSettings();

      setCompanyName(
        settings.companyName ||
          "Tier One Equipment"
      );

      setLogoPath(
        settings.logoPath || ""
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
    <Link
      href="/dashboard"
      className="
        flex
        items-center
        gap-4
        rounded-2xl
        bg-white/20
        border
        border-black/10
        p-4
        hover:bg-white/30
        transition
      "
    >
      <div
        className="
          relative
          h-14
          w-14
          shrink-0
          overflow-hidden
          rounded-xl
          bg-black/5
          border
          border-black/10
        "
      >
        {logoPath ? (
          <Image
            src={logoPath}
            alt={companyName}
            fill
            className="object-contain p-1"
          />
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              items-center
              justify-center
              text-xl
              font-black
              text-black
            "
          >
            T1
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div
          className="
            truncate
            text-lg
            font-black
            text-black
            leading-tight
          "
        >
          {companyName}
        </div>

        <div
          className="
            text-sm
            text-black/60
          "
        >
          Operational Platform
        </div>
      </div>
    </Link>
  );
}