let depth = 0;
let savedScrollY = 0;

/** Blocco scroll ref-counted (iOS: evita scroll della pagina sotto overlay/drawer). */
export function bodyScrollLock(): void {
  if (depth === 0) {
    savedScrollY = window.scrollY;
    const { body, documentElement: html } = document;
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
  }
  depth += 1;
}

export function bodyScrollUnlock(): void {
  if (depth === 0) return;
  depth -= 1;
  if (depth > 0) return;
  const { body, documentElement: html } = document;
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.overflow = "";
  html.style.overflow = "";
  window.scrollTo(0, savedScrollY);
}
