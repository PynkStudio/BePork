import type { Metadata } from "next";
import { PlatformAdminUsersPage } from "@/components/admin/platform/platform-admin-users-page";

export const metadata: Metadata = {
  title: "Utenti interni · PynkStudio Admin",
};

export const dynamic = "force-dynamic";

export default function PynkAdminUsersPage() {
  return <PlatformAdminUsersPage />;
}
