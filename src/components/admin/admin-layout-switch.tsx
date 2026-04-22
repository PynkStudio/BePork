"use client";

import { usePathname } from "next/navigation";

export function AdminLayoutSwitch({
  loginSlot,
  protectedSlot,
}: {
  loginSlot: React.ReactNode;
  protectedSlot: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin/login")) return <>{loginSlot}</>;
  return <>{protectedSlot}</>;
}
