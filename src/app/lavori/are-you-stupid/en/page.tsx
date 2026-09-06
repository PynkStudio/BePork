import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAreYouStupidEnPage } from "@/components/tenants/pynkstudio/pages/are-you-stupid-en";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";
import { PYNK_ORIGIN } from "@/components/tenants/pynkstudio/ai-governance-data";

const base = pynkMetadata({
  title: "Are You Stupid? — hyper-casual mobile game | PYNK STUDIO",
  description:
    "Are You Stupid? is the hyper-casual iOS & Android game by PYNK STUDIO: instructions under 8 words, zero downtime, fully offline. Case study, privacy policy and support.",
  path: "/lavori/are-you-stupid/en",
});

export const metadata = {
  ...base,
  alternates: {
    ...base.alternates,
    languages: {
      ...base.alternates?.languages,
      "it-IT": `${PYNK_ORIGIN}/it/lavori/are-you-stupid`,
      "x-default": `${PYNK_ORIGIN}/it/lavori/are-you-stupid`,
      en: `${PYNK_ORIGIN}/it/lavori/are-you-stupid/en`,
    },
  },
};

export default async function AreYouStupidEnRoute() {
  await requirePynkstudioTenant();
  return <PynkAreYouStupidEnPage />;
}
