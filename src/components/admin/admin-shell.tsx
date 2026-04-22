"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useState } from "react";
import { ADMIN_SESSION_KEY } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/ordini", label: "Ordini", icon: ClipboardList },
  { href: "/cucina", label: "Kitchen display", icon: ChefHat, external: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function logout() {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-pork-cream">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-pork-ink text-pork-cream transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-pork-cream/10 p-5">
          <Link href="/admin" className="headline text-2xl text-pork-mustard">
            Be Pork · admin
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Chiudi"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((it) => {
            const active =
              !it.external &&
              (pathname === it.href ||
                (it.href !== "/admin" && pathname?.startsWith(it.href)));
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                target={it.external ? "_blank" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-colors",
                  active
                    ? "bg-pork-mustard text-pork-ink"
                    : "text-pork-cream/80 hover:bg-pork-cream/5 hover:text-pork-cream",
                )}
              >
                <Icon size={18} />
                {it.label}
                {it.external && (
                  <span className="ml-auto rounded-full bg-pork-cream/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    nuova tab
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-3 rounded-xl bg-pork-red px-4 py-3 font-semibold text-white transition-colors hover:bg-pork-red-dark"
        >
          <LogOut size={18} /> Esci
        </button>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-pork-ink/70 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-pork-ink/10 bg-pork-cream/95 px-5 py-3 backdrop-blur-lg lg:hidden">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pork-ink text-pork-cream"
            onClick={() => setOpen(true)}
            aria-label="Apri menu"
          >
            <MenuIcon size={20} />
          </button>
          <span className="impact-title text-pork-ink">Admin</span>
          <div className="w-10" />
        </header>

        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
