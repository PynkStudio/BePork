import { useCartFlyStore } from "@/store/cart-fly-store";

export function spawnCartFly(
  from: DOMRectReadOnly | null | undefined,
  imageSrc?: string | null,
) {
  if (!from) return;
  useCartFlyStore.getState().spawnFromRect(from, imageSrc);
}
