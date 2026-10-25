import { cn } from "@/lib/utils";

export function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-ink/[0.07]", className)} />;
}

export function HomeSkeleton() {
  return (
    <div className="container-site space-y-8 py-24">
      <Bone className="h-10 w-1/3" />
      <Bone className="h-28 w-2/3" />
      <div className="grid gap-6 md:grid-cols-3">
        <Bone className="h-80" />
        <Bone className="h-80" />
        <Bone className="h-80" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-site space-y-6 py-20">
      <Bone className="h-8 w-48" />
      <Bone className="h-5 w-full max-w-2xl" />
      <Bone className="h-5 w-full max-w-xl" />
      <div className="grid gap-6 pt-6 md:grid-cols-3">
        <Bone className="h-64" />
        <Bone className="h-64" />
        <Bone className="h-64" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="bg-ink pb-20 pt-[calc(var(--header-h)+6rem)]">
      <div className="container-site space-y-6">
        <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
        <div className="h-20 w-2/3 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-white/10" />
      </div>
    </section>
  );
}
