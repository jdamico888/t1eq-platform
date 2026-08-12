type BadgeProps = {
  children: React.ReactNode;

  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info";
};

function getVariantClasses(
  variant: string
): string {
  switch (variant) {
    case "success":
      return "border border-emerald-500/20 bg-emerald-500/15 text-emerald-300";

    case "warning":
      return "border border-amber-500/20 bg-amber-500/15 text-amber-300";

    case "danger":
      return "border border-red-500/20 bg-red-500/15 text-red-300";

    case "info":
      return "border border-cyan-500/20 bg-cyan-500/15 text-cyan-300";

    default:
      return "border border-white/10 bg-white/10 text-slate-200";
  }
}

export default function Badge({
  children,
  variant = "default",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getVariantClasses(
        variant
      )}`}
    >
      {children}
    </span>
  );
}