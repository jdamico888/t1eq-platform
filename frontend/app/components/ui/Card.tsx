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
};

export default function Card({
  children,
  className = "",
  hoverable = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
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