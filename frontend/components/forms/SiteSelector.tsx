"use client";

import { useMemo } from "react";

import FormAutocomplete from "@/components/forms/FormAutocomplete";

import { getSites } from "@/services/site";

type SiteSelectorProps = {
  value?: string;

  customerName?: string;

  onChange: (value: string) => void;

  label?: string;
};

export default function SiteSelector({
  value = "",
  customerName,
  onChange,
  label = "Site",
}: SiteSelectorProps) {
  const sites = getSites();

  const siteNames =
    useMemo(() => {
      return sites
        .filter((site) => {
          if (!customerName)
            return true;

          return (
            site.customerName ===
            customerName
          );
        })
        .map(
          (site) => site.name
        )
        .sort();
    }, [sites, customerName]);

  return (
    <FormAutocomplete
      label={label}
      value={value}
      options={siteNames}
      placeholder="Select or search site..."
      onChange={onChange}
    />
  );
}