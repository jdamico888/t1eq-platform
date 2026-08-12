"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getSites,
  type Site,
} from "@/services/site";

type SiteSelectorProps = {
  customerId?: string;
  value?: string;
  onSelect: (site: Site) => void;
  placeholder?: string;
};

export default function SiteSelector({
  customerId,
  value,
  onSelect,
  placeholder = "Search site...",
}: SiteSelectorProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [search, setSearch] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const allSites = getSites();

    if (customerId) {
      setSites(
        allSites.filter(
          (site) => site.customerId === customerId
        )
      );
    } else {
      setSites(allSites);
    }
  }, [customerId]);

  const filteredSites = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return sites;

    return sites.filter((site) => {
      return (
        site.name.toLowerCase().includes(normalizedSearch) ||
        site.customerName
          .toLowerCase()
          .includes(normalizedSearch) ||
        Boolean(
          site.city?.toLowerCase().includes(normalizedSearch)
        ) ||
        Boolean(
          site.state?.toLowerCase().includes(normalizedSearch)
        )
      );
    });
  }, [sites, search]);

  function handleSelect(site: Site) {
    setSearch(site.name);
    setIsOpen(false);
    onSelect(site);
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500"
        placeholder={placeholder}
        value={search}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setSearch(event.target.value);
          setIsOpen(true);
        }}
      />

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
          {filteredSites.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">
              No sites found.
            </div>
          )}

          {filteredSites.map((site) => (
            <button
              key={site.id}
              type="button"
              onClick={() => handleSelect(site)}
              className="block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/10"
            >
              <div className="font-medium">
                {site.name}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {site.customerName}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {[site.city, site.state]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}