import type { ReactNode } from "react";

export function LegalPage({ title, kicker, lastUpdated, children }: {
  title: string;
  kicker?: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {kicker && <p className="text-xs font-semibold uppercase tracking-wider text-primary">{kicker}</p>}
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      {lastUpdated && <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>}
      <div className="prose-autofie mt-8 space-y-5 text-[15px] leading-relaxed text-foreground/90">
        {children}
      </div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="space-y-2 text-foreground/85">{children}</div>
    </section>
  );
}
