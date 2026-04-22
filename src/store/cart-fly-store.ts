"use client";

import { create } from "zustand";

export type CartFlyParticle = {
  id: string;
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  image?: string;
};

type CartFlyState = {
  particles: CartFlyParticle[];
  spawnFromRect: (rect: DOMRectReadOnly, imageSrc?: string | null) => void;
  dismiss: (id: string) => void;
};

function fabTargetRect(): DOMRect {
  const el = document.querySelector("[data-cart-fab-target]");
  if (el) return el.getBoundingClientRect();
  const w = window.innerWidth;
  const sm =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(min-width: 640px)").matches;
  const top = sm ? 96 + 36 : 80 + 36;
  const left = w - (sm ? 132 : 112);
  return DOMRect.fromRect({ x: left, y: top, width: 48, height: 48 });
}

export const useCartFlyStore = create<CartFlyState>((set, get) => ({
  particles: [],

  spawnFromRect(from, imageSrc) {
    if (typeof window === "undefined") return;
    const half = 22;
    const cx0 = from.left + from.width / 2 - half;
    const cy0 = from.top + from.height / 2 - half;
    const id = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const kick = () => {
      const r1 = fabTargetRect();
      const cx = from.left + from.width / 2;
      const cy = from.top + from.height / 2;
      const dx = r1.left + r1.width / 2 - cx;
      const dy = r1.top + r1.height / 2 - cy;
      set((s) => ({
        particles: [
          ...s.particles,
          {
            id,
            x0: cx0,
            y0: cy0,
            dx,
            dy,
            image: imageSrc || undefined,
          },
        ],
      }));
      window.setTimeout(() => get().dismiss(id), 720);
    };

    requestAnimationFrame(() => requestAnimationFrame(kick));
  },

  dismiss(id) {
    set((s) => ({ particles: s.particles.filter((p) => p.id !== id) }));
  },
}));
