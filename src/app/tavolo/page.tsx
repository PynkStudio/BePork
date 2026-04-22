"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Users, KeyRound } from "lucide-react";
import { InteractiveMenu } from "@/components/interactive-menu";
import { useCartStore } from "@/store/cart-store";
import {
  useMenuStore,
  selectActiveSession,
  selectSessionByCode,
} from "@/store/menu-store";
import { useHydrated } from "@/components/providers";
import { getClientId } from "@/lib/client-id";
import type { TableSession, Table } from "@/lib/types";

function TavoloBody() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const router = useRouter();
  const tParam = params.get("t");
  const codeParam = params.get("code");

  const tables = useMenuStore((s) => s.tables);
  const sessions = useMenuStore((s) => s.sessions);
  const openSession = useMenuStore((s) => s.openSession);
  const addDiner = useMenuStore((s) => s.addDiner);
  const updateDinerNickname = useMenuStore((s) => s.updateDinerNickname);
  const clearCart = useCartStore((s) => s.clear);
  const cartContext = useCartStore((s) => s.context);
  const setContext = useCartStore((s) => s.setContext);

  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");

  const resolvedTable: Table | undefined = useMemo(() => {
    if (!tParam) return undefined;
    return tables.find((t) => t.id === tParam);
  }, [tables, tParam]);

  const activeSession: TableSession | undefined = useMemo(() => {
    if (codeParam) {
      return selectSessionByCode(sessions, codeParam);
    }
    if (resolvedTable) {
      return selectActiveSession(sessions, resolvedTable.id);
    }
    return undefined;
  }, [codeParam, resolvedTable, sessions]);

  const sessionTable: Table | undefined = useMemo(() => {
    if (resolvedTable) return resolvedTable;
    if (activeSession) return tables.find((t) => t.id === activeSession.tableId);
    return undefined;
  }, [activeSession, resolvedTable, tables]);

  useEffect(() => {
    if (!hydrated) return;
    if (!resolvedTable && !activeSession) return;
    if (resolvedTable && !activeSession) {
      openSession(resolvedTable.id);
    }
  }, [hydrated, resolvedTable, activeSession, openSession]);

  useEffect(() => {
    if (!hydrated || !activeSession || !sessionTable) return;

    const clientId = getClientId();
    const existing = activeSession.diners.find((d) => d.clientId === clientId);
    const currentNick = existing?.nickname ?? "";

    if (
      cartContext.sessionId !== activeSession.id ||
      cartContext.clientId !== clientId
    ) {
      if (cartContext.sessionId && cartContext.sessionId !== activeSession.id) {
        clearCart();
      }
      setContext({
        type: "tavolo",
        tableId: sessionTable.id,
        tableLabel: sessionTable.label,
        sessionId: activeSession.id,
        sessionCode: activeSession.code,
        clientId,
        nickname: currentNick || undefined,
      });
    } else if ((cartContext.nickname ?? "") !== currentNick) {
      setContext({
        ...cartContext,
        nickname: currentNick || undefined,
      });
    }
  }, [
    hydrated,
    activeSession,
    sessionTable,
    cartContext,
    setContext,
    clearCart,
  ]);

  if (!hydrated) return null;

  if (codeParam && !activeSession) {
    return (
      <EmptyCentered>
        <p className="impact-title text-pork-red">Codice non valido.</p>
        <p className="mt-2 text-pork-ink/60">
          La sessione con codice <strong>{codeParam}</strong> non &egrave; pi&ugrave;
          attiva o non esiste.
        </p>
        <Link href="/tavolo" className="btn-primary mt-6 inline-flex">
          Inserisci un altro codice
        </Link>
      </EmptyCentered>
    );
  }

  if (!resolvedTable && !activeSession) {
    return (
      <EmptyCentered>
        <p className="impact-title text-pork-red">Benvenuto.</p>
        <h1 className="headline mt-2 text-4xl">Unisciti al tuo tavolo.</h1>
        <p className="mt-2 text-pork-ink/60">
          Scansiona il QR code sul tavolo oppure inserisci qui il codice a 4 cifre
          condiviso da chi &egrave; arrivato prima.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const c = joinCode.replace(/\D/g, "");
            if (c.length < 3) return;
            router.replace(`/tavolo?code=${c}`);
          }}
          className="mx-auto mt-6 flex max-w-xs gap-2"
        >
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="1234"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ""))}
            className="flex-1 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-3 text-center font-impact text-2xl tracking-[0.3em] outline-none focus:border-pork-red"
          />
          <button type="submit" className="btn-primary text-sm">
            <KeyRound size={16} /> Entra
          </button>
        </form>
        <Link
          href="/menu"
          className="mt-6 inline-block text-sm text-pork-ink/60 underline"
        >
          Oppure sfoglia solo il menu →
        </Link>
      </EmptyCentered>
    );
  }

  if (!activeSession || !sessionTable) return null;

  const needsNickname =
    !cartContext.nickname && cartContext.sessionId === activeSession.id;

  return (
    <>
      {needsNickname && (
        <NicknameGate
          initialSuggestion={`Commensale ${activeSession.diners.length + 1}`}
          onSubmit={(nick) => {
            const clientId = getClientId();
            const alreadyIn = activeSession.diners.some(
              (d) => d.clientId === clientId,
            );
            if (alreadyIn) {
              updateDinerNickname(activeSession.id, clientId, nick);
            } else {
              addDiner(activeSession.id, clientId, nick);
            }
            setContext({
              ...cartContext,
              nickname: nick,
            });
            setNickname(nick);
          }}
        />
      )}

      <SessionBadge session={activeSession} table={sessionTable} nickname={nickname || cartContext.nickname} />

      <InteractiveMenu />
    </>
  );
}

