"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  InventoryLocation,
  InventoryLocationType,
} from "../../../types/inventory-location";

import {
  createInventoryLocation,
  deleteInventoryLocation,
  getInventoryLocations,
} from "../../../services/inventory-locations";

const QBIT_SCOPE = "inventory-locations";

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

const primaryButtonClass =
  "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80 active:scale-[0.99]";

const secondaryButtonClass =
  "rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100 active:scale-[0.99]";

const dangerButtonClass =
  "rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100";

const ADDABLE_LOCATION_TYPES: InventoryLocationType[] = ["Warehouse", "Custom"];

function isCustomLocation(location: InventoryLocation) {
  return location.id.startsWith("LOC-");
}

function getTypeBadgeClass(type: InventoryLocationType) {
  if (type === "Warehouse") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (type === "Truck") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  return "border-zinc-300 bg-zinc-100 text-zinc-600";
}

export default function InventoryLocationsPage() {
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<InventoryLocationType>("Warehouse");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    setLocations(getInventoryLocations());
  }

  const filteredLocations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return locations;
    }

    return locations.filter((location) => {
      return (
        location.name.toLowerCase().includes(normalizedSearch) ||
        location.type.toLowerCase().includes(normalizedSearch) ||
        (location.notes ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [locations, searchTerm]);

  function handleAddLocation() {
    if (!newName.trim()) {
      alert("Location name is required.");
      return;
    }

    createInventoryLocation({
      name: newName.trim(),
      type: newType,
      notes: newNotes.trim() || undefined,
    });

    setNewName("");
    setNewType("Warehouse");
    setNewNotes("");

    refreshData();
  }

  function handleRemoveLocation(locationId: string) {
    deleteInventoryLocation(locationId);
    refreshData();
  }

  return (
    <main className={pageClass}>
      <div className="mx-auto max-w-7xl space-y-6">
        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-locations-header"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-locations-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-5xl font-bold text-black"
              >
                Inventory Locations
              </h1>

              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-locations-description"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-lg text-black/70"
              >
                Manage where stock lives. The default Warehouse and active
                truck stock locations always appear here automatically —
                add additional warehouses or other custom stock locations
                below.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/inventory"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="inventory-locations-link-inventory"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={secondaryButtonClass}
              >
                Inventory
              </a>

              <a href="/inventory/items"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="inventory-locations-link-items"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className={secondaryButtonClass}
              >
                Inventory Items
              </a>

              <button data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="inventory-locations-refresh"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="button"
                onClick={refreshData}
                className={primaryButtonClass}
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-locations-add-section"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="inventory-locations-add-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-2xl font-bold"
          >
            Add Location
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <label className="space-y-1 md:col-span-2">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-locations-add-name-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-sm font-semibold text-black/70"
              >
                Location Name
              </span>

              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="inventory-locations-add-name"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="e.g. Warehouse 2 - North Yard"
                className={inputClass}
              />
            </label>

            <label className="space-y-1">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-locations-add-type-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-sm font-semibold text-black/70"
              >
                Type
              </span>

              <select data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="inventory-locations-add-type"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={newType}
                onChange={(event) =>
                  setNewType(event.target.value as InventoryLocationType)
                }
                className={inputClass}
              >
                {ADDABLE_LOCATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-locations-add-notes-label"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-sm font-semibold text-black/70"
              >
                Notes
              </span>

              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="inventory-locations-add-notes"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={newNotes}
                onChange={(event) => setNewNotes(event.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </label>
          </div>

          <div className="mt-4">
            <button data-t1eq-action-button="true"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="inventory-locations-add-submit"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="button"
              onClick={handleAddLocation}
              className={primaryButtonClass}
            >
              + Add Location
            </button>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-locations-search-section"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <label className="space-y-1">
            <span
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="inventory-locations-search-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-semibold text-black/70"
            >
              Search Locations
            </span>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="inventory-locations-search"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, type, or notes..."
              className={inputClass}
            />
          </label>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="inventory-locations-list"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="inventory-locations-list-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-3xl font-bold"
          >
            All Locations
          </h2>

          {filteredLocations.length === 0 ? (
            <div data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="page-card"
              data-t1eq-qbit-id="inventory-locations-empty"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-locations-empty-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-xl font-bold"
              >
                No locations found
              </div>

              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="inventory-locations-empty-description"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-black/60"
              >
                Try a different search, or add a location above.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredLocations.map((location) => {
                const locationQbitId = `inventory-locations-item-${location.id}`;
                const removable = isCustomLocation(location);

                return (
                  <div data-t1eq-tile="true" data-t1eq-page-card="true"
                    key={location.id}
                    data-t1eq-qbit-type="tile"
                    data-t1eq-qbit-id={locationQbitId}
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-lg font-bold">{location.name}</div>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getTypeBadgeClass(
                          location.type
                        )}`}
                      >
                        {location.type}
                      </span>
                    </div>

                    {location.notes && (
                      <div className="mt-2 text-sm text-black/60">
                        {location.notes}
                      </div>
                    )}

                    {removable && (
                      <div className="mt-3">
                        <button data-t1eq-action-button="true"
                          data-t1eq-qbit-type="action-button"
                          data-t1eq-qbit-id={`${locationQbitId}-remove`}
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          type="button"
                          onClick={() => handleRemoveLocation(location.id)}
                          className={dangerButtonClass}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
