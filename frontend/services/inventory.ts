import type {
  InventoryItem,
  InventoryItemImage,
  InventoryItemImageSource,
  InventoryRow,
} from "@/types/inventory-item";

const STORAGE_KEY = "t1eq-inventory-items";

type InventoryItemInput = Partial<InventoryItem> & {
  partNumber: string;
  name: string;
};

function createId(prefix = "INV") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function safeNumber(value: unknown, fallback = 0) {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}

function safeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return [];
}

function normalizeImageSource(value: unknown): InventoryItemImageSource {
  if (
    value === "Camera" ||
    value === "Desktop Upload" ||
    value === "Manufacturer" ||
    value === "Imported" ||
    value === "Unknown"
  ) {
    return value;
  }

  return "Unknown";
}

function buildLegacyPrimaryImage(item: Partial<InventoryItem>) {
  if (!item.imageUrl) {
    return null;
  }

  const requiredPhotoSource = normalizeImageSource(item.requiredPhotoSource);

  return {
    id: createId("IMG"),
    imageUrl: item.imageUrl,
    source: requiredPhotoSource,
    label: "Primary item photo",
    capturedDate:
      item.requiredPhotoCapturedDate ?? item.updatedDate ?? item.createdDate ?? createTimestamp(),
  } satisfies InventoryItemImage;
}

function normalizeRow(value: unknown): InventoryRow | undefined {
  if (value === "Inside" || value === "Outside") {
    return value;
  }

  return undefined;
}

function optionalTrimmed(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
}

/**
 * Builds the human-readable storage summary from the structured parts, so
 * older screens that only read binLocation keep showing something useful.
 * Falls back to whatever binLocation was already stored when no structured
 * parts are present.
 */
function buildBinLocationSummary(item: Partial<InventoryItem>) {
  const parts = [item.row, item.section, item.shelf, item.bin]
    .map(optionalTrimmed)
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) {
    return optionalTrimmed(item.binLocation);
  }

  return parts.join(" · ");
}

/**
 * The Add Item flow captures four named photos. Mirror them into the
 * itemImages collection so screens that render images pick them up without
 * needing to know about the individual fields.
 */
function buildNamedPhotoImages(item: Partial<InventoryItem>) {
  const namedPhotos: Array<{ url?: string; label: string }> = [
    { url: item.itemPhotoFrontUrl, label: "Item photo — front" },
    { url: item.itemPhotoSideUrl, label: "Item photo — side" },
    { url: item.itemPhotoLabelUrl, label: "Item photo — label" },
    { url: item.receiptPhotoUrl, label: "Receipt photo" },
  ];

  return namedPhotos
    .filter((photo) => Boolean(photo.url))
    .map((photo) => ({
      id: `named-${photo.label.toLowerCase().replace(/[^a-z]+/g, "-")}`,
      imageUrl: photo.url as string,
      source: "Unknown" as InventoryItemImageSource,
      label: photo.label,
      capturedDate: item.updatedDate ?? item.createdDate ?? createTimestamp(),
    })) satisfies InventoryItemImage[];
}

function normalizeItemImages(item: Partial<InventoryItem>) {
  const normalizedImages = Array.isArray(item.itemImages)
    ? item.itemImages
        .filter((image) => image && typeof image.imageUrl === "string")
        .map((image) => ({
          id: image.id || createId("IMG"),
          imageUrl: image.imageUrl,
          source: normalizeImageSource(image.source),
          label: image.label,
          capturedDate: image.capturedDate || createTimestamp(),
        }))
    : [];

  const hasPrimaryImage = normalizedImages.some(
    (image) => image.label === "Primary item photo"
  );

  const legacyPrimaryImage = buildLegacyPrimaryImage(item);

  const namedPhotoImages = buildNamedPhotoImages(item).filter(
    (namedImage) =>
      !normalizedImages.some((image) => image.label === namedImage.label)
  );

  const baseImages =
    legacyPrimaryImage && !hasPrimaryImage
      ? [legacyPrimaryImage, ...normalizedImages]
      : normalizedImages;

  return [...baseImages, ...namedPhotoImages];
}

