"use client";

import { useEffect, useState } from "react";

import type { InventoryItem, InventoryRow } from "@/types/inventory-item";
import type { InventoryLocation } from "@/types/inventory-location";

import { getInventoryLocations } from "@/services/inventory-locations";
import {
  createInventoryItem,
  getInventoryItemByPartNumber,
  updateInventoryItem,
} from "@/services/inventory";
import { createInventoryDiscrepancy } from "@/services/inventory-discrepancies";
import type { MarkupSettingsSnapshot } from "@/services/pricing";
import {
  calculateSuggestedSellPrice,
  getMarkupSettings,
  resolveMarkupPercent,
} from "@/services/pricing";
import { currentUserHasPermission } from "@/services/auth";

const QBIT_SCOPE = "add-item-modal";

const ROW_OPTIONS: InventoryRow[] = ["Inside", "Outside"];

/**
 * "inventory" is the stocking flow reached from the Inventory screens and
 * Truck Stock: the part is going onto a shelf, so where it lands is
 * required and photos are encouraged but optional.
 *
 * "onTheFly" is a technician buying a part mid-job and fitting it. There is
 * no shelf involved, so the storage address is optional — but the part has
 * to be documented: what it cost off the receipt, and the three photos that
 * make it identifiable again later.
 */
export type AddItemMode = "inventory" | "onTheFly";

type AddItemModalProps = {
  open: boolean;
  onClose: () => void;
  onAdded?: (item: InventoryItem) => void;

  mode?: AddItemMode;

  /**
   * Pre-fills the part number — used when the flow is opened from a part
   * search that came up empty during RO/appointment line entry.
   */
  initialPartNumber?: string;

  /**
   * Pre-selects a location — used when opening from Truck Stock, so the
   * truck the user is already looking at is the default.
   */
  initialLocationId?: string;
};

type AddItemFormState = {
  manufacturer: string;
  partNumber: string;
  partDescription: string;
  quantity: string;
  quantityPerPackage: string;
  locationId: string;
  row: InventoryRow | "";
  section: string;
  shelf: string;
  bin: string;
  quantityOnHand: string;
  cost: string;
  sellPrice: string;
};

const emptyForm: AddItemFormState = {
  manufacturer: "",
  partNumber: "",
  partDescription: "",
  quantity: "",
  quantityPerPackage: "",
  locationId: "",
  row: "",
  section: "",
  shelf: "",
  bin: "",
  quantityOnHand: "",
  cost: "",
  sellPrice: "",
};

type PhotoSlotKey =
  | "itemPhotoFrontUrl"
  | "itemPhotoSideUrl"
  | "itemPhotoLabelUrl"
  | "receiptPhotoUrl";

type PhotoState = Partial<Record<PhotoSlotKey, string>>;

/**
 * The three photos that identify a part, in the order a technician shoots
 * them. Photo 3 is deliberately taken 45° around from Photo 2 so the part
 * number and the profile can be matched up against a catalogue later.
 *
 * The stored field names predate this numbering — front/label/side map to
 * photos 1/2/3 respectively.
 */
const IDENTIFYING_PHOTO_KEYS: PhotoSlotKey[] = [
  "itemPhotoFrontUrl",
  "itemPhotoLabelUrl",
  "itemPhotoSideUrl",
];

const PHOTO_SLOTS: Array<{
  key: PhotoSlotKey;
  label: string;
  hint?: string;
}> = [
  {
    key: "itemPhotoFrontUrl",
    label: "Photo 1 — Item",
    hint: "The part itself, straight on.",
  },
  {
    key: "itemPhotoLabelUrl",
    label: "Photo 2 — Part Number",
    hint: "Close enough to read the part number.",
  },
  {
    key: "itemPhotoSideUrl",
    label: "Photo 3 — Side",
    hint: "45° around from Photo 2.",
  },
  {
    key: "receiptPhotoUrl",
    label: "Receipt Photo",
    hint: "Optional, but worth having for the cost.",
  },
];

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

    reader.onerror = () => reject(new Error("Unable to read image."));

    reader.readAsDataURL(file);
  });
}

