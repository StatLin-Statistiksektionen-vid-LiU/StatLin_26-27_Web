import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { FloatingLogo } from "@/components/brand/floating-logo";
import { ArrowLeft } from "@/components/icons";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Logga in",
  robots: { index: false },
};

export default function LoginPage(props: PageProps<"/logga-in">) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="noise relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col">
        <div className="grid-paper pointer-events-none absolute inset-0 text-white [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
        <div className="relative flex flex-1 items-center justify-center p-16">
          <FloatingLogo className="w-[min(30vw,460px)]" intro={false} />
        </div>
        <div className="relative p-10">
          <p className="display-tight max-w-md text-3xl">
            För sektionens <span className="mono-accent text-red">poster</span>
          </p>
          <p className="mt-3 max-w-md text-white/55">Lägg upp evenemang, nyheter och bilder för ditt utskott – direkt på sajten.</p>
        </div>
      </section>

      <section className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="kicker inline-flex items-center gap-2 self-start text-stone hover:text-ink">
          <ArrowLeft size={14} /> Till startsidan
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/statlin.svg" alt="" className="mb-8 size-16 lg:hidden" />
          <p className="kicker text-red-deep">StatLin · Poster</p>
          <h1 className="display mt-3 text-[2.6rem]">Logga in</h1>
          <p className="mt-3 text-stone">Använd e-postadressen för din post. Saknar du konto? Fråga sektionens webbansvariga.</p>
          <Suspense fallback={null}>
            <LoginGate searchParams={props.searchParams} />
          </Suspense>
          {/* Formuläret ligger i det statiska skalet så att det syns och fungerar direkt, även utan JavaScript. */}
          <LoginForm>
            <Suspense fallback={null}>
              <NextField searchParams={props.searchParams} />
            </Suspense>
          </LoginForm>
        </div>
        <p className="text-center text-xs text-stone">Glömt lösenordet? En administratör kan återställa det åt dig.</p>
      </section>
    </main>
  );
}

/** Redan inloggad → vidare till adminpanelen. Visar också "Du är utloggad". */
async function LoginGate({ searchParams }: { searchParams: PageProps<"/logga-in">["searchParams"] }) {
  const [user, sp] = await Promise.all([getSessionUser(), searchParams]);
  if (user) redirect("/admin");
  if (!sp.utloggad) return null;
  return <p className="mt-6 rounded-xl bg-emerald-600/[0.08] px-4 py-3 text-sm font-medium text-emerald-900">Du är utloggad.</p>;
}

/** Sidan man skickades från, så att man hamnar rätt efter inloggningen. */
async function NextField({ searchParams }: { searchParams: PageProps<"/logga-in">["searchParams"] }) {
  const { next } = await searchParams;
  return typeof next === "string" ? <input type="hidden" name="next" value={next} /> : null;
}
