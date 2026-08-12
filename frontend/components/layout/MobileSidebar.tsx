"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { NAVIGATION_ITEMS } from "@/constants/navigation";

export default function MobileSidebar() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] =
    useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-4 backdrop-blur-xl lg:hidden">
        <div>
          <div className="text-lg font-bold">
            Tier 1 Equipment
          </div>

          <div className="text-xs text-slate-400">
            Operations Platform
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsOpen(!isOpen)
          }
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
        >
          Menu
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm lg:hidden">
          <div className="h-full w-72 overflow-y-auto border-r border-white/10 bg-slate-950 p-6">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">
                  Tier 1 Equipment
                </div>

                <div className="text-xs text-slate-400">
                  Operations Platform
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsOpen(false)
                }
                className="rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <nav className="space-y-2">
              {NAVIGATION_ITEMS.map(
                (item) => {
                  const isActive =
                    pathname ===
                      item.href ||
                    (item.href !==
                      "/" &&
                      pathname.startsWith(
                        item.href
                      ));

                  return (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      onClick={() =>
                        setIsOpen(
                          false
                        )
                      }
                      className={`block rounded-xl px-4 py-3 text-sm transition ${
                        isActive
                          ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950/40"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {
                        item.label
                      }
                    </Link>
                  );
                }
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}