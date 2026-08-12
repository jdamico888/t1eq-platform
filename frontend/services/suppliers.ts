import { Supplier } from "@/types/supplier";

import {
  createId,
  createTimestamp,
  readStorageArray,
  writeStorageArray,
} from "@/lib/storage";

const STORAGE_KEY = "tier1_suppliers";

export type { Supplier } from "@/types/supplier";

export type SupplierInput = Omit<
  Supplier,
  "id" | "createdDate" | "updatedDate"
>;

export function getSuppliers(): Supplier[] {
  return readStorageArray<Supplier>(STORAGE_KEY);
}

export function saveSuppliers(suppliers: Supplier[]): void {
  writeStorageArray<Supplier>(STORAGE_KEY, suppliers);
}

export function createSupplier(supplier: SupplierInput): Supplier {
  const existingSuppliers = getSuppliers();
  const timestamp = createTimestamp();

  const newSupplier: Supplier = {
    id: createId(),
    ...supplier,
    createdDate: timestamp,
    updatedDate: timestamp,
  };

  saveSuppliers([...existingSuppliers, newSupplier]);

  return newSupplier;
}

export function updateSupplier(
  idOrSupplier: string | Supplier,
  updates?: Partial<SupplierInput>
): Supplier | null {
  const suppliers = getSuppliers();

  const id =
    typeof idOrSupplier === "string" ? idOrSupplier : idOrSupplier.id;

  const existingSupplier = suppliers.find((supplier) => supplier.id === id);

  if (!existingSupplier) return null;

  const updatePayload =
    typeof idOrSupplier === "string" ? updates || {} : idOrSupplier;

  const updatedSupplier: Supplier = {
    ...existingSupplier,
    ...updatePayload,
    updatedDate: createTimestamp(),
  };

  saveSuppliers(
    suppliers.map((supplier) =>
      supplier.id === id ? updatedSupplier : supplier
    )
  );

  return updatedSupplier;
}

export function deleteSupplier(id: string): void {
  const suppliers = getSuppliers();

  saveSuppliers(suppliers.filter((supplier) => supplier.id !== id));
}

export function getSupplierById(id: string): Supplier | undefined {
  return getSuppliers().find((supplier) => supplier.id === id);
}

export function searchSuppliers(searchTerm: string): Supplier[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) return getSuppliers();

  return getSuppliers().filter((supplier) => {
    return (
      supplier.name.toLowerCase().includes(normalizedSearch) ||
      Boolean(supplier.contactName?.toLowerCase().includes(normalizedSearch)) ||
      Boolean(supplier.phone?.toLowerCase().includes(normalizedSearch)) ||
      Boolean(supplier.email?.toLowerCase().includes(normalizedSearch)) ||
      Boolean(supplier.accountNumber?.toLowerCase().includes(normalizedSearch))
    );
  });
}