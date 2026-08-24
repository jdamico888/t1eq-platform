"use client";

import { useEffect, useMemo, useState } from "react";

import type { InventoryItem } from "@/types/inventory-item";
import type { Truck, TruckStockItem } from "@/types/truck-stock";
import type { TechnicianProfile } from "@/types/technician-profile";

import { getInventoryItems } from "@/services/inventory";

import AddItemButton from "@/components/inventory/AddItemButton";

import {
  getTruckTransactionsByTruck,
  type TruckStockTransaction,
} from "@/services/truck-stock-transactions";

import {
  adjustTruckStockQuantity,
  createTruck,
  getTruckStockItemsByTruckId,
  getTrucks,
  transferInventoryToTruck,
  updateTruck,
} from "@/services/truck-stock";

import { getActiveTechnicianProfiles } from "@/services/technician-profiles";

const formatDate = (value?: string) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

const formatDateTime = (value?: string) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const QBIT_SCOPE = "truck-stock";

export default function TruckStockPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [technicianProfiles, setTechnicianProfiles] = useState<
    TechnicianProfile[]
  >([]);
  const [truckTransactions, setTruckTransactions] = useState<
    TruckStockTransaction[]
  >([]);

  const [selectedTruckId, setSelectedTruckId] = useState("");

  const [truckNumber, setTruckNumber] = useState("");
  const [truckName, setTruckName] = useState("");
  const [assignedTechnicianId, setAssignedTechnicianId] = useState("");

  const [inventorySearch, setInventorySearch] = useState("");
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState(1);

  const [adjustmentQuantities, setAdjustmentQuantities] = useState<
    Record<string, string>
  >({});

  const [adjustmentNotes, setAdjustmentNotes] = useState<
    Record<string, string>
  >({});

  const assignableTechnicians = useMemo(() => {
    return technicianProfiles.filter(
      (technician) =>
        technician.status === "Active" &&
        (technician.role === "Technician" || technician.role === "Inspector")
    );
  }, [technicianProfiles]);

  function reloadData(nextSelectedTruckId?: string) {
    const loadedTrucks = getTrucks();
    const activeTruckId = nextSelectedTruckId ?? selectedTruckId;

    setTrucks(loadedTrucks);
    setInventoryItems(getInventoryItems());
    setTechnicianProfiles(getActiveTechnicianProfiles());

    if (activeTruckId) {
      setTruckTransactions(getTruckTransactionsByTruck(activeTruckId));
    } else {
      setTruckTransactions([]);
    }

    if (!activeTruckId && loadedTrucks.length > 0) {
      setSelectedTruckId(loadedTrucks[0].id);
      setTruckTransactions(getTruckTransactionsByTruck(loadedTrucks[0].id));
    }
  }

  useEffect(() => {
    reloadData();
  }, []);

  useEffect(() => {
    if (!selectedTruckId) {
      setTruckTransactions([]);
      return;
    }

    setTruckTransactions(getTruckTransactionsByTruck(selectedTruckId));
  }, [selectedTruckId, trucks]);

  const selectedTruck = useMemo(() => {
    return trucks.find((truck) => truck.id === selectedTruckId) ?? null;
  }, [trucks, selectedTruckId]);

  const truckStockItems: TruckStockItem[] = useMemo(() => {
    if (!selectedTruckId) return [];

    return getTruckStockItemsByTruckId(selectedTruckId);
  }, [selectedTruckId, trucks]);

  const lowStockTruckItems = truckStockItems.filter((stockItem) => {
    if (stockItem.minimumQuantity === undefined) {
      return false;
    }

    return stockItem.quantityOnTruck <= stockItem.minimumQuantity;
  });

  const inventorySearchResults = useMemo(() => {
    const search = inventorySearch.trim().toLowerCase();

    if (!search) return [];

    return inventoryItems
      .filter((item) => {
        return (
          item.partNumber.toLowerCase().includes(search) ||
          item.name.toLowerCase().includes(search) ||
          (item.description ?? "").toLowerCase().includes(search) ||
          (item.manufacturer ?? "").toLowerCase().includes(search) ||
          (item.supplierName ?? "").toLowerCase().includes(search) ||
          (item.oemPartNumber ?? "").toLowerCase().includes(search) ||
          (item.vendorPartNumber ?? "").toLowerCase().includes(search) ||
          (item.crossReferencePartNumbers ?? []).some((partNumber) =>
            partNumber.toLowerCase().includes(search)
          ) ||
          (item.supersededPartNumbers ?? []).some((partNumber) =>
            partNumber.toLowerCase().includes(search)
          )
        );
      })
      .slice(0, 10);
  }, [inventorySearch, inventoryItems]);

  function handleCreateTruck() {
    if (!truckNumber.trim() || !truckName.trim()) {
      return;
    }

    const assignedTechnician =
      assignableTechnicians.find(
        (technician) => technician.id === assignedTechnicianId
      ) ?? null;

    const truck = createTruck({
      truckNumber: truckNumber.trim(),
      name: truckName.trim(),

      assignedTechnicianId: assignedTechnician?.id ?? undefined,
      assignedTechnicianName: assignedTechnician
        ? assignedTechnician.displayName
        : undefined,

      status: "Active",
    });

    setTruckNumber("");
    setTruckName("");
    setAssignedTechnicianId("");

    setSelectedTruckId(truck.id);
    reloadData(truck.id);
  }

  function handleUpdateTruckAssignment(
    truck: Truck,
    assignedTechnicianProfileId: string
  ) {
    const assignedTechnician =
      assignableTechnicians.find(
        (technician) => technician.id === assignedTechnicianProfileId
      ) ?? null;

    updateTruck(truck.id, {
      assignedTechnicianId: assignedTechnician?.id ?? undefined,
      assignedTechnicianName: assignedTechnician
        ? assignedTechnician.displayName
        : undefined,
    });

    reloadData(selectedTruckId);
  }

  function handleTransferToTruck() {
    if (!selectedTruckId || !selectedInventoryItemId) {
      return;
    }

    transferInventoryToTruck(
      selectedTruckId,
      selectedInventoryItemId,
      transferQuantity
    );

    setInventorySearch("");
    setSelectedInventoryItemId("");
    setTransferQuantity(1);

    reloadData(selectedTruckId);
  }

  function handleReplenishTruckStock(stockItem: TruckStockItem) {
    if (!selectedTruckId) {
      return;
    }

    if (stockItem.idealQuantity === undefined) {
      return;
    }

    const replenishQuantity = Math.max(
      stockItem.idealQuantity - stockItem.quantityOnTruck,
      0
    );

    if (replenishQuantity <= 0) {
      return;
    }

    transferInventoryToTruck(
      selectedTruckId,
      stockItem.inventoryItemId,
      replenishQuantity
    );

    reloadData(selectedTruckId);
  }

  function handleAdjustTruckStock(stockItem: TruckStockItem) {
    const quantityValue = adjustmentQuantities[stockItem.id];

    if (quantityValue === undefined || quantityValue.trim() === "") {
      return;
    }

    const newQuantity = Number(quantityValue);

    if (Number.isNaN(newQuantity)) {
      return;
    }

    adjustTruckStockQuantity(
      stockItem.id,
      newQuantity,
      adjustmentNotes[stockItem.id] || "Field truck stock count adjusted."
    );

    setAdjustmentQuantities((currentValues) => ({
      ...currentValues,
      [stockItem.id]: "",
    }));

    setAdjustmentNotes((currentValues) => ({
      ...currentValues,
      [stockItem.id]: "",
    }));

    reloadData(selectedTruckId);
  }

  const selectedInventoryItem = inventoryItems.find(
    (item) => item.id === selectedInventoryItemId
  );

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-header" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div data-t1eq-qbit-id="truck-stock-overline" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
                T1EQ Field Inventory
              </div>

              <h1 data-t1eq-qbit-id="truck-stock-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-4xl font-bold text-white">
                Truck Stock
              </h1>

              <p data-t1eq-qbit-id="truck-stock-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
                Add service trucks in the field, assign technicians or
                inspectors, load inventory from warehouse stock, replenish low
                truck stock, and track truck-level part quantities.
              </p>
            </div>

            {/*
              Pre-selects whichever truck is being viewed, so stocking a
              truck does not mean re-picking it in the modal. Location ids
              for trucks are "truck:{id}" — see services/inventory-locations.
            */}
            <AddItemButton
              qbitId="truck-stock-add-item"
              variant="dark"
              label="+ Add Item"
              initialLocationId={
                selectedTruckId ? `truck:${selectedTruckId}` : undefined
              }
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-add-truck" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
            <h2 data-t1eq-qbit-id="truck-stock-add-truck-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-bold text-white">Add Truck</h2>

            <div className="mt-5 space-y-4">
              <input data-t1eq-field="true"
                value={truckNumber}
                onChange={(event) => setTruckNumber(event.target.value)}
                data-t1eq-qbit-id="truck-stock-add-truck-number"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                placeholder="Truck number"
              />

              <input data-t1eq-field="true"
                value={truckName}
                onChange={(event) => setTruckName(event.target.value)}
                data-t1eq-qbit-id="truck-stock-add-truck-name"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                placeholder="Truck name"
              />

              <select data-t1eq-field="true"
                value={assignedTechnicianId}
                onChange={(event) =>
                  setAssignedTechnicianId(event.target.value)
                }
                data-t1eq-qbit-id="truck-stock-add-truck-technician"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              >
                <option value="">Unassigned technician / inspector</option>

                {assignableTechnicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.displayName}
                    {technician.employeeNumber
                      ? ` — ${technician.employeeNumber}`
                      : ""}
                    {technician.role ? ` — ${technician.role}` : ""}
                  </option>
                ))}
              </select>

              {assignableTechnicians.length === 0 && (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-add-truck-no-technicians" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                  No active technicians or inspectors found. Add employees in
                  Employee Setup first, or create the truck unassigned.
                </div>
              )}

              <button data-t1eq-action-button="true"
                type="button"
                onClick={handleCreateTruck}
                data-t1eq-qbit-id="truck-stock-add-truck-submit"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Add Truck
              </button>
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-trucks" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl lg:col-span-2">
            <h2 data-t1eq-qbit-id="truck-stock-trucks-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-bold text-white">Trucks</h2>

            {trucks.length === 0 ? (
              <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-trucks-empty" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-white/60">
                No trucks added yet.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {trucks.map((truck) => {
                  const truckQbitId = `truck-stock-truck-${truck.id}`;

                  return (
                  <button data-t1eq-action-button="true"
                    key={truck.id}
                    type="button"
                    onClick={() => setSelectedTruckId(truck.id)}
                    data-t1eq-qbit-id={truckQbitId}
                    data-t1eq-qbit-type="tile"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className={`rounded-2xl border p-5 text-left transition ${
                      truck.id === selectedTruckId
                        ? "border-blue-400/60 bg-blue-500/20"
                        : "border-white/10 bg-black/20 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-lg font-bold text-white">
                      {truck.name}
                    </div>

                    <div className="mt-1 text-sm text-white/60">
                      Truck #{truck.truckNumber}
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 text-xs uppercase tracking-wide text-white/40">
                        Tech / Inspector
                      </div>

                      <select data-t1eq-field="true"
                        value={truck.assignedTechnicianId ?? ""}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation();
                          handleUpdateTruckAssignment(
                            truck,
                            event.target.value
                          );
                        }}
                        data-t1eq-qbit-id={`${truckQbitId}-technician`}
                        data-t1eq-qbit-type="field"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Unassigned</option>

                        {assignableTechnicians.map((technician) => (
                          <option key={technician.id} value={technician.id}>
                            {technician.displayName}
                            {technician.employeeNumber
                              ? ` — ${technician.employeeNumber}`
                              : ""}
                            {technician.role ? ` — ${technician.role}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-2 text-xs uppercase tracking-wide text-white/40">
                      {truck.status}
                    </div>
                  </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {selectedTruck && (
          <section data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-detail" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <h2 data-t1eq-qbit-id="truck-stock-detail-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-2xl font-bold text-white">
                  {selectedTruck.name} Stock
                </h2>

                <p data-t1eq-qbit-id="truck-stock-detail-subtitle" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-sm text-white/60">
                  Truck #{selectedTruck.truckNumber} •{" "}
                  {selectedTruck.assignedTechnicianName ?? "Unassigned"}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-metric-items" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-right">
                  <div data-t1eq-qbit-id="truck-stock-metric-items-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xs uppercase tracking-wide text-white/50">
                    Items On Truck
                  </div>

                  <div data-t1eq-qbit-id="truck-stock-metric-items-value" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-3xl font-bold text-white">
                    {truckStockItems.length}
                  </div>
                </div>

                <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-metric-low-stock" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-right">
                  <div data-t1eq-qbit-id="truck-stock-metric-low-stock-label" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xs uppercase tracking-wide text-white/50">
                    Low Stock
                  </div>

                  <div data-t1eq-qbit-id="truck-stock-metric-low-stock-value" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-3xl font-bold text-white">
                    {lowStockTruckItems.length}
                  </div>
                </div>
              </div>
            </div>

            <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-load-inventory" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 data-t1eq-qbit-id="truck-stock-load-inventory-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xl font-bold text-white">
                Load Inventory To Truck
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="relative md:col-span-2">
                  <input data-t1eq-field="true"
                    value={inventorySearch}
                    onChange={(event) => {
                      setInventorySearch(event.target.value);
                      setSelectedInventoryItemId("");
                    }}
                    data-t1eq-qbit-id="truck-stock-inventory-search"
                    data-t1eq-qbit-type="field"
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                    placeholder="Search inventory by part number, description, OEM, vendor, or cross-reference"
                  />

                  {inventorySearchResults.length > 0 && (
                    <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-inventory-search-results" data-t1eq-qbit-type="section" data-t1eq-qbit-scope={QBIT_SCOPE} className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
                      {inventorySearchResults.map((item) => (
                        <button data-t1eq-action-button="true"
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedInventoryItemId(item.id);
                            setInventorySearch(
                              `${item.partNumber} — ${item.name}`
                            );
                          }}
                          data-t1eq-qbit-id={`truck-stock-inventory-search-result-${item.id}`}
                          data-t1eq-qbit-type="action-button"
                          data-t1eq-qbit-scope={QBIT_SCOPE}
                          className="flex w-full items-center justify-between border-b border-white/5 px-3 py-2 text-left hover:bg-white/5"
                        >
                          <div>
                            <div className="text-sm font-medium text-white">
                              {item.partNumber}
                            </div>

                            <div className="text-xs text-white/60">
                              {item.name}
                            </div>
                          </div>

                          <div className="text-xs text-white/50">
                            Warehouse Qty: {item.quantityOnHand}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input data-t1eq-field="true"
                  type="number"
                  value={transferQuantity}
                  onChange={(event) =>
                    setTransferQuantity(Number(event.target.value) || 0)
                  }
                  data-t1eq-qbit-id="truck-stock-transfer-quantity"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                  min={0}
                  step="1"
                />
              </div>

              {selectedInventoryItem && (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-selected-inventory-item" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div data-t1eq-qbit-id="truck-stock-selected-inventory-item-name" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-sm font-semibold text-white">
                    Selected: {selectedInventoryItem.partNumber}
                  </div>

                  <div data-t1eq-qbit-id="truck-stock-selected-inventory-item-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-sm text-white/60">
                    {selectedInventoryItem.description ??
                      selectedInventoryItem.name}
                  </div>

                  <div data-t1eq-qbit-id="truck-stock-selected-inventory-item-qty" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 text-xs text-white/50">
                    Warehouse Qty: {selectedInventoryItem.quantityOnHand}
                  </div>
                </div>
              )}

              <button data-t1eq-action-button="true"
                type="button"
                onClick={handleTransferToTruck}
                data-t1eq-qbit-id="truck-stock-load-submit"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Load Selected Part To Truck
              </button>
            </div>

            <div className="mt-6">
              {truckStockItems.length === 0 ? (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-items-empty" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-white/60">
                  No stock on this truck yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {truckStockItems.map((stockItem) => {
                    const stockItemQbitId = `truck-stock-item-${stockItem.id}`;
                    const replenishQuantity =
                      stockItem.idealQuantity !== undefined
                        ? Math.max(
                            stockItem.idealQuantity -
                              stockItem.quantityOnTruck,
                            0
                          )
                        : null;

                    const isLowStock =
                      stockItem.minimumQuantity !== undefined &&
                      stockItem.quantityOnTruck <= stockItem.minimumQuantity;

                    return (
                      <div data-t1eq-tile="true" data-t1eq-page-card="true"
                        key={stockItem.id}
                        data-t1eq-qbit-id={stockItemQbitId}
                        data-t1eq-qbit-type="tile"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className="rounded-2xl border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div data-t1eq-qbit-id={`${stockItemQbitId}-part-number`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-lg font-bold text-white">
                              {stockItem.partNumber}
                            </div>

                            <div data-t1eq-qbit-id={`${stockItemQbitId}-description`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-sm text-white/60">
                              {stockItem.description}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs uppercase tracking-wide text-white/50">
                              On Truck
                            </div>

                            <div data-t1eq-qbit-id={`${stockItemQbitId}-on-truck`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-3xl font-bold text-white">
                              {stockItem.quantityOnTruck}
                            </div>

                            {isLowStock && (
                              <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id={`${stockItemQbitId}-low-stock-badge`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-2 rounded-full border border-red-400/30 bg-red-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-100">
                                Low Stock
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                          <div>
                            <div className="text-xs uppercase tracking-wide text-white/50">
                              Min
                            </div>

                            <div className="mt-1 text-white">
                              {stockItem.minimumQuantity ?? "Not set"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wide text-white/50">
                              Ideal
                            </div>

                            <div className="mt-1 text-white">
                              {stockItem.idealQuantity ?? "Not set"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wide text-white/50">
                              Replenish
                            </div>

                            <div className="mt-1 text-white">
                              {replenishQuantity ?? "Not set"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wide text-white/50">
                              Bin
                            </div>

                            <div className="mt-1 text-white">
                              {stockItem.binLocation ?? "Not set"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wide text-white/50">
                              Last Count
                            </div>

                            <div className="mt-1 text-white">
                              {formatDate(stockItem.lastCountDate)}
                            </div>
                          </div>
                        </div>

                        {stockItem.notes && (
                          <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id={`${stockItemQbitId}-notes`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-white/70">
                            {stockItem.notes}
                          </div>
                        )}

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <button data-t1eq-action-button="true"
                            type="button"
                            disabled={!replenishQuantity}
                            onClick={() => handleReplenishTruckStock(stockItem)}
                            data-t1eq-qbit-id={`${stockItemQbitId}-replenish`}
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            className="rounded-xl border border-green-400/30 bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-100 transition hover:bg-green-500/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
                          >
                            Replenish To Ideal
                          </button>

                          <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id={`${stockItemQbitId}-replenish-note`} data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                            {replenishQuantity && replenishQuantity > 0
                              ? `Load ${replenishQuantity} from warehouse`
                              : "No replenish needed"}
                          </div>
                        </div>

                        <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id={`${stockItemQbitId}-adjustment`} data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs uppercase tracking-wide text-white/50">
                            Field Count Adjustment
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <input data-t1eq-field="true"
                              type="number"
                              value={adjustmentQuantities[stockItem.id] ?? ""}
                              onChange={(event) =>
                                setAdjustmentQuantities((currentValues) => ({
                                  ...currentValues,
                                  [stockItem.id]: event.target.value,
                                }))
                              }
                              data-t1eq-qbit-id={`${stockItemQbitId}-adjustment-quantity`}
                              data-t1eq-qbit-type="field"
                              data-t1eq-qbit-scope={QBIT_SCOPE}
                              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                              placeholder="New count"
                              min={0}
                              step="1"
                            />

                            <input data-t1eq-field="true"
                              value={adjustmentNotes[stockItem.id] ?? ""}
                              onChange={(event) =>
                                setAdjustmentNotes((currentValues) => ({
                                  ...currentValues,
                                  [stockItem.id]: event.target.value,
                                }))
                              }
                              data-t1eq-qbit-id={`${stockItemQbitId}-adjustment-note`}
                              data-t1eq-qbit-type="field"
                              data-t1eq-qbit-scope={QBIT_SCOPE}
                              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white md:col-span-2"
                              placeholder="Adjustment note"
                            />
                          </div>

                          <button data-t1eq-action-button="true"
                            type="button"
                            onClick={() => handleAdjustTruckStock(stockItem)}
                            data-t1eq-qbit-id={`${stockItemQbitId}-adjustment-submit`}
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-scope={QBIT_SCOPE}
                            className="mt-3 rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
                          >
                            Adjust Truck Count
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-history" data-t1eq-qbit-type="page-card" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h3 data-t1eq-qbit-id="truck-stock-history-title" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="text-xl font-bold text-white">
                    Truck Stock Transaction History
                  </h3>

                  <p data-t1eq-qbit-id="truck-stock-history-description" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-1 text-sm text-white/60">
                    Loads, consumption, restorations, and field count
                    adjustments for this truck.
                  </p>
                </div>

                <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-history-count" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  {truckTransactions.length} Transaction
                  {truckTransactions.length === 1 ? "" : "s"}
                </div>
              </div>

              {truckTransactions.length === 0 ? (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-history-empty" data-t1eq-qbit-type="text" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
                  No truck stock transactions recorded yet.
                </div>
              ) : (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" data-t1eq-qbit-id="truck-stock-history-table" data-t1eq-qbit-type="section" data-t1eq-qbit-scope={QBIT_SCOPE} className="mt-4 overflow-hidden rounded-xl border border-white/10">
                  <div className="grid grid-cols-6 gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50">
                    <div>Type</div>
                    <div>Part</div>
                    <div>Qty</div>
                    <div>Before</div>
                    <div>After</div>
                    <div>Date</div>
                  </div>

                  <div className="divide-y divide-white/10">
                    {truckTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        data-t1eq-qbit-id={`truck-stock-history-transaction-${transaction.id}`}
                        data-t1eq-qbit-type="tile"
                        data-t1eq-qbit-scope={QBIT_SCOPE}
                        className="grid grid-cols-6 gap-3 px-4 py-3 text-sm text-white/80"
                      >
                        <div>
                          <div className="font-semibold text-white">
                            {transaction.type}
                          </div>

                          {transaction.createdBy && (
                            <div className="mt-1 text-xs text-white/40">
                              By {transaction.createdBy}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="font-medium text-white">
                            {transaction.partNumber}
                          </div>

                          <div className="mt-1 text-xs text-white/50">
                            {transaction.description}
                          </div>
                        </div>

                        <div>{transaction.quantity}</div>

                        <div>{transaction.previousQuantity}</div>

                        <div>{transaction.newQuantity}</div>

                        <div>
                          <div>{formatDateTime(transaction.createdDate)}</div>

                          {transaction.notes && (
                            <div className="mt-1 text-xs text-white/50">
                              {transaction.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}