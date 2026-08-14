"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

export function ValentinaContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus("sending");
    setError(null);
    const res = await fetch("/api/tenant/valentina-orciuoli/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        subject: formData.get("subject"),
        message: formData.get("message"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Non sono riuscito a inviare il messaggio.");
      return;
    }
    form.reset();
    setStatus("sent");
  }

  return (
    <form className="vo-contact-form" onSubmit={handleSubmit}>
      <label>
        Nome
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Oggetto
        <input name="subject" />
      </label>
      <label>
        Messaggio
        <textarea name="message" required rows={6} />
      </label>
      <button type="submit" disabled={status === "sending"}>
        <Send size={16} /> {status === "sending" ? "Invio..." : "Invia messaggio"}
      </button>
      {status === "sent" && <small>Messaggio inviato. Ti risponderemo via email.</small>}
      {status === "error" && <small>{error}</small>}
    </form>
  );
}
