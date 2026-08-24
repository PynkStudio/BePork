"use client";

import { usePathname } from "next/navigation";
import {
  BadgeEuro,
  Bot,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  LifeBuoy,
  Mail,
  MessageCircle,
  Music,
  Palette,
  Package,
  ServerCrash,
  Settings,
  Shield,
  UserCog,
  Users,
  UtensilsCrossed,
  Briefcase,
} from "lucide-react";
import { PynkAdminShell } from "./pynk-admin-shell";
import { PynkPortalShell, type PortalNavItem } from "./pynk-portal-shell";

const AUTH_PATHS = ["/admin-pynkstudio/login", "/admin-pynkstudio/set-password"];

const MENUARY_NAV: PortalNavItem[] = [
  { href: "/admin-pynkstudio/menuary/inbox",         label: "Posta in arrivo",    icon: Mail },
  { href: "/admin-pynkstudio/menuary/messaggi-wa",   label: "Messaggi WA",       icon: MessageCircle },
  { href: "/admin-pynkstudio/menuary/supporto",      label: "Supporto",          icon: LifeBuoy },
  { href: "/admin-pynkstudio/menuary/errori",        label: "Errori operativi",  icon: ServerCrash },
  { href: "/admin-pynkstudio/menuary/crm",           label: "CRM Lead",          icon: Users },
  { href: "/admin-pynkstudio/menuary/pacchetti",     label: "Pacchetti",         icon: Package },
  { href: "/admin-pynkstudio/menuary/assistente-ai", label: "Assistente AI",     icon: Bot },
  { href: "/admin-pynkstudio/menuary/abbonamenti",   label: "Abbonamenti",       icon: CreditCard },
  { href: "/admin-pynkstudio/menuary/contratti",     label: "Contratti",         icon: FileText },
  { href: "/admin-pynkstudio/menuary/template-design", label: "Template designer", icon: Palette },
  { href: "/admin-pynkstudio/menuary/provvigioni",   label: "Provvigioni",       icon: BadgeEuro },
  { href: "/admin-pynkstudio/menuary/tenant",        label: "Tenant & Moduli",   icon: Building2 },
  { href: "/admin-pynkstudio/menuary/utenti",        label: "Utenti interni",    icon: UserCog },
];

const BIZERY_NAV: PortalNavItem[] = [
  { href: "/admin-pynkstudio/bizery/crm",          label: "CRM Lead",          icon: Users },
  { href: "/admin-pynkstudio/bizery/tenant",       label: "Tenant & Moduli",   icon: Building2 },
  { href: "/admin-pynkstudio/bizery/abbonamenti",  label: "Abbonamenti",       icon: CreditCard },
  { href: "/admin-pynkstudio/bizery/contratti",    label: "Contratti",         icon: FileText },
  { href: "/admin-pynkstudio/bizery/supporto",     label: "Supporto",          icon: LifeBuoy },
];

const ORPHEO_NAV: PortalNavItem[] = [
  { href: "/admin-pynkstudio/orpheo/crm",          label: "CRM Lead",          icon: Users },
  { href: "/admin-pynkstudio/orpheo/tenant",       label: "Tenant & Moduli",   icon: Building2 },
  { href: "/admin-pynkstudio/orpheo/abbonamenti",  label: "Abbonamenti",       icon: CreditCard },
  { href: "/admin-pynkstudio/orpheo/contratti",    label: "Contratti",         icon: FileText },
  { href: "/admin-pynkstudio/orpheo/supporto",     label: "Supporto",          icon: LifeBuoy },
];

const SECURITY_NAV: PortalNavItem[] = [
  { href: "/admin-pynkstudio/security/tenants",  label: "Organizzazioni",  icon: Building2 },
  { href: "/admin-pynkstudio/security/users",    label: "Utenti",          icon: Users },
  { href: "/admin-pynkstudio/security/audit",    label: "Audit logs",      icon: ClipboardList },
  { href: "/admin-pynkstudio/security/config",   label: "Configurazione",  icon: Settings },
];

function resolvePortalNav(pathname: string): { label: string; icon: React.ElementType; nav: PortalNavItem[] } | null {
  if (pathname.startsWith("/admin-pynkstudio/menuary"))  return { label: "Menuary",  icon: UtensilsCrossed, nav: MENUARY_NAV };
  if (pathname.startsWith("/admin-pynkstudio/bizery"))   return { label: "Bizery",   icon: Briefcase,       nav: BIZERY_NAV };
  if (pathname.startsWith("/admin-pynkstudio/orpheo"))   return { label: "Orpheo",   icon: Music,           nav: ORPHEO_NAV };
  if (pathname.startsWith("/admin-pynkstudio/security")) return { label: "Security",  icon: Shield,          nav: SECURITY_NAV };
  return null;
}

export function PynkAdminLayoutSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));
  if (isAuthPage) return <>{children}</>;

  const portal = resolvePortalNav(pathname ?? "");
  if (portal) {
    return (
      <PynkPortalShell
        portalLabel={portal.label}
        portalIcon={portal.icon}
        navItems={portal.nav}
      >
        {children}
      </PynkPortalShell>
    );
  }

  return <PynkAdminShell>{children}</PynkAdminShell>;
}
