import type { Metadata } from "next";
import { PlatformPackagesPage } from "@/components/admin/platform/platform-packages-page";

export const metadata: Metadata = {
  title: "Pacchetti · Menuary",
};

export const dynamic = "force-dynamic";

export default function MenuaryPackagesPage() {
  return <PlatformPackagesPage vertical="food" productLabel="Menuary" />;
}
