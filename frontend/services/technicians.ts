import { Technician } from "@/types/technician";

import {
  createId,
  createTimestamp,
  readStorageArray,
  writeStorageArray,
} from "@/lib/storage";

const STORAGE_KEY = "tier1_technicians";

export type { Technician } from "@/types/technician";

export type TechnicianInput = Omit<
  Technician,
  "id" | "createdDate" | "updatedDate"
>;

export function getTechnicians(): Technician[] {
  return readStorageArray<Technician>(STORAGE_KEY);
}

export function saveTechnicians(
  technicians: Technician[]
): void {
  writeStorageArray<Technician>(
    STORAGE_KEY,
    technicians
  );
}

export function generateEmployeeId(): string {
  const technicians =
    getTechnicians();

  const nextNumber =
    technicians.length + 1;

  return `TECH-${nextNumber
    .toString()
    .padStart(4, "0")}`;
}

export function createTechnician(
  technician: TechnicianInput
): Technician {
  const existingTechnicians =
    getTechnicians();

  const timestamp =
    createTimestamp();

  const employeeId =
    technician.employeeId ||
    generateEmployeeId();

  const newTechnician: Technician =
    {
      id: createId(),

      ...technician,

      employeeId,

      createdDate: timestamp,
      updatedDate: timestamp,
    };

  saveTechnicians([
    ...existingTechnicians,
    newTechnician,
  ]);

  return newTechnician;
}

export function updateTechnician(
  idOrTechnician:
    | string
    | Technician,
  updates?: Partial<TechnicianInput>
): Technician | null {
  const technicians =
    getTechnicians();

  const id =
    typeof idOrTechnician ===
    "string"
      ? idOrTechnician
      : idOrTechnician.id;

  const existingTechnician =
    technicians.find(
      (technician) =>
        technician.id === id
    );

  if (!existingTechnician)
    return null;

  const updatePayload =
    typeof idOrTechnician ===
    "string"
      ? updates || {}
      : idOrTechnician;

  const updatedTechnician: Technician =
    {
      ...existingTechnician,
      ...updatePayload,
      updatedDate:
        createTimestamp(),
    };

  saveTechnicians(
    technicians.map(
      (technician) =>
        technician.id === id
          ? updatedTechnician
          : technician
    )
  );

  return updatedTechnician;
}

export function deleteTechnician(
  id: string
): void {
  const technicians =
    getTechnicians();

  saveTechnicians(
    technicians.filter(
      (technician) =>
        technician.id !== id
    )
  );
}

export function getTechnicianById(
  id: string
): Technician | undefined {
  return getTechnicians().find(
    (technician) =>
      technician.id === id
  );
}

export function searchTechnicians(
  searchTerm: string
): Technician[] {
  const normalizedSearch =
    searchTerm.trim().toLowerCase();

  if (!normalizedSearch)
    return getTechnicians();

  return getTechnicians().filter(
    (technician) => {
      return (
        technician.employeeId
          .toLowerCase()
          .includes(
            normalizedSearch
          ) ||

        technician.firstName
          .toLowerCase()
          .includes(
            normalizedSearch
          ) ||

        technician.lastName
          .toLowerCase()
          .includes(
            normalizedSearch
          ) ||

        Boolean(
          technician.email
            ?.toLowerCase()
            .includes(
              normalizedSearch
            )
        ) ||

        Boolean(
          technician.phone
            ?.toLowerCase()
            .includes(
              normalizedSearch
            )
        ) ||

        technician.status
          .toLowerCase()
          .includes(
            normalizedSearch
          )
      );
    }
  );
}