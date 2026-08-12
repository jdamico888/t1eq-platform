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

export type InventoryItem = {
  id: string;

  partNumber: string;
  name: string;
  description?: string;

  quantityOnHand: number;

  minimumQuantity: number;
  minimumStock: number;
  idealStock: number;

  cost: number;

  sellPrice: number;
  price: number;

  location?: string;
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

  requiredPhotoCaptured?: boolean;
  requiredPhotoCapturedDate?: string;
  requiredPhotoSource?: InventoryItemImageSource;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};