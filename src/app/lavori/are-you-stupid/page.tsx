import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAreYouStupidPage } from "@/components/tenants/pynkstudio/pages/are-you-stupid";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";
import { PYNK_ORIGIN } from "@/components/tenants/pynkstudio/ai-governance-data";

const base = pynkMetadata({
  title: "Are You Stupid? — gioco mobile hyper-casual | PYNK STUDIO",
  description:
    "Are You Stupid? è l'hyper-casual per iOS e Android firmato PYNK STUDIO: istruzioni sotto le 8 parole, zero tempi morti, completamente offline. Scheda progetto, privacy policy e supporto.",
  path: "/lavori/are-you-stupid",
});

// Stessa pagina, due lingue: qui l'italiana. L'inglese vive su /en (sibling
// route), l'unica scelta praticabile finché pynkstudio non ha un vero /en
// per l'intero sito — vedi are-you-stupid-en.tsx.
export const metadata = {
  ...base,
  alternates: {
    ...base.alternates,
    languages: {
      ...base.alternates?.languages,
      en: `${PYNK_ORIGIN}/it/lavori/are-you-stupid/en`,
    },
  },
};

export default async function AreYouStupidRoute() {
  await requirePynkstudioTenant();
  return <PynkAreYouStupidPage />;
}
