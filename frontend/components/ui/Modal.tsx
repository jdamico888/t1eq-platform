"use client";

import type { ReactNode } from "react";

type ModalSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "full";

type ModalProps = {
  title: string;

  children?: ReactNode;

  onClose: () => void;

  isOpen?: boolean;

  size?: ModalSize;

  footer?: ReactNode;

  qbitId?: string;
  qbitScope?: string;

  widthClassName?: string;
};

function getSizeClass(size: ModalSize): string {
  switch (size) {
    case "sm":
      return "max-w-md";

    case "md":
      return "max-w-xl";

    case "lg":
      return "max-w-2xl";

    case "xl":
      return "max-w-4xl";

    case "2xl":
      return "max-w-6xl";

    case "full":
      return "max-w-[calc(100vw-2rem)]";

    default:
      return "max-w-2xl";
  }
}

export default function Modal({
  title,
  children,
  onClose,

  isOpen = true,

  size = "lg",

  footer,

  qbitId,
  qbitScope = "global",

  widthClassName,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  const resolvedWidthClass =
    widthClassName || getSizeClass(size);

  const modalBaseId =
    qbitId || undefined;

  return (
    <div
      data-t1eq-qbit-type={
        modalBaseId ? "background" : undefined
      }
      data-t1eq-qbit-id={
        modalBaseId
          ? `${modalBaseId}-backdrop`
          : undefined
      }
      data-t1eq-qbit-scope={
        modalBaseId ? qbitScope : undefined
      }
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        data-t1eq-page-card="true"
        data-t1eq-qbit-type={
          modalBaseId ? "page-card" : undefined
        }
        data-t1eq-qbit-id={
          modalBaseId
            ? `${modalBaseId}-container`
            : undefined
        }
        data-t1eq-qbit-scope={
          modalBaseId ? qbitScope : undefined
        }
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-white text-black shadow-2xl ${resolvedWidthClass}`}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div
          data-t1eq-qbit-type={
            modalBaseId ? "section" : undefined
          }
          data-t1eq-qbit-id={
            modalBaseId
              ? `${modalBaseId}-header`
              : undefined
          }
          data-t1eq-qbit-scope={
            modalBaseId ? qbitScope : undefined
          }
          className="flex shrink-0 items-center justify-between gap-4 border-b border-black/10 px-6 py-4"
        >
          <h2
            data-t1eq-qbit-type={
              modalBaseId ? "text" : undefined
            }
            data-t1eq-qbit-id={
              modalBaseId
                ? `${modalBaseId}-title`
                : undefined
            }
            data-t1eq-qbit-scope={
              modalBaseId ? qbitScope : undefined
            }
            className="text-xl font-black"
          >
            {title}
          </h2>

          <button
            type="button"
            data-t1eq-action-button="true"
            data-t1eq-qbit-type={
              modalBaseId
                ? "action-button"
                : undefined
            }
            data-t1eq-qbit-id={
              modalBaseId
                ? `${modalBaseId}-close-button`
                : undefined
            }
            data-t1eq-qbit-scope={
              modalBaseId ? qbitScope : undefined
            }
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl border border-black/10 px-3 py-2 text-sm font-bold transition hover:bg-black/5"
          >
            Close
          </button>
        </div>

        <div
          data-t1eq-qbit-type={
            modalBaseId ? "section" : undefined
          }
          data-t1eq-qbit-id={
            modalBaseId
              ? `${modalBaseId}-body`
              : undefined
          }
          data-t1eq-qbit-scope={
            modalBaseId ? qbitScope : undefined
          }
          className="min-h-0 flex-1 overflow-y-auto p-6"
        >
          {children}
        </div>

        {footer && (
          <div
            data-t1eq-qbit-type={
              modalBaseId ? "section" : undefined
            }
            data-t1eq-qbit-id={
              modalBaseId
                ? `${modalBaseId}-footer`
                : undefined
            }
            data-t1eq-qbit-scope={
              modalBaseId ? qbitScope : undefined
            }
            className="flex shrink-0 items-center justify-end gap-3 border-t border-black/10 px-6 py-4"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}