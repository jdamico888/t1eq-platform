"use client";

import type {
  ReactNode,
} from "react";

import {
  CARD_GLASS_CLASS,
  CARD_PADDING_CLASS,
  CARD_RADIUS_CLASS,
} from "../../../constants/layout";

type CardProps = {
  children: ReactNode;

  className?: string;

  hoverable?: boolean;

  onClick?: () => void;

  qbitId?: string;
  qbitScope?: string;
};

export default function Card({
  children,
  className = "",
  hoverable = false,
  onClick,
  qbitId,
  qbitScope = "global",
}: CardProps) {
  return (
    <div
      onClick={onClick}
      data-t1eq-tile="true"
      data-t1eq-page-card="true"
      data-t1eq-qbit-type={qbitId ? "page-card" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={`
        ${CARD_GLASS_CLASS}
        ${CARD_PADDING_CLASS}
        ${CARD_RADIUS_CLASS}
        transition-all
        duration-200

        ${
          hoverable
            ? `
              hover:bg-white/25
              hover:shadow-xl
              hover:-translate-y-[1px]
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