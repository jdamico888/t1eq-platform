import { createId } from "./ids";

export function readStorageArray<T>(
  key: string
): T[] {
  if (typeof window === "undefined")
    return [];

  const storedValue =
    localStorage.getItem(key);

  if (!storedValue) return [];

  try {
    const parsedValue =
      JSON.parse(storedValue);

    return Array.isArray(
      parsedValue
    )
      ? (parsedValue as T[])
      : [];
  } catch {
    return [];
  }
}

export function writeStorageArray<T>(
  key: string,
  values: T[]
): void {
  if (typeof window === "undefined")
    return;

  localStorage.setItem(
    key,
    JSON.stringify(values)
  );
}

export { createId };

export function createTimestamp(): string {
  return new Date().toISOString();
}