type ActionButtonVariant = "primary" | "secondary" | "danger" | "warning";

type ActionButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  variant?: ActionButtonVariant;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

function getVariantClasses(variant: ActionButtonVariant): string {
  switch (variant) {
    case "primary":
      return "bg-cyan-600 hover:bg-cyan-500 text-white";

    case "secondary":
      return "border border-white/10 hover:bg-white/10 text-white";

    case "danger":
      return "bg-red-600 hover:bg-red-500 text-white";

    case "warning":
      return "bg-amber-500 hover:bg-amber-400 text-black";

    default:
      return "bg-cyan-600 hover:bg-cyan-500 text-white";
  }
}

export default function ActionButton({
  children,
  type = "button",
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
}: ActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${getVariantClasses(
        variant
      )} ${className}`}
    >
      {children}
    </button>
  );
}