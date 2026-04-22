"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_SESSION_KEY } from "@/lib/admin-auth";

function readSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (readSession()) {
      setOk(true);
    } else {
      router.replace("/admin/login");
    }
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
