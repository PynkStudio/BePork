import type { Metadata } from "next";
import { TemplateDesignerPage } from "@/components/admin/platform/template-designer-page";

export const metadata: Metadata = {
  title: "Template designer · Menuary",
};

export default function MenuaryTemplateDesignPage() {
  return <TemplateDesignerPage />;
}