function normalizeInventoryItem(item: Partial<InventoryItem>): InventoryItem {
  const now = createTimestamp();

  // The Add Item flow captures a front photo rather than the older single
  // imageUrl, so fall back to it — otherwise new items have no thumbnail in
  // list views.
  const imageUrl = item.imageUrl ?? item.itemPhotoFrontUrl ?? "";
  const itemImages = normalizeItemImages(item);
  const requiredPhotoSource = normalizeImageSource(item.requiredPhotoSource);

  return {
    id: item.id ?? createId(),

    partNumber: item.partNumber ?? "",
    name: item.name ?? "",
    description: item.description,

    quantityOnHand: safeNumber(item.quantityOnHand),

    quantityPerPackage:
      item.quantityPerPackage === undefined
        ? undefined
        : safeNumber(item.quantityPerPackage),

    minimumQuantity: safeNumber(item.minimumQuantity ?? item.minimumStock),
    minimumStock: safeNumber(item.minimumStock ?? item.minimumQuantity),
    idealStock: safeNumber(item.idealStock),

    cost: safeNumber(item.cost),

    sellPrice: safeNumber(item.sellPrice ?? item.price),
    price: safeNumber(item.price ?? item.sellPrice),

    sellPriceOverridden: item.sellPriceOverridden ?? false,

    location: item.location,
    locationId: optionalTrimmed(item.locationId),

    row: normalizeRow(item.row),
    section: optionalTrimmed(item.section),
    shelf: optionalTrimmed(item.shelf),
    bin: optionalTrimmed(item.bin),

    binLocation: buildBinLocationSummary(item),

    manufacturer: item.manufacturer,
    supplierName: item.supplierName,

    oemPartNumber: item.oemPartNumber,
    vendorPartNumber: item.vendorPartNumber,

    crossReferencePartNumbers: safeStringArray(item.crossReferencePartNumbers),
    supersededPartNumbers: safeStringArray(item.supersededPartNumbers),

    imageUrl: imageUrl || undefined,
    thumbnailUrl: item.thumbnailUrl ?? imageUrl ?? undefined,
    manufacturerImageUrl: item.manufacturerImageUrl,

    itemImages,

    itemPhotoFrontUrl: item.itemPhotoFrontUrl,
    itemPhotoSideUrl: item.itemPhotoSideUrl,
    itemPhotoLabelUrl: item.itemPhotoLabelUrl,
    receiptPhotoUrl: item.receiptPhotoUrl,

    requiredPhotoCaptured: Boolean(item.requiredPhotoCaptured ?? imageUrl),
    requiredPhotoCapturedDate:
      item.requiredPhotoCapturedDate ??
      (imageUrl ? item.updatedDate ?? item.createdDate ?? now : undefined),
    requiredPhotoSource,

    notes: item.notes,

    createdDate: item.createdDate ?? now,
    updatedDate: item.updatedDate,
  };
}

function readInventoryStorage(): InventoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.map((item) =>
      normalizeInventoryItem(item as Partial<InventoryItem>)
    );
  } catch (error) {
    console.error("Failed to parse inventory items.", error);

    return [];
  }
}

function writeInventoryStorage(items: InventoryItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("t1eq-inventory-items-changed"));
}

export function getInventoryItems(): InventoryItem[] {
  return readInventoryStorage();
}

export function saveInventoryItems(items: InventoryItem[]): InventoryItem[] {
  const normalizedItems = items.map(normalizeInventoryItem);

  writeInventoryStorage(normalizedItems);

  return normalizedItems;
}

export function createInventoryItem(input: InventoryItemInput): InventoryItem {
  const now = createTimestamp();

  const newItem = normalizeInventoryItem({
    ...input,
    id: input.id ?? createId(),
    createdDate: input.createdDate ?? now,
    updatedDate: now,
  });

  const nextItems = [newItem, ...getInventoryItems()];

  saveInventoryItems(nextItems);

  return newItem;
}

export function updateInventoryItem(
  itemId: string,
  updates: Partial<InventoryItem>
): InventoryItem | null {
  const currentItems = getInventoryItems();
  const existingItem = currentItems.find((item) => item.id === itemId);

  if (!existingItem) {
    return null;
  }

  const updatedItem = normalizeInventoryItem({
    ...existingItem,
    ...updates,
    id: existingItem.id,
    createdDate: existingItem.createdDate,
    updatedDate: createTimestamp(),
  });

  const nextItems = currentItems.map((item) =>
    item.id === itemId ? updatedItem : item
  );

  saveInventoryItems(nextItems);

  return updatedItem;
}

export function deleteInventoryItem(itemId: string): InventoryItem[] {
  const nextItems = getInventoryItems().filter((item) => item.id !== itemId);

  saveInventoryItems(nextItems);

  return nextItems;
}

export function getInventoryItemById(itemId: string) {
  return getInventoryItems().find((item) => item.id === itemId) ?? null;
}

export function getInventoryItemByPartNumber(partNumber: string) {
  const normalizedPartNumber = partNumber.trim().toLowerCase();

  return (
    getInventoryItems().find(
      (item) => item.partNumber.trim().toLowerCase() === normalizedPartNumber
    ) ?? null
  );
}

export function searchInventoryItems(searchTerm: string): InventoryItem[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return getInventoryItems();
  }

  return getInventoryItems().filter((item) => {
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
      item.notes,
      ...item.crossReferencePartNumbers,
      ...item.supersededPartNumbers,
    ];

    return searchableValues.some((value) =>
      value?.toLowerCase().includes(normalizedSearchTerm)
    );
  });
}

export function getLowStockItems(): InventoryItem[] {
  return getInventoryItems().filter(
    (item) => item.quantityOnHand <= item.minimumQuantity
  );
}

export function getRecommendedOrderItems(): InventoryItem[] {
  return getInventoryItems().filter(
    (item) =>
      item.quantityOnHand <= item.minimumQuantity &&
      item.idealStock > item.quantityOnHand
  );
}

export function adjustInventoryQuantity(
  itemId: string,
  quantityDelta: number
): InventoryItem | null {
  const existingItem = getInventoryItemById(itemId);

  if (!existingItem) {
    return null;
  }

  return updateInventoryItem(itemId, {
    quantityOnHand: Math.max(0, existingItem.quantityOnHand + quantityDelta),
  });
}

export function setInventoryQuantity(
  itemId: string,
  quantityOnHand: number
): InventoryItem | null {
  return updateInventoryItem(itemId, {
    quantityOnHand: Math.max(0, quantityOnHand),
  });
}

export function consumeInventory(
  itemId: string,
  quantityUsed: number
): InventoryItem | null {
  return adjustInventoryQuantity(itemId, -Math.abs(quantityUsed));
}

export function restoreInventory(
  itemId: string,
  quantityRestored: number
): InventoryItem | null {
  return adjustInventoryQuantity(itemId, Math.abs(quantityRestored));
}