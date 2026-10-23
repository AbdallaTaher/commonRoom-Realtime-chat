import Link from "next/link";
import {
  ArrowRight,
  MessageCircleHeart,
  MessagesSquare,
  Play,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { appConfig } from "@/data/app-config";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

const highlights = [
  {
    icon: MessageCircleHeart,
    title: "One-to-one, just for you",
    detail: "Make space for the everyday conversations that matter.",
  },
  {
    icon: UsersRound,
    title: "Your groups, together",
    detail: "Keep your favorite people close in a shared room.",
  },
  {
    icon: Sparkles,
    title: "A little more present",
    detail: "See who is around and pick up right where you left off.",
  },
];

export function HomePage() {
  return (
    <main className="app-wallpaper flex min-h-svh flex-col px-4 py-5 sm:px-8 sm:py-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Commonroom home">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <MessagesSquare aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight sm:text-xl">
            {appConfig.name}
          </span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Account">
          <ThemeSwitcher />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href={appConfig.routes.signIn}>Sign in</Link>
          </Button>
          <Button asChild>
            <Link href={appConfig.routes.signUp}>
              Get started <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/75 px-3.5 py-2 text-xs font-bold uppercase tracking-[.16em] text-primary shadow-sm backdrop-blur">
            <span className="size-2 rounded-full bg-emerald-500" />
            A little closer, every day
          </p>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
            Good conversations
            <span className="block text-primary">make a good day.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {appConfig.tagline} Your people, your groups, and the moments in
            between—all in one calm place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-xl px-6">
              <Link href="/demo">
                <Play aria-hidden="true" /> Try the interactive demo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl bg-card/80 px-6">
              <Link href={appConfig.routes.signUp}>
                Create your account <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl bg-card/80 px-6">
              <Link href={appConfig.routes.signIn}>I already have an account</Link>
            </Button>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-4 text-emerald-600 dark:text-emerald-400" />
            Private conversations, shared only with your people.
          </p>
        </div>

        <section
          aria-label="Commonroom highlights"
          className="glass-panel relative mx-auto w-full max-w-xl rounded-[2rem] p-5 sm:p-7"
        >
          <div className="absolute -right-3 -top-3 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 sm:-right-4 sm:-top-4 sm:size-14">
            <Sparkles aria-hidden="true" className="size-6" />
          </div>
          <div className="mb-5 flex items-center justify-between border-b border-border/80 pb-4 pr-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">
                Your space
              </p>
              <h2 className="mt-1 text-lg font-bold">A home for your conversations</h2>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <MessagesSquare aria-hidden="true" className="size-5" />
            </span>
          </div>
          <ul className="space-y-2">
            {highlights.map(({ icon: Icon, title, detail }) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl p-3 transition-colors hover:bg-accent/60 sm:p-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary/[.08] p-4">
            <div className="flex -space-x-3" aria-hidden="true">
              {["A", "S", "J"].map((initial, index) => (
                <span
                  key={initial}
                  className="grid size-9 place-items-center rounded-full border-2 border-card bg-accent text-xs font-bold text-accent-foreground"
                  style={{ zIndex: 3 - index }}
                >
                  {initial}
                </span>
              ))}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              <strong className="text-foreground">Made for your circle.</strong>{" "}
              A calm space to stay in touch.
            </p>
          </div>
        </section>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-border/70 pt-5 text-xs text-muted-foreground">
        <span>© {appConfig.name}</span>
        <span className="hidden items-center gap-2 sm:inline-flex">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Your conversations stay yours
        </span>
      </footer>
    </main>
  );
}
