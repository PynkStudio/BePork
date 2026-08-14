"use client";

/* eslint-disable @next/next/no-img-element */

/**
 * La quarta di copertina. Sta sul fondo del volume, girata di 180°: si vede solo
 * quando il libro si chiude e si rigira, ed è il posto che nell'editoria vera
 * ospita ritratto e biografia dell'autrice.
 */
export function VoBackCover({ hidden }: { hidden: boolean }) {
  return (
    <div className="vo-back-board" aria-hidden={hidden || undefined} inert={hidden || undefined}>
      <div className="vo-back-face">
        <div className="vo-back-frame" aria-hidden="true" />

        <figure className="vo-back-portrait">
          <img src="/valentina-orciuoli/valentina-autrice.webp" alt="Valentina Orciuoli" />
        </figure>

        <div className="vo-back-copy">
          <span className="vo-back-kicker">L&apos;autrice</span>
          <h2>Valentina Orciuoli</h2>
          <p className="vo-back-blurb">
            «Scrivo storie in cui l&apos;emozione non resta sottotraccia: diventa creatura,
            scelta, ferita e potere.»
          </p>
          <p>
            Dopo la laurea in Relazioni Internazionali e gli studi in Comunicazione e
            Marketing, Valentina porta nella scrittura uno sguardo attento ai legami, ai
            conflitti interiori e alla forza simbolica delle storie. Il suo immaginario parte
            dal fantasy orientale — draghi, corti imperiali, magia — e incontra il romance.
          </p>
          <p>
            Con <em>Tra fumo e ombre</em> apre anche una venatura dark-noir, più urbana e
            psicologica.
          </p>
        </div>

        <div className="vo-back-foot">
          <span className="vo-back-mark">龍</span>
          <span className="vo-back-barcode" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
