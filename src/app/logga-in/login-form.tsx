"use client";

import { startTransition, useActionState, useState } from "react";
import { login } from "@/app/admin/_actions/auth";
import { Eye } from "@/components/icons";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, {});
  const [show, setShow] = useState(false);
  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(e) => {
        // Skicka utan React-formuläråterställning så att e-postadressen står kvar vid fel lösenord.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p role="alert" className="rounded-xl border border-red/30 bg-red/[0.06] px-4 py-3 text-sm font-semibold text-red-dark">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
          E-post
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          placeholder="info@statlin.se"
          className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none transition focus:border-ink focus:ring-4 focus:ring-ink/[0.06]"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
          Lösenord
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 pr-12 outline-none transition focus:border-ink focus:ring-4 focus:ring-ink/[0.06]"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-stone hover:bg-paper hover:text-ink"
            aria-label={show ? "Dölj lösenord" : "Visa lösenord"}
          >
            <Eye size={18} />
          </button>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-red w-full disabled:opacity-70">
        {pending ? "Loggar in…" : "Logga in"}
      </button>
    </form>
  );
}
