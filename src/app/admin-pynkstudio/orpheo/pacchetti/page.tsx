import type { Metadata } from "next";
import { PlatformPackagesPage } from "@/components/admin/platform/platform-packages-page";

export const metadata: Metadata = {
  title: "Pacchetti · Orpheo",
};

export const dynamic = "force-dynamic";

export default function OrpheoPackagesPage() {
  return <PlatformPackagesPage vertical="creative" productLabel="Orpheo" />;
}
