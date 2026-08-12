type StatusBadgeProps = {
  status: string;
};

function getStatusClasses(
  status: string
): string {
  const normalizedStatus =
    status.toLowerCase();

  if (
    normalizedStatus.includes(
      "active"
    ) ||
    normalizedStatus.includes(
      "completed"
    ) ||
    normalizedStatus.includes(
      "paid"
    ) ||
    normalizedStatus.includes(
      "passed"
    )
  ) {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20";
  }

  if (
    normalizedStatus.includes(
      "pending"
    ) ||
    normalizedStatus.includes(
      "open"
    ) ||
    normalizedStatus.includes(
      "scheduled"
    ) ||
    normalizedStatus.includes(
      "draft"
    )
  ) {
    return "bg-amber-500/15 text-amber-300 border border-amber-500/20";
  }

  if (
    normalizedStatus.includes(
      "cancel"
    ) ||
    normalizedStatus.includes(
      "failed"
    ) ||
    normalizedStatus.includes(
      "out"
    )
  ) {
    return "bg-red-500/15 text-red-300 border border-red-500/20";
  }

  return "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20";
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
        status
      )}`}
    >
      {status}
    </span>
  );
}