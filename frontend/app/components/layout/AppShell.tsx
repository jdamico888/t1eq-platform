"use client";

import type {
  ReactNode,
} from "react";

import AppBackground from "./AppBackground";
import SidebarHeader from "./SidebarHeader";
import SidebarNav from "./SidebarNav";

import {
  SIDEBAR_WIDTH_CLASS,
} from "../../../constants/layout";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({
  children,
}: AppShellProps) {
  return (
    <AppBackground>
      <div className="relative z-10 flex h-screen overflow-hidden">
        <aside
          className={`
            ${SIDEBAR_WIDTH_CLASS}
            shrink-0
            h-screen
            overflow-y-auto
            bg-white/35
            border-r
            border-black/10
            p-6
            flex
            flex-col
            gap-3
            shadow-xl
          `}
        >
          <SidebarHeader />

          <SidebarNav />
        </aside>

        <main
          className="
            flex-1
            h-screen
            overflow-y-auto
            bg-white/5
          "
        >
          {children}
        </main>
      </div>
    </AppBackground>
  );
}