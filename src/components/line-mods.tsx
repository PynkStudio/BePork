import { formatEuro } from "@/lib/price-utils";

type Extra = { id: string; name: string; price: number };

type Props = {
  removed?: string[];
  extras?: Extra[];
  note?: string;
  tone?: "dark" | "light";
  withPrices?: boolean;
};

export function LineMods({
  removed,
  extras,
  note,
  tone = "dark",
  withPrices = false,
}: Props) {
  const hasRemoved = (removed?.length ?? 0) > 0;
  const hasExtras = (extras?.length ?? 0) > 0;
  const hasNote = !!note;
  if (!hasRemoved && !hasExtras && !hasNote) return null;

  const muted = tone === "light" ? "text-pork-cream/60" : "text-pork-ink/60";
  const removedColor =
    tone === "light" ? "text-pork-mustard" : "text-pork-red";
  const extrasColor =
    tone === "light" ? "text-pork-cream" : "text-pork-green";

  return (
    <div className="mt-1 space-y-0.5 text-[11px] leading-tight">
      {hasRemoved && (
        <p className={`${removedColor} font-semibold`}>
          – senza {removed!.join(", ")}
        </p>
      )}
      {hasExtras && (
        <ul className={`${extrasColor}`}>
          {extras!.map((x) => (
            <li key={x.id}>
              + {x.name}
              {withPrices && (
                <span className={`ml-1 ${muted}`}>
                  ({formatEuro(x.price)})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {hasNote && (
        <p className={`italic ${muted}`}>&ldquo;{note}&rdquo;</p>
      )}
    </div>
  );
}
