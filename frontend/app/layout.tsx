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

        <div
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="app-shell"
          data-t1eq-qbit-scope="global"
          className="flex min-h-screen bg-zinc-100 text-black"
        >
          <aside
            data-t1eq-sidebar="true"
            data-t1eq-qbit-type="sidebar"
            data-t1eq-qbit-id="main-sidebar"
            data-t1eq-qbit-scope="global"
            className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-5 text-white lg:block"
          >
            <div
              data-t1eq-tile="true"
              data-t1eq-page-card="true"
              data-t1eq-qbit-type="tile"
              data-t1eq-qbit-id="sidebar-brand-card"
              data-t1eq-qbit-scope="global"
              className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
            >
              <div
                data-t1eq-logo-box="true"
                data-t1eq-qbit-type="logo"
                data-t1eq-qbit-id="sidebar-logo"
                data-t1eq-qbit-scope="global"
                className="flex h-[11.5rem] w-full items-center justify-center rounded-xl bg-white bg-contain bg-center bg-no-repeat text-sm font-bold text-black"
              >
                <span
                  data-t1eq-logo-fallback="true"
                  data-t1eq-qbit-type="text"
                  data-t1eq-qbit-id="sidebar-logo-fallback"
                  data-t1eq-qbit-scope="global"
                >
                  T1
                </span>
              </div>

              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="sidebar-company-name"
                data-t1eq-qbit-scope="global"
                className="mt-3 text-lg font-bold"
              >
                Tier One Equipment
              </div>

              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="sidebar-platform-label"
                data-t1eq-qbit-scope="global"
                className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/50"
              >
                Operations Platform
              </div>
            </div>

            <div
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="sidebar-navigation"
              data-t1eq-qbit-scope="global"
            >
              <SidebarNav />
            </div>
          </aside>

          <div
            data-t1eq-qbit-type="section"
            data-t1eq-qbit-id="app-content-column"
            data-t1eq-qbit-scope="global"
            className="flex min-w-0 flex-1 flex-col"
          >
            <header
              data-t1eq-page-card="true"
              data-t1eq-qbit-type="page-card"
              data-t1eq-qbit-id="mobile-header"
              data-t1eq-qbit-scope="global"
              className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3 lg:hidden"
            >
              <Link
                href="/dashboard"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="mobile-dashboard-link"
                data-t1eq-qbit-scope="global"
                className="text-lg font-bold"
              >
                Tier One Equipment
              </Link>

              <Link
                href="/settings"
                data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="mobile-menu-button"
                data-t1eq-qbit-scope="global"
                className="rounded-lg border border-zinc-300 px-3 py-1 text-sm font-semibold"
              >
                Menu
              </Link>
            </header>

            <div
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="category-subnavigation-container"
              data-t1eq-qbit-scope="global"
            >
              <CategorySubnavigation />
            </div>

            <main
              data-t1eq-page-background="true"
              data-t1eq-qbit-type="background"
              data-t1eq-qbit-id="main-page-background"
              data-t1eq-qbit-scope="global"
              className="min-w-0 flex-1"
            >
              {children}
            </main>
          </div>
        </div>

        <AppearanceEditor />
      </body>
    </html>
  );
}