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
              data-t1eq-business-card="true"
              className="mb-6 rounded-2xl border border-white/10 bg-white/5 bg-cover bg-center p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  data-t1eq-logo-box="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white bg-contain bg-center bg-no-repeat text-sm font-bold text-black"
                >
                  <span data-t1eq-logo-fallback="true">T1</span>
                </div>

                <div>
                  <div className="text-lg font-bold">Tier One Equipment</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    Operations Platform
                  </div>
                </div>
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

            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </div>

        <AppearanceEditor />
      </body>
    </html>
  );
}