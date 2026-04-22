import { siteConfig } from "@/lib/site-config";

export function MenuCopertoNote() {
  return (
    <p className="text-center text-sm font-semibold tracking-wide text-pork-ink/75">
      {siteConfig.disclaimers.coperto}
      <span className="font-normal text-pork-ink/50"> · in sala</span>
    </p>
  );
}
