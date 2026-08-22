"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import type {
  InventoryItem,
  InventoryItemImageSource,
} from "@/types/inventory-item";
import {
  getInventoryItems,
  getLowStockItems,
  saveInventoryItems,
} from "@/services/inventory";

type InventoryItemFormState = {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  quantityOnHand: string;
  minimumQuantity: string;
  idealStock: string;
  cost: string;
  sellPrice: string;
  location: string;
  binLocation: string;
  manufacturer: string;
  supplierName: string;
  oemPartNumber: string;
  vendorPartNumber: string;
  crossReferencePartNumbers: string;
  supersededPartNumbers: string;
  imageUrl: string;
  thumbnailUrl: string;
  manufacturerImageUrl: string;
  requiredPhotoSource: InventoryItemImageSource;
  notes: string;
};

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";
const headerClass =
  "mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const metricGridClass = "mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4";
const metricCardClass =
  "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm";
const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";
const labelClass = "text-sm font-black uppercase tracking-wide text-zinc-500";
const primaryButtonClass =
  "rounded-xl bg-black px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-zinc-800";
const secondaryButtonClass =
  "rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-black shadow-sm transition hover:bg-zinc-50";
const dangerButtonClass =
  "rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100";
const tableHeaderClass =
  "border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-zinc-500";
const tableCellClass =
  "border-b border-zinc-100 px-4 py-3 text-sm text-zinc-700";
const badgeClass =
  "inline-flex rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-black text-zinc-700";
const lowStockBadgeClass =
  "inline-flex rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-black text-red-700";

function createBrowserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createImageId() {
  return `IMG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyFormState(): InventoryItemFormState {
  return {
    id: "",
    partNumber: "",
    name: "",
    description: "",
    quantityOnHand: "0",
    minimumQuantity: "0",
    idealStock: "0",
    cost: "0",
    sellPrice: "0",
    location: "",
    binLocation: "",
    manufacturer: "",
    supplierName: "",
    oemPartNumber: "",
    vendorPartNumber: "",
    crossReferencePartNumbers: "",
    supersededPartNumbers: "",
    imageUrl: "",
    thumbnailUrl: "",
    manufacturerImageUrl: "",
    requiredPhotoSource: "Unknown",
    notes: "",
  };
}

function splitPartNumberList(value: string) {
  return value
    .split(",")
    .map((partNumber) => partNumber.trim())
    .filter(Boolean);
}

function joinPartNumberList(values?: string[]) {
  return values && values.length > 0 ? values.join(", ") : "";
}

function parseNumber(value: string) {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return parsedValue;
}

function formatCurrency(value?: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value ?? 0);
}

function getDisplayQuantity(item: InventoryItem) {
  return item.quantityOnHand ?? 0;
}

function getMinimumQuantity(item: InventoryItem) {
  return item.minimumQuantity ?? item.minimumStock ?? 0;
}

function itemIsLowStock(item: InventoryItem) {
  return getDisplayQuantity(item) <= getMinimumQuantity(item);
}

function itemMatchesSearch(item: InventoryItem, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const searchableValues = [
    item.partNumber,
    item.name,
    item.description,
    item.manufacturer,
    item.supplierName,
    item.oemPartNumber,
    item.vendorPartNumber,
    item.location,
    item.binLocation,
    ...item.crossReferencePartNumbers,
    ...item.supersededPartNumbers,
  ];

  return searchableValues.some((value) =>
    value?.toLowerCase().includes(normalizedSearch)
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read image."));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read image."));
    };

    reader.readAsDataURL(file);
  });
}

function convertItemToFormState(item: InventoryItem): InventoryItemFormState {
  return {
    id: item.id,
    partNumber: item.partNumber,
    name: item.name,
    description: item.description ?? "",
    quantityOnHand: String(item.quantityOnHand ?? 0),
    minimumQuantity: String(item.minimumQuantity ?? item.minimumStock ?? 0),
    idealStock: String(item.idealStock ?? 0),
    cost: String(item.cost ?? 0),
    sellPrice: String(item.sellPrice ?? item.price ?? 0),
    location: item.location ?? "",
    binLocation: item.binLocation ?? "",
    manufacturer: item.manufacturer ?? "",
    supplierName: item.supplierName ?? "",
    oemPartNumber: item.oemPartNumber ?? "",
    vendorPartNumber: item.vendorPartNumber ?? "",
    crossReferencePartNumbers: joinPartNumberList(
      item.crossReferencePartNumbers
    ),
    supersededPartNumbers: joinPartNumberList(item.supersededPartNumbers),
    imageUrl: item.imageUrl ?? "",
    thumbnailUrl: item.thumbnailUrl ?? "",
    manufacturerImageUrl: item.manufacturerImageUrl ?? "",
    requiredPhotoSource: item.requiredPhotoSource ?? "Unknown",
    notes: item.notes ?? "",
  };
}

function buildItemImages(
  formState: InventoryItemFormState,
  existingItem?: InventoryItem
) {
  if (!formState.imageUrl.trim()) {
    return [];
  }

  const existingPrimaryImage = existingItem?.itemImages?.find(
    (image) => image.label === "Primary item photo"
  );

  const imageWasChanged =
    existingPrimaryImage?.imageUrl !== formState.imageUrl;

  return [
    {
      id: imageWasChanged
        ? createImageId()
        : existingPrimaryImage?.id ?? createImageId(),
      imageUrl: formState.imageUrl,
      source: formState.requiredPhotoSource,
      label: "Primary item photo",
      capturedDate: imageWasChanged
        ? new Date().toISOString()
        : existingPrimaryImage?.capturedDate ?? new Date().toISOString(),
    },
    ...(formState.manufacturerImageUrl
      ? [
          {
            id:
              existingItem?.itemImages?.find(
                (image) => image.label === "Manufacturer image"
              )?.id ?? createImageId(),
            imageUrl: formState.manufacturerImageUrl,
            source: "Manufacturer" as InventoryItemImageSource,
            label: "Manufacturer image",
            capturedDate:
              existingItem?.itemImages?.find(
                (image) => image.label === "Manufacturer image"
              )?.capturedDate ?? new Date().toISOString(),
          },
        ]
      : []),
  ];
}

function convertFormStateToItem(
  formState: InventoryItemFormState,
  existingItem?: InventoryItem
): InventoryItem {
  const quantityOnHand = parseNumber(formState.quantityOnHand);
  const minimumQuantity = parseNumber(formState.minimumQuantity);
  const idealStock = parseNumber(formState.idealStock);
  const cost = parseNumber(formState.cost);
  const sellPrice = parseNumber(formState.sellPrice);
  const now = new Date().toISOString();

  const itemImages = buildItemImages(formState, existingItem);

  return {
    id: formState.id || existingItem?.id || createBrowserId(),

    partNumber: formState.partNumber.trim(),
    name: formState.name.trim(),
    description: formState.description.trim() || undefined,

    quantityOnHand,

    minimumQuantity,
    minimumStock: minimumQuantity,
    idealStock,

    cost,

    sellPrice,
    price: sellPrice,

    location: formState.location.trim() || undefined,
    binLocation: formState.binLocation.trim() || undefined,

    manufacturer: formState.manufacturer.trim() || undefined,
    supplierName: formState.supplierName.trim() || undefined,

    oemPartNumber: formState.oemPartNumber.trim() || undefined,
    vendorPartNumber: formState.vendorPartNumber.trim() || undefined,

    crossReferencePartNumbers: splitPartNumberList(
      formState.crossReferencePartNumbers
    ),
    supersededPartNumbers: splitPartNumberList(
      formState.supersededPartNumbers
    ),

    imageUrl: formState.imageUrl,
    thumbnailUrl: formState.thumbnailUrl || formState.imageUrl,
    manufacturerImageUrl: formState.manufacturerImageUrl || undefined,
    itemImages,

    requiredPhotoCaptured: Boolean(formState.imageUrl),
    requiredPhotoCapturedDate:
      existingItem?.requiredPhotoCapturedDate && existingItem.imageUrl === formState.imageUrl
        ? existingItem.requiredPhotoCapturedDate
        : now,
    requiredPhotoSource: formState.requiredPhotoSource,

    notes: formState.notes.trim() || undefined,

    createdDate: existingItem?.createdDate ?? now,
    updatedDate: now,
  };
}

export default function InventoryItemsPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formState, setFormState] = useState<InventoryItemFormState>(
    createEmptyFormState()
  );
  const [statusMessage, setStatusMessage] = useState("");

  function refreshInventoryItems() {
    setInventoryItems(getInventoryItems());
    setLowStockItems(getLowStockItems());
  }

  useEffect(() => {
    refreshInventoryItems();
  }, []);

  const filteredItems = useMemo(
    () => inventoryItems.filter((item) => itemMatchesSearch(item, searchTerm)),
    [inventoryItems, searchTerm]
  );

  const totalInventoryValue = useMemo(
    () =>
      inventoryItems.reduce(
        (total, item) => total + getDisplayQuantity(item) * (item.cost ?? 0),
        0
      ),
    [inventoryItems]
  );

  const editingItem = useMemo(
    () => inventoryItems.find((item) => item.id === editingItemId),
    [editingItemId, inventoryItems]
  );

  function updateFormState(updates: Partial<InventoryItemFormState>) {
    setFormState((current) => ({
      ...current,
      ...updates,
    }));
    setStatusMessage("");
  }

  function beginCreateItem() {
    setEditingItemId(null);
    setFormState(createEmptyFormState());
    setShowForm(true);
    setStatusMessage("");
  }

  function beginEditItem(item: InventoryItem) {
    setEditingItemId(item.id);
    setFormState(convertItemToFormState(item));
    setShowForm(true);
    setStatusMessage("");
  }

  function cancelForm() {
    setEditingItemId(null);
    setFormState(createEmptyFormState());
    setShowForm(false);
    setStatusMessage("");
  }

  async function handleInventoryImageUpload(
    event: ChangeEvent<HTMLInputElement>,
    source: InventoryItemImageSource
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Inventory item photo must be an image file.");
      return;
    }

    try {
      const imageUrl = await readFileAsDataUrl(file);

      updateFormState({
        imageUrl,
        thumbnailUrl: imageUrl,
        requiredPhotoSource: source,
      });

      setStatusMessage("Inventory item photo added.");
    } catch {
      setStatusMessage("Inventory item photo upload failed.");
    }
  }

  async function handleManufacturerImageUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Manufacturer image must be an image file.");
      return;
    }

    try {
      const manufacturerImageUrl = await readFileAsDataUrl(file);

      updateFormState({
        manufacturerImageUrl,
      });

      setStatusMessage("Manufacturer image added.");
    } catch {
      setStatusMessage("Manufacturer image upload failed.");
    }
  }

  function handleSaveItem() {
    if (!formState.partNumber.trim()) {
      setStatusMessage("Part number is required.");
      return;
    }

    if (!formState.name.trim()) {
      setStatusMessage("Item name is required.");
      return;
    }

    if (!formState.imageUrl.trim()) {
      setStatusMessage(
        "Inventory item photo is required before this item can be saved."
      );
      return;
    }

    const newOrUpdatedItem = convertFormStateToItem(formState, editingItem);

    const nextItems = editingItem
      ? inventoryItems.map((item) =>
          item.id === editingItem.id ? newOrUpdatedItem : item
        )
      : [newOrUpdatedItem, ...inventoryItems];

    saveInventoryItems(nextItems);
    setInventoryItems(nextItems);
    setLowStockItems(nextItems.filter(itemIsLowStock));
    setEditingItemId(null);
    setFormState(createEmptyFormState());
    setShowForm(false);
    setStatusMessage(
      editingItem ? "Inventory item updated." : "Inventory item created."
    );
  }

  function handleDeleteItem(itemId: string) {
    const itemToDelete = inventoryItems.find((item) => item.id === itemId);

    if (!itemToDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Delete inventory item ${itemToDelete.partNumber}?`
    );

    if (!confirmed) {
      return;
    }

    const nextItems = inventoryItems.filter((item) => item.id !== itemId);

    saveInventoryItems(nextItems);
    setInventoryItems(nextItems);
    setLowStockItems(nextItems.filter(itemIsLowStock));
    setStatusMessage("Inventory item deleted.");

    if (editingItemId === itemId) {
      cancelForm();
    }
  }

  return (
    <div className={pageClass}>
      <header data-t1eq-page-card="true" className={headerClass}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-zinc-500">
              Inventory
            </p>

            <h1 className="mt-2 text-4xl font-black text-black">
              Inventory Items
            </h1>

            <p className="mt-2 max-w-3xl text-base font-semibold text-zinc-600">
              Manage stocked parts, quantities, locations, minimum stock levels,
              pricing, suppliers, part-number references, and required item
              photos.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button data-t1eq-action-button="true"
              type="button"
              onClick={refreshInventoryItems}
              className={secondaryButtonClass}
            >
              Refresh
            </button>

            <button data-t1eq-action-button="true"
              type="button"
              onClick={beginCreateItem}
              className={primaryButtonClass}
            >
              Add Inventory Item
            </button>
          </div>
        </div>

        {statusMessage && (
          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-700">
            {statusMessage}
          </div>
        )}
      </header>

      {showForm && (
        <section data-t1eq-page-card="true" className={`${sectionClass} mb-6`}>
          <div className="mb-5">
            <h2 className="text-2xl font-black text-black">
              {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
            </h2>

            <p className="mt-1 text-sm font-semibold text-zinc-600">
              Required fields: part number, item name, and inventory item photo.
            </p>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mb-6 rounded-2xl border-2 border-orange-300 bg-orange-50 p-4">
            <div className="text-sm font-black uppercase tracking-wide text-orange-800">
              Required Item Photo
            </div>

            <p className="mt-1 text-sm font-semibold text-orange-900">
              Each inventory item must have a picture before it can be saved.
              The app records whether the image came from the camera or a
              desktop upload.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className={labelClass}>Take Picture With Camera</span>
              <input data-t1eq-field="true"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) =>
                  handleInventoryImageUpload(event, "Camera")
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Upload Image From Computer</span>
              <input data-t1eq-field="true"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  handleInventoryImageUpload(event, "Desktop Upload")
                }
                className={inputClass}
              />
            </label>

            <div className="space-y-2 md:col-span-2">
              <span className={labelClass}>Item Photo Preview</span>

              {formState.imageUrl ? (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  <img
                    src={formState.imageUrl}
                    alt="Inventory item preview"
                    className="h-56 w-full object-contain"
                  />

                  <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-zinc-600">
                    Source: {formState.requiredPhotoSource}
                  </div>
                </div>
              ) : (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" className="flex h-56 items-center justify-center rounded-2xl border-2 border-dashed border-red-300 bg-red-50 text-sm font-black text-red-700">
                  Required photo missing
                </div>
              )}
            </div>

            <label className="space-y-2">
              <span className={labelClass}>Part Number</span>
              <input data-t1eq-field="true"
                value={formState.partNumber}
                onChange={(event) =>
                  updateFormState({
                    partNumber: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2 xl:col-span-2">
              <span className={labelClass}>Item Name</span>
              <input data-t1eq-field="true"
                value={formState.name}
                onChange={(event) =>
                  updateFormState({
                    name: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Quantity On Hand</span>
              <input data-t1eq-field="true"
                type="number"
                value={formState.quantityOnHand}
                onChange={(event) =>
                  updateFormState({
                    quantityOnHand: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Minimum Quantity</span>
              <input data-t1eq-field="true"
                type="number"
                value={formState.minimumQuantity}
                onChange={(event) =>
                  updateFormState({
                    minimumQuantity: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Ideal Stock</span>
              <input data-t1eq-field="true"
                type="number"
                value={formState.idealStock}
                onChange={(event) =>
                  updateFormState({
                    idealStock: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Cost</span>
              <input data-t1eq-field="true"
                type="number"
                value={formState.cost}
                onChange={(event) =>
                  updateFormState({
                    cost: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Sell Price</span>
              <input data-t1eq-field="true"
                type="number"
                value={formState.sellPrice}
                onChange={(event) =>
                  updateFormState({
                    sellPrice: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Location</span>
              <input data-t1eq-field="true"
                value={formState.location}
                onChange={(event) =>
                  updateFormState({
                    location: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Bin Location</span>
              <input data-t1eq-field="true"
                value={formState.binLocation}
                onChange={(event) =>
                  updateFormState({
                    binLocation: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Manufacturer</span>
              <input data-t1eq-field="true"
                value={formState.manufacturer}
                onChange={(event) =>
                  updateFormState({
                    manufacturer: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Supplier</span>
              <input data-t1eq-field="true"
                value={formState.supplierName}
                onChange={(event) =>
                  updateFormState({
                    supplierName: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>OEM Part Number</span>
              <input data-t1eq-field="true"
                value={formState.oemPartNumber}
                onChange={(event) =>
                  updateFormState({
                    oemPartNumber: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Vendor Part Number</span>
              <input data-t1eq-field="true"
                value={formState.vendorPartNumber}
                onChange={(event) =>
                  updateFormState({
                    vendorPartNumber: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className={labelClass}>Cross References</span>
              <input data-t1eq-field="true"
                value={formState.crossReferencePartNumbers}
                onChange={(event) =>
                  updateFormState({
                    crossReferencePartNumbers: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="Separate multiple part numbers with commas."
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className={labelClass}>Superseded Part Numbers</span>
              <input data-t1eq-field="true"
                value={formState.supersededPartNumbers}
                onChange={(event) =>
                  updateFormState({
                    supersededPartNumbers: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="Separate multiple part numbers with commas."
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Manufacturer Camera Image</span>
              <input data-t1eq-field="true"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleManufacturerImageUpload}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Upload Manufacturer Image</span>
              <input data-t1eq-field="true"
                type="file"
                accept="image/*"
                onChange={handleManufacturerImageUpload}
                className={inputClass}
              />
            </label>

            <div className="space-y-2 md:col-span-2">
              <span className={labelClass}>Manufacturer Image Preview</span>

              {formState.manufacturerImageUrl ? (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  <img
                    src={formState.manufacturerImageUrl}
                    alt="Manufacturer preview"
                    className="h-40 w-full object-contain"
                  />
                </div>
              ) : (
                <div data-t1eq-tile="true" data-t1eq-page-card="true" className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm font-bold text-zinc-500">
                  Optional
                </div>
              )}
            </div>

            <label className="space-y-2 md:col-span-2 xl:col-span-4">
              <span className={labelClass}>Description</span>
              <textarea data-t1eq-field="true"
                value={formState.description}
                onChange={(event) =>
                  updateFormState({
                    description: event.target.value,
                  })
                }
                rows={3}
                className={inputClass}
              />
            </label>

            <label className="space-y-2 md:col-span-2 xl:col-span-4">
              <span className={labelClass}>Notes</span>
              <textarea data-t1eq-field="true"
                value={formState.notes}
                onChange={(event) =>
                  updateFormState({
                    notes: event.target.value,
                  })
                }
                rows={3}
                className={inputClass}
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button data-t1eq-action-button="true"
              type="button"
              onClick={handleSaveItem}
              className={primaryButtonClass}
            >
              {editingItem ? "Save Changes" : "Create Item"}
            </button>

            <button data-t1eq-action-button="true"
              type="button"
              onClick={cancelForm}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <section data-t1eq-page-card="true" className={sectionClass}>
        <div data-t1eq-tile-grid="true" className={metricGridClass}>
          <div
            data-t1eq-tile="true"
            data-t1eq-page-card="true"
            className={metricCardClass}
          >
            <div className="text-sm font-black uppercase tracking-wide text-zinc-500">
              Total Items
            </div>
            <div className="mt-2 text-4xl font-black text-black">
              {inventoryItems.length}
            </div>
          </div>

          <div
            data-t1eq-tile="true"
            data-t1eq-page-card="true"
            className={metricCardClass}
          >
            <div className="text-sm font-black uppercase tracking-wide text-zinc-500">
              Low Stock
            </div>
            <div className="mt-2 text-4xl font-black text-black">
              {lowStockItems.length}
            </div>
          </div>

          <div
            data-t1eq-tile="true"
            data-t1eq-page-card="true"
            className={metricCardClass}
          >
            <div className="text-sm font-black uppercase tracking-wide text-zinc-500">
              Inventory Value
            </div>
            <div className="mt-2 text-4xl font-black text-black">
              {formatCurrency(totalInventoryValue)}
            </div>
          </div>

          <div
            data-t1eq-tile="true"
            data-t1eq-page-card="true"
            className={metricCardClass}
          >
            <div className="text-sm font-black uppercase tracking-wide text-zinc-500">
              Search Results
            </div>
            <div className="mt-2 text-4xl font-black text-black">
              {filteredItems.length}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="space-y-2">
            <span className={labelClass}>Search Inventory</span>

            <input data-t1eq-field="true"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={inputClass}
              placeholder="Search part number, name, supplier, manufacturer, location, bin, OEM, vendor, or cross reference."
            />
          </label>
        </div>

        {filteredItems.length === 0 ? (
          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-500">
            No inventory items found.
          </div>
        ) : (
          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="overflow-hidden rounded-2xl border border-zinc-200">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Photo</th>
                  <th className={tableHeaderClass}>Part Number</th>
                  <th className={tableHeaderClass}>Name</th>
                  <th className={tableHeaderClass}>Qty</th>
                  <th className={tableHeaderClass}>Minimum</th>
                  <th className={tableHeaderClass}>Location</th>
                  <th className={tableHeaderClass}>Bin</th>
                  <th className={tableHeaderClass}>Supplier</th>
                  <th className={tableHeaderClass}>Cost</th>
                  <th className={tableHeaderClass}>Photo Source</th>
                  <th className={tableHeaderClass}>Status</th>
                  <th className={tableHeaderClass}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="transition hover:bg-zinc-50">
                    <td className={tableCellClass}>
                      {item.thumbnailUrl || item.imageUrl ? (
                        <img data-t1eq-tile="true" data-t1eq-page-card="true"
                          src={item.thumbnailUrl || item.imageUrl}
                          alt={item.partNumber}
                          className="h-14 w-14 rounded-xl border border-zinc-200 object-cover"
                        />
                      ) : (
                        <span className={lowStockBadgeClass}>No Photo</span>
                      )}
                    </td>

                    <td className={tableCellClass}>
                      <div className="font-black text-black">
                        {item.partNumber}
                      </div>

                      {item.oemPartNumber && (
                        <div className="mt-1 text-xs font-semibold text-zinc-500">
                          OEM: {item.oemPartNumber}
                        </div>
                      )}
                    </td>

                    <td className={tableCellClass}>
                      <div className="font-bold text-black">{item.name}</div>

                      {item.description && (
                        <div className="mt-1 text-xs font-semibold text-zinc-500">
                          {item.description}
                        </div>
                      )}
                    </td>

                    <td className={tableCellClass}>
                      {getDisplayQuantity(item)}
                    </td>

                    <td className={tableCellClass}>
                      {getMinimumQuantity(item)}
                    </td>

                    <td className={tableCellClass}>
                      {item.location || "—"}
                    </td>

                    <td className={tableCellClass}>
                      {item.binLocation || "—"}
                    </td>

                    <td className={tableCellClass}>
                      {item.supplierName || "—"}
                    </td>

                    <td className={tableCellClass}>
                      {formatCurrency(item.cost)}
                    </td>

                    <td className={tableCellClass}>
                      {item.requiredPhotoSource || "Unknown"}
                    </td>

                    <td className={tableCellClass}>
                      <span
                        className={
                          itemIsLowStock(item) ? lowStockBadgeClass : badgeClass
                        }
                      >
                        {itemIsLowStock(item) ? "Low Stock" : "In Stock"}
                      </span>
                    </td>

                    <td className={tableCellClass}>
                      <div className="flex flex-wrap gap-2">
                        <button data-t1eq-action-button="true"
                          type="button"
                          onClick={() => beginEditItem(item)}
                          className={secondaryButtonClass}
                        >
                          Edit
                        </button>

                        <button data-t1eq-action-button="true"
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className={dangerButtonClass}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}