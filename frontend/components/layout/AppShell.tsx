"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import MobileSidebar from "@/components/layout/MobileSidebar";
import { NAVIGATION_ITEMS } from "@/constants/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <MobileSidebar />

        <aside className="hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:block">
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight">
              Tier 1 Equipment
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Operations Platform
            </p>
          </div>

          <nav className="space-y-2">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm transition ${
                    isActive
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950/40"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-[1800px] p-6 xl:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}