function SessionBadge({
  session,
  table,
  nickname,
}: {
  session: TableSession;
  table: Table;
  nickname?: string;
}) {
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/tavolo?code=${session.code}`;
    return `${window.location.origin}/tavolo?code=${session.code}`;
  }, [session.code]);

  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      navigator
        .share({
          title: `Be Pork · ${table.label}`,
          text: `Unisciti al mio tavolo Be Pork con il codice ${session.code}`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      handleCopy();
    }
  }

  return (
    <section className="bg-pork-ink pt-28 pb-10 text-pork-cream md:pt-36">
      <div className="container-wide">
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip-mustard">{table.label}</span>
          <span className="chip bg-pork-cream/10 text-pork-cream/70">
            Ordine al tavolo · nessun cameriere
          </span>
          {nickname && (
            <span className="chip bg-pork-red text-white">
              <Users size={12} className="mr-1 inline" /> {nickname}
            </span>
          )}
        </div>
        <h1 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
          Benvenuto al{" "}
          <span className="text-pork-mustard">{table.label.toLowerCase()}</span>.
        </h1>

        <div className="mt-6 grid gap-4 rounded-2xl bg-pork-cream/5 p-4 ring-1 ring-pork-cream/10 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-pork-mustard">
              Codice del tuo tavolo
            </p>
            <p className="font-impact text-5xl tracking-[0.35em] text-pork-mustard">
              {session.code}
            </p>
          </div>
          <p className="text-sm text-pork-cream/80">
            Condividi il codice con gli altri commensali: ognuno ordina dal
            proprio telefono e tutto finisce in un unico conto.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded-full bg-pork-mustard px-4 py-2 text-sm font-bold text-pork-ink hover:bg-pork-mustard-soft"
            >
              <Copy size={14} />
              {copied ? "Copiato!" : "Condividi"}
            </button>
          </div>
        </div>

        {session.diners.length > 1 && (
          <p className="mt-3 text-xs text-pork-cream/60">
            Al tavolo:{" "}
            {session.diners.map((d, i) => (
              <span key={d.clientId}>
                {i > 0 && " · "}
                {d.nickname}
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}

function NicknameGate({
  initialSuggestion,
  onSubmit,
}: {
  initialSuggestion: string;
  onSubmit: (nick: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-pork-ink/90 p-5">
      <div className="w-full max-w-md rounded-3xl bg-pork-cream p-6 shadow-2xl">
        <p className="impact-title text-xs text-pork-red">Chi sei?</p>
        <h2 className="headline text-3xl">Come ti chiamiamo?</h2>
        <p className="mt-1 text-sm text-pork-ink/60">
          Serve solo a distinguere i tuoi ordini da quelli degli altri commensali
          al tuo tavolo. Niente di pi&ugrave;.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = value.trim() || initialSuggestion;
            onSubmit(v);
          }}
          className="mt-4 space-y-3"
        >
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={initialSuggestion}
            maxLength={24}
            autoFocus
            className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-4 py-3 text-lg outline-none focus:border-pork-red"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSubmit(initialSuggestion)}
              className="btn-ghost flex-1 text-sm"
            >
              Salta
            </button>
            <button type="submit" className="btn-primary flex-1 text-sm">
              Iniziamo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyCentered({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-wide py-32 text-center">
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  );
}

export default function TavoloPage() {
  return (
    <Suspense fallback={null}>
      <TavoloBody />
    </Suspense>
  );
}
