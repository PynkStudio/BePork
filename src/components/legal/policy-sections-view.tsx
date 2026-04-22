import type { PolicySection } from "@/lib/legal/policies";

export function PolicySectionsView({ sections }: { sections: PolicySection[] }) {
  return (
    <div className="space-y-10">
      {sections.map((sec) => (
        <article
          key={sec.id}
          id={sec.id}
          className="scroll-mt-28 border-b border-pork-ink/10 pb-10 last:border-0 last:pb-0"
        >
          <h2 className="impact-title text-2xl text-pork-ink">{sec.title}</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-pork-ink/85">
            {sec.body.map((p, i) => (
              <p key={`${sec.id}-p-${i}`}>{p}</p>
            ))}
          </div>
          {sec.bullets && sec.bullets.length > 0 ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-pork-ink/85">
              {sec.bullets.map((b, i) => (
                <li key={`${sec.id}-b-${i}`}>{b}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}
