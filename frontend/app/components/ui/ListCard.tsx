import type {
  ReactNode,
} from "react";

type ListCardProps = {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;

  qbitId?: string;
  qbitScope?: string;
};

export default function ListCard({
  children,
  className = "",
  hoverable = true,
  qbitId,
  qbitScope = "global",
}: ListCardProps) {
  return (
    <div
      data-t1eq-tile="true"
      data-t1eq-page-card="true"
      data-t1eq-qbit-type={qbitId ? "page-card" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={`
        rounded-xl
        border
        border-black/10
        bg-white/20
        p-4
        transition-all
        duration-200

        ${
          hoverable
            ? `
              hover:bg-white/30
              hover:shadow-md
              cursor-pointer
            `
            : ""
        }

        ${className}
      `}
    >
      {children}
    </div>
  );
}