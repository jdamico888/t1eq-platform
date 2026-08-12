const MANUFACTURER_KEY = "tier1_equipment_manufacturers";
const CATEGORY_KEY = "tier1_equipment_categories";

function getStoredArray(key: string): string[] {
  if (typeof window === "undefined") return [];

  const storedValues = localStorage.getItem(key);

  if (!storedValues) return [];

  try {
    const parsedValues = JSON.parse(storedValues);

    return Array.isArray(parsedValues) ? parsedValues : [];
  } catch {
    return [];
  }
}

function saveStoredArray(key: string, values: string[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(key, JSON.stringify(values));
}

function normalizeValue(value: string): string {
  return value.trim();
}

function sortValues(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function addUniqueValue(key: string, value: string): string[] {
  const normalizedValue = normalizeValue(value);

  if (!normalizedValue) return getStoredArray(key);

  const existingValues = getStoredArray(key);

  const alreadyExists = existingValues.some(
    (existingValue) =>
      existingValue.toLowerCase() === normalizedValue.toLowerCase()
  );

  if (alreadyExists) return existingValues;

  const updatedValues = sortValues([...existingValues, normalizedValue]);

  saveStoredArray(key, updatedValues);

  return updatedValues;
}

export function getCustomManufacturers(): string[] {
  return getStoredArray(MANUFACTURER_KEY);
}

export function addCustomManufacturer(manufacturer: string): string[] {
  return addUniqueValue(MANUFACTURER_KEY, manufacturer);
}

export function getCustomCategories(): string[] {
  return getStoredArray(CATEGORY_KEY);
}

export function addCustomCategory(category: string): string[] {
  return addUniqueValue(CATEGORY_KEY, category);
}