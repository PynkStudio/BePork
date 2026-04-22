import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AuthGate } from "@/components/admin/auth-gate";
import { AdminLayoutSwitch } from "@/components/admin/admin-layout-switch";

export const metadata: Metadata = {
  title: "Gestione",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutSwitch
      loginSlot={children}
      protectedSlot={
        <AuthGate>
          <AdminShell>{children}</AdminShell>
        </AuthGate>
      }
    />
  );
}
