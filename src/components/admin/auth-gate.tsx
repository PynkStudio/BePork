"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_SESSION_KEY, readAdminSession } from "@/lib/admin-auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (readAdminSession()) {
      setOk(true);
    } else {
      const next = encodeURIComponent(pathname || "/admin");
      router.replace(`/admin/login?next=${next}`);
    }
  }, [router, pathname]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== ADMIN_SESSION_KEY) return;
      const valid = e.newValue === "1";
      setOk(valid);
      if (!valid && pathname && !pathname.startsWith("/admin/login")) {
        const next = encodeURIComponent(pathname);
        router.replace(`/admin/login?next=${next}`);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router, pathname]);

  if (!ok) return null;
  return <>{children}</>;
}
