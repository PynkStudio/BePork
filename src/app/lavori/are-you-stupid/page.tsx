import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAreYouStupidPage } from "@/components/tenants/pynkstudio/pages/are-you-stupid";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "Are You Stupid? — gioco mobile hyper-casual | PYNK STUDIO",
  description:
    "Are You Stupid? è l'hyper-casual per iOS e Android firmato PYNK STUDIO: istruzioni sotto le 8 parole, zero tempi morti, completamente offline. Scheda progetto, privacy policy e supporto.",
  path: "/lavori/are-you-stupid",
});

export default async function AreYouStupidRoute() {
  await requirePynkstudioTenant();
  return <PynkAreYouStupidPage />;
}
