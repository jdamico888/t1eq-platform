import { EquipmentModel } from "@/types/equipment-model";
import {
  createId,
  createTimestamp,
  readStorageArray,
  writeStorageArray,
} from "@/lib/storage";

const STORAGE_KEY = "tier1_equipment_models";

export type { EquipmentModel } from "@/types/equipment-model";

export type EquipmentModelInput = Omit<
  EquipmentModel,
  "id" | "createdDate" | "updatedDate"
>;

export function getEquipmentModels(): EquipmentModel[] {
  return readStorageArray<EquipmentModel>(STORAGE_KEY);
}

export function saveEquipmentModels(
  equipmentModels: EquipmentModel[]
): void {
  writeStorageArray<EquipmentModel>(STORAGE_KEY, equipmentModels);
}

export function createEquipmentModel(
  equipmentModel: EquipmentModelInput
): EquipmentModel {
  const existingEquipmentModels = getEquipmentModels();
  const timestamp = createTimestamp();

  const newEquipmentModel: EquipmentModel = {
    id: createId(),
    ...equipmentModel,
    createdDate: timestamp,
    updatedDate: timestamp,
  };

  saveEquipmentModels([...existingEquipmentModels, newEquipmentModel]);

  return newEquipmentModel;
}

export function updateEquipmentModel(
  idOrEquipmentModel: string | EquipmentModel,
  updates?: Partial<EquipmentModelInput>
): EquipmentModel | null {
  const equipmentModels = getEquipmentModels();

  const id =
    typeof idOrEquipmentModel === "string"
      ? idOrEquipmentModel
      : idOrEquipmentModel.id;

  const existingEquipmentModel = equipmentModels.find(
    (equipmentModel) => equipmentModel.id === id
  );

  if (!existingEquipmentModel) return null;

  const updatePayload =
    typeof idOrEquipmentModel === "string"
      ? updates || {}
      : idOrEquipmentModel;

  const updatedEquipmentModel: EquipmentModel = {
    ...existingEquipmentModel,
    ...updatePayload,
    updatedDate: createTimestamp(),
  };

  saveEquipmentModels(
    equipmentModels.map((equipmentModel) =>
      equipmentModel.id === id ? updatedEquipmentModel : equipmentModel
    )
  );

  return updatedEquipmentModel;
}

export function deleteEquipmentModel(id: string): void {
  const equipmentModels = getEquipmentModels();

  saveEquipmentModels(
    equipmentModels.filter((equipmentModel) => equipmentModel.id !== id)
  );
}

export function getEquipmentModelById(
  id: string
): EquipmentModel | undefined {
  return getEquipmentModels().find((equipmentModel) => equipmentModel.id === id);
}

export function findEquipmentModelByExactName(
  model: string
): EquipmentModel | undefined {
  const normalizedModel = model.trim().toLowerCase();

  if (!normalizedModel) return undefined;

  return getEquipmentModels().find(
    (equipmentModel) =>
      equipmentModel.model.trim().toLowerCase() === normalizedModel
  );
}

export function searchEquipmentModels(searchTerm: string): EquipmentModel[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) return getEquipmentModels();

  return getEquipmentModels().filter((equipmentModel) => {
    return (
      equipmentModel.model.toLowerCase().includes(normalizedSearch) ||
      Boolean(
        equipmentModel.manufacturer
          ?.toLowerCase()
          .includes(normalizedSearch)
      ) ||
      Boolean(
        equipmentModel.category?.toLowerCase().includes(normalizedSearch)
      )
    );
  });
}
