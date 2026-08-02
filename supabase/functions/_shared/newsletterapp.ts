// @ts-nocheck — file Deno: il `tsconfig.json` di root include `**/*.ts` e
// finirebbe per tipizzare specifier `npm:`/URL raw e il global `Deno` con le
// regole di Next.js. Stessa convenzione già in uso nel vecchio
// `process-tenant-newsletter/index.ts`. Verificato invece con `deno check`.
/**
 * Punto unico di ancoraggio a `@pynkstudio/newsletterapp` per le edge function.
 *
 * Deno risolve gli specifier alla lettera, quindi non può usare `dist/`
 * (scritto con estensioni `.js` per Node ESM): il package pubblica un albero
 * gemello `deno/` con estensioni `.ts`, importato via URL.
 *
 * **Il tag è pinnato qui e solo qui.** L'edge function si deploya
 * separatamente dall'app Next: puntare a `main` cambierebbe il comportamento
 * senza un deploy. La versione npm in `package.json` (route Next.js e console
 * gestione) deve restare allineata a questa.
 */

export * from "https://raw.githubusercontent.com/PynkStudio/pynkstudio-newsletterapp/v0.2.0/deno/core/index.ts";
export * from "https://raw.githubusercontent.com/PynkStudio/pynkstudio-newsletterapp/v0.2.0/deno/server/index.ts";

export const NEWSLETTERAPP_VERSION = "v0.2.0";
