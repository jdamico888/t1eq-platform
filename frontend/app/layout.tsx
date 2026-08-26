import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";
import "./appearance-theme.css";

import AppearanceEditor from "@/components/appearance/AppearanceEditor";
import AppearanceThemeClient from "@/components/appearance/AppearanceThemeClient";
import CategorySubnavigation from "@/components/navigation/CategorySubnavigation";
import SidebarNav from "@/app/components/layout/SidebarNav";
import BusinessNameLabel from "@/components/layout/BusinessNameLabel";
import StorageFullBanner from "@/components/layout/StorageFullBanner";
import { PageHeaderProvider } from "@/components/navigation/page-header-slot";
import AuthGate from "@/components/auth/AuthGate";
import CurrentUserBadge from "@/components/auth/CurrentUserBadge";

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

        <AuthGate>
        <PageHeaderProvider>
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

              <BusinessNameLabel
                qbitId="sidebar-company-name"
                qbitScope="global"
                className="mt-3 text-lg font-bold"
                fallback="Tier One Equipment"
              />

              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="sidebar-platform-label"
                data-t1eq-qbit-scope="global"
                className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/50"
              >
                Operations Platform
              </div>
            </div>

            <CurrentUserBadge />

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

            {/*
              * The header tile floats as the page scrolls.
              *
              * Two things have to be true, and each one has already been
              * got wrong once.
              *
              * The sticky cannot live on the card itself: a sticky element
              * only travels inside its own parent's box, and the card's
              * parent is no taller than the card. It belongs on a wrapper
              * whose parent is the content column, which runs the full
              * height of the page.
              *
              * And the sticky element must be one Q-Bit cannot select.
              * Q-Bit writes `position: relative !important` on anything
              * that has been moved, which overrules `sticky` outright —
              * so a single nudge on this wrapper was enough to ground the
              * header permanently. Q-Bit only ever targets elements
              * carrying both data-t1eq-qbit-id and data-t1eq-qbit-type,
              * so this wrapper carries neither and is out of reach.
              *
              * There used to be a second, editable div in here —
              * "category-subnavigation-container" — sitting directly
              * behind the header card. It is gone. It was never visible:
              * the card covers it exactly and paints over it, so every
              * background and border set on it was applied faithfully to
              * something nobody could ever see. That is what was
              * swallowing header edits, and an element that can only
              * absorb work is worth less than no element at all.
              *
              * z-30 sits above page content but below the Q-Bit editor
              * and the arrangement trash, so neither gets covered while
              * the bar is being edited.
              */}
            <div className="sticky top-0 z-30">
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
        </PageHeaderProvider>
        </AuthGate>

        <AppearanceEditor />

        <StorageFullBanner />
      </body>
    </html>
  );
}