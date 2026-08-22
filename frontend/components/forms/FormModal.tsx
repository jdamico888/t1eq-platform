"use client";

type FormModalProps = {
  title: string;

  isOpen: boolean;

  children: React.ReactNode;

  onClose: () => void;

  width?: "sm" | "md" | "lg" | "xl";
};

function getWidthClass(
  width: string
): string {
  switch (width) {
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

export default function FormModal({
  title,
  isOpen,
  children,
  onClose,
  width = "md",
}: FormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl ${getWidthClass(
          width
        )}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {title}
          </h2>

          <button data-t1eq-action-button="true"
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}