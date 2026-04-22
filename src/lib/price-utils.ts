import type { PriceFormat } from "./menu-data";

export type PriceVariant = {
  key: string;
  label?: string;
  price: number;
};

export function priceVariants(price: PriceFormat): PriceVariant[] {
  switch (price.kind) {
    case "single":
      return [{ key: "default", price: price.value }];
    case "sized":
      return [
        { key: "small", label: "Small", price: price.small },
        { key: "big", label: "Big", price: price.big },
      ];
    case "persone":
      return [
        { key: "per2", label: "2 persone", price: price.per2 },
        { key: "per4", label: "4 persone", price: price.per4 },
      ];
    case "volume":
      return [
        { key: "small", label: price.small.label, price: price.small.price },
        { key: "large", label: price.large.label, price: price.large.price },
      ];
  }
}

export function formatEuro(n: number): string {
  return `€ ${n.toFixed(2).replace(".", ",")}`;
}

export function minPrice(price: PriceFormat): number {
  const variants = priceVariants(price);
  return Math.min(...variants.map((v) => v.price));
}

export function hasMultipleVariants(price: PriceFormat): boolean {
  return priceVariants(price).length > 1;
}
