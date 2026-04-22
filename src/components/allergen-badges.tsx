import type { MenuAllergen } from "@/lib/types";
import { allergenMeta, sortAllergens } from "@/lib/allergens";
import { cn } from "@/lib/utils";

export function AllergenBadges({
  allergens,
  className,
  compact,
}: {
  allergens: MenuAllergen[] | undefined;
  className?: string;
  /** Testo più piccolo nelle liste compatte. */
  compact?: boolean;
}) {
  if (!allergens?.length) return null;
  const sorted = sortAllergens(allergens);
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1", className)}
      role="list"
      aria-label="Allergeni"
    >
      {sorted.map((key) => {
        const meta = allergenMeta(key);
        if (!meta) return null;
        return (
          <span
            key={key}
            role="listitem"
            title={meta.label}
            className={cn(
              "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-pork-ink/8 px-1.5 font-black text-pork-ink ring-1 ring-pork-ink/15",
              compact ? "text-[9px]" : "text-[10px]",
            )}
          >
            {meta.annexNumber}
          </span>
        );
      })}
    </div>
  );
}
