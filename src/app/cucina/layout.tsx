import type { Metadata } from "next";
import { AuthGate } from "@/components/admin/auth-gate";

export const metadata: Metadata = {
  title: "Schermo cucina",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
