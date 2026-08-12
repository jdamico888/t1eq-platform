"use client";

import { useEffect, useMemo, useState } from "react";

import type { InventoryItem } from "@/types/inventory-item";
import type { Truck, TruckStockItem } from "@/types/truck-stock";
import type { User } from "@/types/user";

import { getInventoryItems } from "@/services/inventory";

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

import { getUserFullName, getUsers } from "@/services/users";

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

export default function TruckStockPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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

  const assignableUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.status === "Active" &&
        (user.role === "Technician" || user.role === "Inspector")
    );
  }, [users]);

  function reloadData(nextSelectedTruckId?: string) {
    const loadedTrucks = getTrucks();
    const activeTruckId = nextSelectedTruckId ?? selectedTruckId;

    setTrucks(loadedTrucks);
    setInventoryItems(getInventoryItems());
    setUsers(getUsers());

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

    const assignedUser =
      assignableUsers.find((user) => user.id === assignedTechnicianId) ??
      null;

    const truck = createTruck({
      truckNumber: truckNumber.trim(),
      name: truckName.trim(),

      assignedTechnicianId: assignedUser?.id ?? undefined,
      assignedTechnicianName: assignedUser
        ? getUserFullName(assignedUser)
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
    assignedUserId: string
  ) {
    const assignedUser =
      assignableUsers.find((user) => user.id === assignedUserId) ?? null;

    updateTruck(truck.id, {
      assignedTechnicianId: assignedUser?.id ?? undefined,
      assignedTechnicianName: assignedUser
        ? getUserFullName(assignedUser)
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
        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
            T1EQ Field Inventory
          </div>

          <h1 className="mt-2 text-4xl font-bold text-white">
            Truck Stock
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            Add service trucks in the field, assign technicians or inspectors,
            load inventory from warehouse stock, replenish low truck stock, and
            track truck-level part quantities.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white">Add Truck</h2>

            <div className="mt-5 space-y-4">
              <input
                value={truckNumber}
                onChange={(event) => setTruckNumber(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                placeholder="Truck number"
              />

              <input
                value={truckName}
                onChange={(event) => setTruckName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                placeholder="Truck name"
              />

              <select
                value={assignedTechnicianId}
                onChange={(event) =>
                  setAssignedTechnicianId(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              >
                <option value="">Unassigned technician / inspector</option>

                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getUserFullName(user)}
                    {user.employeeId ? ` — ${user.employeeId}` : ""}
                    {user.role ? ` — ${user.role}` : ""}
                  </option>
                ))}
              </select>

              {assignableUsers.length === 0 && (
                <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                  No active technicians or inspectors found. Add users first,
                  or create the truck unassigned.
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateTruck}
                className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Add Truck
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl lg:col-span-2">
            <h2 className="text-2xl font-bold text-white">Trucks</h2>

            {trucks.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-white/60">
                No trucks added yet.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {trucks.map((truck) => (
                  <button
                    key={truck.id}
                    type="button"
                    onClick={() => setSelectedTruckId(truck.id)}
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

                      <select
                        value={truck.assignedTechnicianId ?? ""}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation();
                          handleUpdateTruckAssignment(
                            truck,
                            event.target.value
                          );
                        }}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Unassigned</option>

                        {assignableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {getUserFullName(user)}
                            {user.employeeId ? ` — ${user.employeeId}` : ""}
                            {user.role ? ` — ${user.role}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-2 text-xs uppercase tracking-wide text-white/40">
                      {truck.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {selectedTruck && (
          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedTruck.name} Stock
                </h2>

                <p className="mt-1 text-sm text-white/60">
                  Truck #{selectedTruck.truckNumber} •{" "}
                  {selectedTruck.assignedTechnicianName ?? "Unassigned"}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-right">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Items On Truck
                  </div>

                  <div className="mt-1 text-3xl font-bold text-white">
                    {truckStockItems.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-right">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Low Stock
                  </div>

                  <div className="mt-1 text-3xl font-bold text-white">
                    {lowStockTruckItems.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-xl font-bold text-white">
                Load Inventory To Truck
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="relative md:col-span-2">
                  <input
                    value={inventorySearch}
                    onChange={(event) => {
                      setInventorySearch(event.target.value);
                      setSelectedInventoryItemId("");
                    }}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                    placeholder="Search inventory by part number, description, OEM, vendor, or cross-reference"
                  />

                  {inventorySearchResults.length > 0 && (
                    <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
                      {inventorySearchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedInventoryItemId(item.id);
                            setInventorySearch(
                              `${item.partNumber} — ${item.name}`
                            );
                          }}
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

                <input
                  type="number"
                  value={transferQuantity}
                  onChange={(event) =>
                    setTransferQuantity(Number(event.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                  min={0}
                  step="1"
                />
              </div>

              {selectedInventoryItem && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">
                    Selected: {selectedInventoryItem.partNumber}
                  </div>

                  <div className="mt-1 text-sm text-white/60">
                    {selectedInventoryItem.description ??
                      selectedInventoryItem.name}
                  </div>

                  <div className="mt-2 text-xs text-white/50">
                    Warehouse Qty: {selectedInventoryItem.quantityOnHand}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleTransferToTruck}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Load Selected Part To Truck
              </button>
            </div>

            <div className="mt-6">
              {truckStockItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-white/60">
                  No stock on this truck yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {truckStockItems.map((stockItem) => {
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
                      <div
                        key={stockItem.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-lg font-bold text-white">
                              {stockItem.partNumber}
                            </div>

                            <div className="mt-1 text-sm text-white/60">
                              {stockItem.description}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs uppercase tracking-wide text-white/50">
                              On Truck
                            </div>

                            <div className="mt-1 text-3xl font-bold text-white">
                              {stockItem.quantityOnTruck}
                            </div>

                            {isLowStock && (
                              <div className="mt-2 rounded-full border border-red-400/30 bg-red-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-100">
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
                          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-white/70">
                            {stockItem.notes}
                          </div>
                        )}

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <button
                            type="button"
                            disabled={!replenishQuantity}
                            onClick={() => handleReplenishTruckStock(stockItem)}
                            className="rounded-xl border border-green-400/30 bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-100 transition hover:bg-green-500/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
                          >
                            Replenish To Ideal
                          </button>

                          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                            {replenishQuantity && replenishQuantity > 0
                              ? `Load ${replenishQuantity} from warehouse`
                              : "No replenish needed"}
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs uppercase tracking-wide text-white/50">
                            Field Count Adjustment
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <input
                              type="number"
                              value={adjustmentQuantities[stockItem.id] ?? ""}
                              onChange={(event) =>
                                setAdjustmentQuantities((currentValues) => ({
                                  ...currentValues,
                                  [stockItem.id]: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
                              placeholder="New count"
                              min={0}
                              step="1"
                            />

                            <input
                              value={adjustmentNotes[stockItem.id] ?? ""}
                              onChange={(event) =>
                                setAdjustmentNotes((currentValues) => ({
                                  ...currentValues,
                                  [stockItem.id]: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white md:col-span-2"
                              placeholder="Adjustment note"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdjustTruckStock(stockItem)}
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

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Truck Stock Transaction History
                  </h3>

                  <p className="mt-1 text-sm text-white/60">
                    Loads, consumption, restorations, and field count
                    adjustments for this truck.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  {truckTransactions.length} Transaction
                  {truckTransactions.length === 1 ? "" : "s"}
                </div>
              </div>

              {truckTransactions.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
                  No truck stock transactions recorded yet.
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
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