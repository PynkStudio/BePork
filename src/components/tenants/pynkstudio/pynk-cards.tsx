"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Gamepad2, Globe, Layers, Monitor, Smartphone, Wrench } from "lucide-react";
import type { PynkPortfolioItem, PynkPortfolioKind } from "./portfolio";
import { usePynkNerd } from "./pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";

// Le voci con href esterno aprono in una nuova scheda; quelle con path interno
// (scheda progetto senza sito pubblico ancora online) restano nell'app via next/link.
const MotionLink = motion(Link);

export function PynkStackChips({ items, className = "" }: { items: readonly string[]; className?: string }) {
  return (
    <div className={`pynk-stack-chips ${className}`}>
      {items.map((tech) => (
        <span key={tech} className="pynk-chip">
          {tech}
        </span>
      ))}
    </div>
  );
}

const kindIcon = (k: PynkPortfolioKind) => {
  switch (k) {
    case "platform":
      return Layers;
    case "web":
      return Globe;
    case "game":
      return Gamepad2;
    case "tool":
      return Wrench;
    case "mobile":
      return Smartphone;
    case "desktop":
      return Monitor;
  }
};

export function PynkPortfolioCard({ item, index = 0 }: { item: PynkPortfolioItem; index?: number }) {
  const { nerd } = usePynkNerd();
  const copy = usePynkCopy();
  const KindIcon = kindIcon(item.kind);
  const isInternal = item.href?.startsWith("/") ?? false;
  const cta = isInternal
    ? copy.portfolioLabels.viewProject
    : item.href?.includes("testflight.apple.com")
      ? copy.portfolioLabels.testflight
      : copy.portfolioLabels.openSite;

  const content = (
    <>
      <div className="pynk-card-head">
        <div className="pynk-card-icon">
          {item.cardImage ? (
            <Image src={item.cardImage} alt="" width={44} height={44} className="pynk-card-icon-img" />
          ) : (
            <KindIcon className="pynk-icon-sm" />
          )}
        </div>
        <span className="pynk-card-kind">{copy.portfolioLabels[item.kind]}</span>
      </div>
      <h3 className="pynk-card-title">{item.title}</h3>
      <p className="pynk-card-desc">{nerd ? item.descriptionNerd : item.descriptionPlain}</p>
      {nerd && <PynkStackChips items={item.stack} className="pynk-mt-12" />}
    </>
  );

  const motionProps = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] as const },
    whileHover: { y: -4 },
  };

  if (item.href && isInternal) {
    return (
      <MotionLink href={item.href} {...motionProps} className="pynk-card pynk-card-link">
        {content}
        <span className="pynk-card-cta">
          {cta}
          <ArrowRight className="pynk-icon-xs" />
        </span>
      </MotionLink>
    );
  }

  if (item.href) {
    return (
      <motion.a href={item.href} target="_blank" rel="noopener noreferrer" {...motionProps} className="pynk-card pynk-card-link">
        {content}
        <span className="pynk-card-cta">
          {cta}
          <ExternalLink className="pynk-icon-xs" />
        </span>
      </motion.a>
    );
  }

  return (
    <motion.div {...motionProps} className="pynk-card">
      {content}
      <p className="pynk-card-note">{item.statusNote ?? copy.portfolioLabels.noLink}</p>
    </motion.div>
  );
}
