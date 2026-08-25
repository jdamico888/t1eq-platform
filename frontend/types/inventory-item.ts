export type InventoryItemImageSource =
  | "Camera"
  | "Desktop Upload"
  | "Manufacturer"
  | "Imported"
  | "Unknown";

export type InventoryItemImage = {
  id: string;
  imageUrl: string;
  source: InventoryItemImageSource;
  label?: string;
  capturedDate: string;
};

/**
 * Where an item sits within its location. "Row" is only meaningful on a
 * Truck location, where it means which side of the truck the item is
 * stored on.
 */
export type InventoryRow = "Inside" | "Outside";

export type InventoryItem = {
  id: string;

  partNumber: string;
  name: string;
  description?: string;

  quantityOnHand: number;

  /**
   * How many individual pieces come in one package (a box of 25 clips
   * has quantityPerPackage 25). Used to convert package counts to piece
   * counts when receiving.
   */
  quantityPerPackage?: number;

  minimumQuantity: number;
  minimumStock: number;
  idealStock: number;

  cost: number;

  sellPrice: number;
  price: number;

  /**
   * True once someone with pricing rights has typed a sell price by hand.
   * While false, the sell price is kept in step with cost using the markup
   * from Business Setup. Once true, restocking at a new cost no longer
   * recalculates it — a manager's decision stands until it is changed
   * deliberately.
   */
  sellPriceOverridden?: boolean;

  /**
   * A part the shop does not carry and orders in per job. Used as the
   * default when the part is added to an appointment; whoever adds it can
   * still mark a normally-stocked part as special-order for one job.
   */
  isSpecialOrder?: boolean;

  /**
   * Display name of the location. Kept for older records and list views;
   * locationId is the real link to a record from
   * services/inventory-locations.ts.
   */
  location?: string;

  locationId?: string;

  /**
   * Structured storage address within the location. binLocation below is
   * kept in sync as a human-readable summary of these
   * ("Outside · B · 3 · 14") so existing screens keep working.
   */
  row?: InventoryRow;
  section?: string;
  shelf?: string;
  bin?: string;

  binLocation?: string;

  manufacturer?: string;
  supplierName?: string;

  oemPartNumber?: string;
  vendorPartNumber?: string;

  crossReferencePartNumbers: string[];
  supersededPartNumbers: string[];

  /**
   * Primary required item photo.
   * This remains for backward compatibility with older inventory records.
   */
  imageUrl?: string;

  /**
   * Thumbnail used in list/table views.
   * Usually the same as imageUrl until image compression is added.
   */
  thumbnailUrl?: string;

  /**
   * Optional manufacturer/catalog image.
   */
  manufacturerImageUrl?: string;

  /**
   * Full image collection for the inventory item.
   * Use this for multiple required item photos later.
   */
  itemImages?: InventoryItemImage[];

  /**
   * The four photos captured by the Add Item flow. Each is a data URL.
   * They are also mirrored into itemImages with labels so any screen that
   * renders the image collection picks them up automatically.
   */
  itemPhotoFrontUrl?: string;
  itemPhotoSideUrl?: string;
  itemPhotoLabelUrl?: string;
  receiptPhotoUrl?: string;

  requiredPhotoCaptured?: boolean;
  requiredPhotoCapturedDate?: string;
  requiredPhotoSource?: InventoryItemImageSource;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};