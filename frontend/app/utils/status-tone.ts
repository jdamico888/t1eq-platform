export type StatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

export function getStatusTone(
  status: string
): StatusTone {
  const normalizedStatus =
    status.toLowerCase();

  if (
    normalizedStatus.includes("paid") ||
    normalizedStatus.includes("completed") ||
    normalizedStatus.includes("received") ||
    normalizedStatus.includes("active")
  ) {
    return "success";
  }

  if (
    normalizedStatus.includes("waiting") ||
    normalizedStatus.includes("partial") ||
    normalizedStatus.includes("scheduled") ||
    normalizedStatus.includes("draft")
  ) {
    return "warning";
  }

  if (
    normalizedStatus.includes("overdue") ||
    normalizedStatus.includes("cancelled") ||
    normalizedStatus.includes("inactive") ||
    normalizedStatus.includes("critical")
  ) {
    return "danger";
  }

  if (
    normalizedStatus.includes("progress") ||
    normalizedStatus.includes("dispatched") ||
    normalizedStatus.includes("traveling") ||
    normalizedStatus.includes("site")
  ) {
    return "info";
  }

  return "neutral";
}