const labelClass =
  "text-xs font-black uppercase tracking-wide text-slate-400";

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400 disabled:opacity-50";

export default function AddItemModal({
  open,
  onClose,
  onAdded,
  mode = "inventory",
  initialPartNumber,
  initialLocationId,
}: AddItemModalProps) {
  const isOnTheFly = mode === "onTheFly";

  const [form, setForm] = useState<AddItemFormState>(emptyForm);
  const [photos, setPhotos] = useState<PhotoState>({});
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [sellPriceEditedManually, setSellPriceEditedManually] =
    useState(false);

  /**
   * Resolved when the modal opens rather than during render. Both read
   * localStorage, which is empty during server rendering — deciding them at
   * render time would show the pricing section on the server and hide it on
   * the client, producing a hydration mismatch.
   */
  const [canEditPricing, setCanEditPricing] = useState(false);
  const [markupSettings, setMarkupSettings] = useState<MarkupSettingsSnapshot>(
    { generalPercent: 0, tiers: [] }
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setCanEditPricing(currentUserHasPermission("editCharges"));
    setMarkupSettings(getMarkupSettings());

    setLocations(getInventoryLocations());
    setErrors([]);
    setPhotos({});
    setSellPriceEditedManually(false);

    setForm({
      ...emptyForm,
      partNumber: initialPartNumber ?? "",
      locationId: initialLocationId ?? "",
    });
  }, [open, initialPartNumber, initialLocationId]);

  const selectedLocation = locations.find(
    (location) => location.id === form.locationId
  );

  const isTruckLocation = selectedLocation?.type === "Truck";

  /**
   * The markup that actually applied to the cost as typed — a matching cost
   * band, or the general markup. Shown under Sell Price so the number is
   * explainable rather than appearing from nowhere.
   */
  const appliedMarkupPercent = resolveMarkupPercent(
    Number(form.cost),
    markupSettings
  );

  function updateField<K extends keyof AddItemFormState>(
    key: K,
    value: AddItemFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleCostChange(nextCost: string) {
    setForm((current) => {
      const suggestedSellPrice = calculateSuggestedSellPrice(
        Number(nextCost),
        markupSettings
      );

      // Anyone without pricing rights always gets the calculated value —
      // their Sell Price field is read-only, so there is no override to
      // preserve. For a manager, stop auto-filling once they've typed
      // their own number.
      const keepManagerOverride = canEditPricing && sellPriceEditedManually;

      return {
        ...current,
        cost: nextCost,
        sellPrice: keepManagerOverride
          ? current.sellPrice
          : suggestedSellPrice
          ? String(suggestedSellPrice)
          : "",
      };
    });
  }

  async function handlePhotoChange(
    slotKey: PhotoSlotKey,
    fileList: FileList | null
  ) {
    const file = fileList?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      setPhotos((current) => ({ ...current, [slotKey]: dataUrl }));
    } catch {
      setErrors(["That image could not be read. Try a different file."]);
    }
  }

  function validate(): string[] {
    const nextErrors: string[] = [];

    if (!form.partNumber.trim()) {
      nextErrors.push("Part Number is required.");
    }

    if (!form.partDescription.trim()) {
      nextErrors.push("Part Description is required.");
    }

    // A part bought mid-job is fitted, not shelved — so where it would have
    // been stored is optional. Stocking inventory still has to say where it
    // went, or it cannot be found again.
    if (!isOnTheFly) {
      if (!form.locationId) {
        nextErrors.push("Inventory Location is required.");
      }

      if (!form.section.trim()) {
        nextErrors.push("Section is required.");
      }

      if (!form.shelf.trim()) {
        nextErrors.push("Shelf is required.");
      }

      if (!form.bin.trim()) {
        nextErrors.push("Bin is required.");
      }
    }

    // Whenever a truck is chosen, which side it is on still matters.
    if (isTruckLocation && !form.row) {
      nextErrors.push("Row (Inside or Outside) is required for trucks.");
    }

    if (isOnTheFly) {
      if (!form.cost.trim() || !Number.isFinite(Number(form.cost))) {
        nextErrors.push(
          "Cost is required — the item total from the receipt, including tax."
        );
      }

      const missingPhotoLabels = PHOTO_SLOTS.filter(
        (slot) =>
          IDENTIFYING_PHOTO_KEYS.includes(slot.key) && !photos[slot.key]
      ).map((slot) => slot.label);

      if (missingPhotoLabels.length > 0) {
        nextErrors.push(`Required photos missing: ${missingPhotoLabels.join(", ")}.`);
      }
    }

    const quantity = Number(form.quantity);

    if (!form.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0) {
      nextErrors.push("Quantity must be a number greater than 0.");
    }

    return nextErrors;
  }

  /**
   * Qty On Hand is what the person physically counted. When it disagrees
   * with what the system believes after this receipt, log a discrepancy so
   * it can be investigated from the Inventory Discrepancies screen rather
   * than silently overwriting the count.
   */
  function logDiscrepancyIfCountDisagrees(
    expectedQuantityOnHand: number,
    partNumber: string,
    description: string,
    inventoryItemId: string
  ) {
    if (!form.quantityOnHand.trim()) {
      return;
    }

    const countedQuantity = Number(form.quantityOnHand);

    if (!Number.isFinite(countedQuantity)) {
      return;
    }

    if (countedQuantity === expectedQuantityOnHand) {
      return;
    }

    createInventoryDiscrepancy({
      source: "Inventory Count",
      inventoryItemId,
      partNumber,
      description,
      expectedQuantityOnHand,
      liveInventoryCount: countedQuantity,
      discrepancyQuantity: countedQuantity - expectedQuantityOnHand,
      locationId: form.locationId,
      locationName: selectedLocation?.name,
      binLocation: [form.row, form.section, form.shelf, form.bin]
        .filter(Boolean)
        .join(" · "),
      notes:
        "Counted during Add Item. System expected " +
        `${expectedQuantityOnHand}, counter recorded ${countedQuantity}.`,
    });
  }

  function handleSubmit() {
    const nextErrors = validate();

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    const partNumber = form.partNumber.trim();
    const partDescription = form.partDescription.trim();
    const quantity = Number(form.quantity);

    const sharedFields = {
      manufacturer: form.manufacturer.trim() || undefined,
      name: partDescription,
      description: partDescription,

      quantityPerPackage: form.quantityPerPackage.trim()
        ? Number(form.quantityPerPackage)
        : undefined,

      locationId: form.locationId,
      location: selectedLocation?.name,

      row: form.row || undefined,
      section: form.section.trim(),
      shelf: form.shelf.trim(),
      bin: form.bin.trim(),

      ...photos,
    };

    // Cost is an observation anyone on the job can record. Sell price is a
    // decision: a manager's typed override is taken as-is, and for everyone
    // else it is calculated from cost at the markup set in Business Setup,
    // so a part never lands in inventory unpriced.
    const costWasEntered = form.cost.trim().length > 0;
    const costValue = costWasEntered ? Number(form.cost) : 0;

    const managerOverridePrice =
      canEditPricing && sellPriceEditedManually && form.sellPrice.trim()
        ? Number(form.sellPrice)
        : null;

    const newItemPricingFields = {
      cost: costValue,
      sellPrice:
        managerOverridePrice ??
        calculateSuggestedSellPrice(costValue, markupSettings),
      price:
        managerOverridePrice ??
        calculateSuggestedSellPrice(costValue, markupSettings),
      sellPriceOverridden: managerOverridePrice !== null,
    };

    const existingItem = getInventoryItemByPartNumber(partNumber);

    /**
     * Restocking must never quietly erase pricing. Leaving Cost blank
     * touches neither cost nor price, and a sell price a manager set by
     * hand survives a restock at a new cost — it only changes when a
     * manager changes it.
     */
    function buildRestockPricingFields(
      stockedItem: InventoryItem
    ): Partial<InventoryItem> {
      if (managerOverridePrice !== null) {
        return {
          cost: costWasEntered ? costValue : stockedItem.cost,
          sellPrice: managerOverridePrice,
          price: managerOverridePrice,
          sellPriceOverridden: true,
        };
      }

      if (!costWasEntered) {
        return {};
      }

      if (stockedItem.sellPriceOverridden) {
        return { cost: costValue };
      }

      const recalculatedSellPrice = calculateSuggestedSellPrice(
        costValue,
        markupSettings
      );

      return {
        cost: costValue,
        sellPrice: recalculatedSellPrice,
        price: recalculatedSellPrice,
      };
    }

    // Receiving more of something already stocked adds to it rather than
    // creating a duplicate catalog entry.
    if (existingItem) {
      const expectedQuantityOnHand = existingItem.quantityOnHand + quantity;

      const updatedItem = updateInventoryItem(existingItem.id, {
        ...sharedFields,
        ...buildRestockPricingFields(existingItem),
        quantityOnHand: expectedQuantityOnHand,
      });

      logDiscrepancyIfCountDisagrees(
        expectedQuantityOnHand,
        partNumber,
        partDescription,
        existingItem.id
      );

      if (updatedItem) {
        onAdded?.(updatedItem);
      }

      onClose();
      return;
    }

    const newItem = createInventoryItem({
      ...sharedFields,
      ...newItemPricingFields,
      partNumber,
      name: partDescription,
      quantityOnHand: quantity,
    });

    logDiscrepancyIfCountDisagrees(
      quantity,
      partNumber,
      partDescription,
      newItem.id
    );

    onAdded?.(newItem);
    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div
      data-t1eq-qbit-id="add-item-modal-backdrop"
      data-t1eq-qbit-type="section"
      data-t1eq-qbit-scope={QBIT_SCOPE}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
    >
      <div data-t1eq-tile="true" data-t1eq-page-card="true"
        data-t1eq-qbit-id="add-item-modal"
        data-t1eq-qbit-type="page-card"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className="my-8 w-full max-w-4xl rounded-[28px] border border-white/10 bg-slate-950 p-6 shadow-2xl"
      >
        <div className="mb-6">
          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="add-item-modal-overline"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-xs font-black uppercase tracking-[0.24em] text-orange-300"
          >
            Inventory
          </p>

          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="add-item-modal-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 text-2xl font-black text-white"
          >
            Add Item
          </h2>

          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="add-item-modal-description"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 text-sm font-medium text-slate-300"
          >
            {isOnTheFly
              ? "Record the part you just bought. Cost and the three item photos are required so it can be identified and priced later."
              : "Use this for new inventory and for receiving more of something you already stock. If the part number already exists, the quantity is added to it."}
          </p>
        </div>

        {errors.length > 0 && (
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="add-item-modal-errors"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3"
          >
            <div className="text-xs font-black uppercase tracking-wide text-red-200">
              Fix these first
            </div>

            <ul className="mt-2 space-y-1 text-sm font-semibold text-red-100">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className={labelClass}>Manufacturer</span>
            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="add-item-manufacturer"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={form.manufacturer}
              onChange={(event) =>
                updateField("manufacturer", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Part Number *</span>
            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="add-item-part-number"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={form.partNumber}
              onChange={(event) =>
                updateField("partNumber", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Part Description *</span>
            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="add-item-part-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={form.partDescription}
              onChange={(event) =>
                updateField("partDescription", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Quantity *</span>
            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="add-item-quantity"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Quantity Per Package</span>
            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="add-item-quantity-per-package"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="number"
              min="0"
              step="1"
              value={form.quantityPerPackage}
              onChange={(event) =>
                updateField("quantityPerPackage", event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Qty On Hand (Counted)</span>
            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="add-item-quantity-on-hand"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="number"
              min="0"
              step="1"
              value={form.quantityOnHand}
              onChange={(event) =>
                updateField("quantityOnHand", event.target.value)
              }
              placeholder="Leave blank to skip the count"
              className={inputClass}
            />

            <span className="mt-2 block text-xs font-semibold text-slate-400">
              What you physically counted. If it disagrees with the system, a
              discrepancy is logged for investigation.
            </span>
          </label>
        </div>

        <div className="mt-8">
          <h3
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="add-item-storage-heading"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-sm font-black uppercase tracking-wide text-slate-300"
          >
            Storage Location
            {isOnTheFly && (
              <span className="ml-2 font-semibold normal-case tracking-normal text-slate-400">
                — optional for a part being fitted now
              </span>
            )}
          </h3>

          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <label className="block xl:col-span-2">
              <span className={labelClass}>
                Inventory Location {isOnTheFly ? "" : "*"}
              </span>
              <select data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="add-item-location"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={form.locationId}
                onChange={(event) =>
                  updateField("locationId", event.target.value)
                }
                className={inputClass}
              >
                <option value="">— Select —</option>

                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>
                Row {isTruckLocation ? "*" : ""}
              </span>
              <select data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="add-item-row"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={form.row}
                disabled={!isTruckLocation}
                onChange={(event) =>
                  updateField("row", event.target.value as InventoryRow | "")
                }
                className={inputClass}
              >
                <option value="">
                  {isTruckLocation ? "— Select —" : "Trucks only"}
                </option>

                {ROW_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>Section {isOnTheFly ? "" : "*"}</span>
              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="add-item-section"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={form.section}
                onChange={(event) =>
                  updateField("section", event.target.value)
                }
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Shelf {isOnTheFly ? "" : "*"}</span>
              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="add-item-shelf"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={form.shelf}
                onChange={(event) => updateField("shelf", event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Bin {isOnTheFly ? "" : "*"}</span>
              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="add-item-bin"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                value={form.bin}
                onChange={(event) => updateField("bin", event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </div>

        <div className="mt-8">
          <h3
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="add-item-pricing-heading"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-sm font-black uppercase tracking-wide text-slate-300"
          >
            Pricing
          </h3>

          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="block">
              <span className={labelClass}>
                Cost {isOnTheFly ? "*" : ""}
              </span>
              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="add-item-cost"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(event) => handleCostChange(event.target.value)}
                className={inputClass}
              />

              <span className="mt-2 block text-xs font-semibold text-slate-400">
                {isOnTheFly
                  ? "The item total from the receipt, including tax."
                  : "What the part cost you — off the invoice, box, or receipt."}
              </span>
            </label>

            <label className="block">
              <span className={labelClass}>
                Sell Price (Suggested Retail)
              </span>
              <input data-t1eq-field="true"
                data-t1eq-qbit-type="field"
                data-t1eq-qbit-id="add-item-sell-price"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                type="number"
                min="0"
                step="0.01"
                value={form.sellPrice}
                readOnly={!canEditPricing}
                disabled={!canEditPricing}
                onChange={(event) => {
                  if (!canEditPricing) {
                    return;
                  }

                  setSellPriceEditedManually(true);
                  updateField("sellPrice", event.target.value);
                }}
                className={inputClass}
              />

              <span className="mt-2 block text-xs font-semibold text-slate-400">
                {canEditPricing
                  ? `Calculated from cost at ${appliedMarkupPercent}% markup. Change it to override.`
                  : `Set automatically from cost at ${appliedMarkupPercent}% markup. A manager can adjust it during review.`}
              </span>
            </label>
          </div>
        </div>

        <div className="mt-8">
          <h3
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="add-item-photos-heading"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-sm font-black uppercase tracking-wide text-slate-300"
          >
            Photos
          </h3>

          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PHOTO_SLOTS.map((slot) => (
              <div key={slot.key} className="space-y-2">
                <span className={labelClass}>
                  {slot.label}
                  {isOnTheFly && IDENTIFYING_PHOTO_KEYS.includes(slot.key)
                    ? " *"
                    : ""}
                </span>

                {slot.hint && (
                  <span className="block text-xs font-semibold text-slate-400">
                    {slot.hint}
                  </span>
                )}

                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id={`add-item-photo-${slot.key}`}
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handlePhotoChange(slot.key, event.target.files)
                  }
                  className={inputClass}
                />

                {photos[slot.key] && (
                  <img
                    src={photos[slot.key]}
                    alt={slot.label}
                    className="h-24 w-full rounded-2xl border border-white/10 object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button data-t1eq-action-button="true"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id="add-item-submit"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            type="button"
            onClick={handleSubmit}
            className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-orange-950/30 hover:bg-orange-400"
          >
            Add
          </button>

          <button data-t1eq-action-button="true"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id="add-item-cancel"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white/20"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
