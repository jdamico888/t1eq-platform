"use client";

type ModalProps = {
  title: string;

  isOpen: boolean;

  onClose: () => void;

  children: React.ReactNode;

  footer?: React.ReactNode;

  size?: "sm" | "md" | "lg" | "xl";
};

function getSizeClass(
  size: string
): string {
  switch (size) {
    case "sm":
      return "max-w-md";

    case "md":
      return "max-w-2xl";

    case "lg":
      return "max-w-4xl";

    case "xl":
      return "max-w-6xl";

    default:
      return "max-w-2xl";
  }
}

export default function Modal({
  title,
  isOpen,
  onClose,
  children,
  footer,
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className={`w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl ${getSizeClass(
          size
        )}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-2xl font-semibold">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {children}
        </div>

        {footer && (
          <div className="border-t border-white/10 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}