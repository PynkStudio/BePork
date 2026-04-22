import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center bg-pork-cream px-5 py-32 text-center">
      <span className="impact-title text-xl text-pork-red">Errore 404</span>
      <h1 className="headline mt-3 text-6xl sm:text-7xl lg:text-8xl text-balance">
        Qui non c&apos;è nulla
        <br />
        <span className="text-pork-red">da mangiare.</span>
      </h1>
      <p className="mt-6 max-w-md text-pork-ink/70">
        La pagina che cerchi non esiste. Forse è il caso di tornare al menu.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Torna alla home
      </Link>
    </section>
  );
}
