import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";
import "./appearance-theme.css";

import AppearanceEditor from "@/components/appearance/AppearanceEditor";
import AppearanceThemeClient from "@/components/appearance/AppearanceThemeClient";
import CategorySubnavigation from "@/components/navigation/CategorySubnavigation";
import SidebarNav from "@/app/components/layout/SidebarNav";

export const metadata: Metadata = {
  title: "Tier One Equipment",
  description:
    "Tier One Equipment service, inventory, dispatch, and operations platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppearanceThemeClient />

        <div className="flex min-h-screen bg-zinc-100 text-black">
          <aside
            data-t1eq-sidebar="true"
            className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-5 text-white lg:block"
          >
            <div
              data-t1eq-sidebar-brand="true"
              className="mb-6 flex min-h-36 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
            >
              <div
                data-t1eq-logo-box="true"
                className="flex h-20 w-full max-w-[190px] items-center justify-center rounded-xl bg-white/5 bg-contain bg-center bg-no-repeat"
              >
                <span
                  data-t1eq-logo-fallback="true"
                  className="text-xl font-black text-white"
                >
                  T1
                </span>
              </div>

              <div className="mt-3 max-w-full truncate text-lg font-black leading-tight text-white">
                Tier One Equipment
              </div>

              <div className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-white/60">
                Operations Platform
              </div>
            </div>

            <SidebarNav />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3 lg:hidden">
              <Link href="/dashboard" className="text-lg font-bold">
                Tier One Equipment
              </Link>

              <Link
                href="/settings"
                className="rounded-lg border border-zinc-300 px-3 py-1 text-sm font-semibold"
              >
                Menu
              </Link>
            </header>

            <CategorySubnavigation />

            <main data-t1eq-page-background="true" className="min-w-0 flex-1">{children}</main>
          </div>
        </div>

        <AppearanceEditor />
      </body>
    </html>
  );
}


