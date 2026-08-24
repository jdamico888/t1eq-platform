export type EquipmentModel = {
  id: string;

  model: string;

  manufacturer?: string;
  category?: string;

  pictureUrls: string[];

  repairManualUrl?: string;
  repairManualName?: string;

  partsManualUrl?: string;
  partsManualName?: string;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};
