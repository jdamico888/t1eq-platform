export function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function createSequentialNumber(
  prefix: string,
  count: number,
  padLength = 5
): string {
  return `${prefix}-${(
    count + 1
  )
    .toString()
    .padStart(padLength, "0")}`;
}