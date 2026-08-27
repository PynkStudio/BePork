import type { TenantVertical } from "@/lib/tenant";
import { VERTICAL_REGISTRY } from "@/lib/vertical";
import type { InboundEmailBrand } from "@/lib/email/inbound-types";

/**
 * Sotto-pannelli prodotto di admin.pynkstudio.eu.
 *
 * Ogni portale vede solo i dati del proprio prodotto: il collegamento con i dati
 * è il verticale (`platform_leads.business_vertical`, `TenantProfile.vertical`)
 * più il brand, usato da contratti e posta. L'hub PynkStudio resta la sola vista
 * aggregata.
 */
export type ProductPortalSlug = "menuary" | "bizery" | "orpheo";

export type ProductPortal = {
  slug: ProductPortalSlug;
  vertical: TenantVertical;
  /** Brand usato da contratti (`platform_contracts.brand`) e posta. */
  brand: InboundEmailBrand;
  label: string;
  tagline: string;
  basePath: string;
  /**
   * Moduli oggi esistenti solo per il food. Finché non hanno un equivalente
   * negli altri prodotti restano fuori dai rispettivi portali invece di
   * comparire come sezioni vuote.
   */
  hasWhatsappSupport: boolean;
  hasAiPhone: boolean;
  hasTemplateDesigner: boolean;
};

export const PRODUCT_PORTALS: Record<ProductPortalSlug, ProductPortal> = {
  menuary: {
    slug: "menuary",
    vertical: "food",
    brand: "menuary",
    label: VERTICAL_REGISTRY.food.productName,
    tagline: "Piattaforma food: ristoranti, bar, pizzerie",
    basePath: "/admin-pynkstudio/menuary",
    hasWhatsappSupport: true,
    hasAiPhone: true,
    hasTemplateDesigner: true,
  },
  bizery: {
    slug: "bizery",
    vertical: "services",
    brand: "bizery",
    label: VERTICAL_REGISTRY.services.productName,
    tagline: "Piattaforma services: officine, studi, saloni",
    basePath: "/admin-pynkstudio/bizery",
    hasWhatsappSupport: false,
    hasAiPhone: false,
    hasTemplateDesigner: false,
  },
  orpheo: {
    slug: "orpheo",
    vertical: "creative",
    brand: "orpheo",
    label: VERTICAL_REGISTRY.creative.productName,
    tagline: "Piattaforma creative: artisti, autori, registi",
    basePath: "/admin-pynkstudio/orpheo",
    hasWhatsappSupport: false,
    hasAiPhone: false,
    hasTemplateDesigner: false,
  },
};

export const PRODUCT_PORTAL_LIST: ProductPortal[] = [
  PRODUCT_PORTALS.menuary,
  PRODUCT_PORTALS.bizery,
  PRODUCT_PORTALS.orpheo,
];

export function portalForVertical(vertical: TenantVertical): ProductPortal {
  return PRODUCT_PORTAL_LIST.find((p) => p.vertical === vertical) ?? PRODUCT_PORTALS.menuary;
}
