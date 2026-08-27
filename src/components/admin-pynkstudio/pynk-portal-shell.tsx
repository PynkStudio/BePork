"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  LogOut,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { clearAdminSession } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";
import { isPynkNavActive } from "./pynk-path";

export type PortalNavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  external?: boolean;
};

type PynkPortalShellProps = {
  portalLabel: string;
  portalIcon: React.ElementType;
  navItems: PortalNavItem[];
  children: React.ReactNode;
};

export function PynkPortalShell({
  portalLabel,
  portalIcon: PortalIcon,
  navItems,
  children,
}: PynkPortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function logout() {
    clearAdminSession();
    router.replace("/admin-pynkstudio/login");
  }

  return (
    <div className="pynk-admin-root">
      <aside
        className={cn(
          "pynk-admin-sidebar fixed inset-y-0 left-0 z-30 flex w-64 flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="pynk-admin-sidebar-header flex items-center justify-between p-5">
          <Link href="/admin-pynkstudio" className="pynk-admin-brand flex items-center gap-2">
            <PortalIcon size={18} />
            {portalLabel}
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Chiudi">
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <Link
            href="/admin-pynkstudio"
            className="pynk-admin-nav-link"
          >
            <ArrowLeft size={18} />
            Hub
          </Link>
          <div className="my-2 border-t border-white/10" />
          {navItems.map((it) => {
            const active = !it.external && isPynkNavActive(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                target={it.external ? "_blank" : undefined}
                className="pynk-admin-nav-link"
                data-active={active}
              >
                <it.icon size={18} />
                {it.label}
                {it.external && <span className="pynk-admin-nav-tag">↗</span>}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="pynk-admin-logout">
          <LogOut size={18} /> Esci
        </button>
      </aside>

      {open && (
        <div
          className="pynk-admin-backdrop fixed inset-0 z-20 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="lg:pl-64">
        <header className="pynk-admin-topbar sticky top-0 z-10 flex items-center justify-between px-5 py-3 lg:hidden">
          <button
            className="pynk-admin-topbar-button"
            onClick={() => setOpen(true)}
            aria-label="Apri menu"
          >
            <MenuIcon size={20} />
          </button>
          <span className="pynk-admin-topbar-title">{portalLabel}</span>
          <div className="w-10" />
        </header>

        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
