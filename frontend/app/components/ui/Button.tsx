"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success";

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: ButtonVariant;
    fullWidth?: boolean;

    qbitId?: string;
    qbitScope?: string;
  };

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  disabled,
  type = "button",
  qbitId,
  qbitScope = "global",
  ...props
}: ButtonProps) {
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-black/25 text-black hover:bg-black/35 border-black/20",

    secondary:
      "bg-white/25 text-black hover:bg-white/40 border-black/10",

    danger:
      "bg-red-500/20 text-red-900 hover:bg-red-500/30 border-red-500/30",

    success:
      "bg-green-500/20 text-green-900 hover:bg-green-500/30 border-green-500/30",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      data-t1eq-action-button="true"
      data-t1eq-qbit-type={qbitId ? "action-button" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={`
        rounded-xl
        border
        px-5
        py-3
        font-semibold
        transition-all
        duration-200
        outline-none
        focus:ring-2
        focus:ring-black/20
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${fullWidth ? "w-full" : ""}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}