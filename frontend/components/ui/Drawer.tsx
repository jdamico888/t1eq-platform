"use client";

type DrawerProps = {
  title: string;

  isOpen: boolean;

  onClose: () => void;

  children: React.ReactNode;

  width?: "sm" | "md" | "lg";
};

function getWidthClass(
  width: string
): string {
  switch (width) {
    case "sm":
      return "w-[420px]";

    case "md":
      return "w-[640px]";

    case "lg":
      return "w-[900px]";

    default:
      return "w-[640px]";
  }
}

export default function Drawer({
  title,
  isOpen,
  onClose,
  children,
  width = "md",
}: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
      <div
        className={`h-screen overflow-hidden border-l border-white/10 bg-slate-950 shadow-2xl ${getWidthClass(
          width
        )}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
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

          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}