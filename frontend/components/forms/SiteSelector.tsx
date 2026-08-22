"use client";

import { useEffect, useMemo, useState } from "react";

import { getSites } from "@/services/site";

type SiteOption = {
  id: string;
  name: string;
  customerName: string;
};

type SiteSelectorProps = {
  value: string;
  onChange: (value: string) => void;

  customerName?: string;

  label?: string;
  placeholder?: string;

  qbitId?: string;
  qbitScope?: string;

  disabled?: boolean;
  required?: boolean;

  className?: string;
};

export default function SiteSelector({
  value,
  onChange,
  customerName = "",
  label = "Site",
  placeholder = "Select Site",
  qbitId,
  qbitScope = "global",
  disabled = false,
  required = false,
  className = "",
}: SiteSelectorProps) {
  const [sites, setSites] = useState<SiteOption[]>([]);

  useEffect(() => {
    const siteRecords = getSites();

    setSites(
      siteRecords.map((site) => ({
        id: site.id,
        name: site.name,
        customerName: site.customerName,
      }))
    );
  }, []);

  const availableSites = useMemo(() => {
    const normalizedCustomerName = customerName
      .trim()
      .toLowerCase();

    const filteredSites = normalizedCustomerName
      ? sites.filter(
          (site) =>
            site.customerName.trim().toLowerCase() ===
            normalizedCustomerName
        )
      : sites;

    return [...filteredSites].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [sites, customerName]);

  const hasSitesForCustomer = availableSites.length > 0;

  return (
    <label
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={
        qbitId ? `${qbitId}-wrapper` : undefined
      }
      data-t1eq-qbit-scope={
        qbitId ? qbitScope : undefined
      }
      className="block"
    >
      {label && (
        <span
          data-t1eq-qbit-type={
            qbitId ? "text" : undefined
          }
          data-t1eq-qbit-id={
            qbitId ? `${qbitId}-label` : undefined
          }
          data-t1eq-qbit-scope={
            qbitId ? qbitScope : undefined
          }
          className="mb-1 block text-sm font-medium"
        >
          {label}
        </span>
      )}

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled || !hasSitesForCustomer}
        required={required}
        data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={qbitId || undefined}
        data-t1eq-qbit-scope={
          qbitId ? qbitScope : undefined
        }
        className={`w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <option value="">
          {hasSitesForCustomer
            ? placeholder
            : "No Sites — Customer Location"}
        </option>

        {availableSites.map((site) => (
          <option
            key={site.id}
            value={site.name}
          >
            {site.name}
          </option>
        ))}
      </select>
    </label>
  );
}