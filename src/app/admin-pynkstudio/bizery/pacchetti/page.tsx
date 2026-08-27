import type { Metadata } from "next";
import { PlatformPackagesPage } from "@/components/admin/platform/platform-packages-page";

export const metadata: Metadata = {
  title: "Pacchetti · Bizery",
};

export const dynamic = "force-dynamic";

export default function BizeryPackagesPage() {
  return <PlatformPackagesPage vertical="services" productLabel="Bizery" />;
}
