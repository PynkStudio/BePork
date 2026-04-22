import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const routes = ["", "/menu", "/chi-siamo", "/galleria", "/recensioni", "/contatti"];
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/menu" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
