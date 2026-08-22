"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ActionButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "warning";

type ActionButtonProps = {
  children: ReactNode;

  variant?: ActionButtonVariant;

  qbitId?: string;
  qbitScope?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
>;

function getVariantClasses(
  variant: ActionButtonVariant
): string {
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
  qbitId,
  qbitScope = "global",
  className = "",
  ...buttonProps
}: ActionButtonProps) {
  return (
    <button
      type={type}
      data-t1eq-action-button="true"
      data-t1eq-qbit-type={qbitId ? "action-button" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={`rounded-xl px-4 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${getVariantClasses(
        variant
      )} ${className}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
}