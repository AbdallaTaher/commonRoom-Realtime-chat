import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { appConfig } from "@/data/app-config";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function AuthFrame({ eyebrow, title, description, children, centered = false }: {
  eyebrow: string; title: string; description: string; children: React.ReactNode; centered?: boolean;
}) {
  return (
    <main className={`auth-wallpaper ${centered ? "auth-wallpaper-centered" : ""}`}>
      <div className="auth-wall" aria-hidden="true" />
      <div className="auth-theme-switcher"><ThemeSwitcher /></div>
      <div className={centered ? "auth-center" : "auth-split"}>
        {!centered && (
          <section className="auth-intro" aria-label="About Commonroom">
            <Link href="/" className="auth-brand auth-brand-large">
              <span className="auth-brand-mark auth-brand-mark-light"><MessagesSquare aria-hidden="true" /></span>
              <span>{appConfig.name.toLowerCase()}</span>
            </Link>
            <p className="auth-kicker">A little closer, every day</p>
            <h1>Good conversations<br />make a good day.</h1>
            <p className="auth-intro-copy">Your people, your groups, and the moments in between—all in one calm place.</p>
            <div className="auth-people" aria-label="A quieter kind of connected">
              <span className="auth-avatar-stack" aria-hidden="true"><i>A</i><i>S</i><i>J</i></span>
              <span>A quieter kind of connected.</span>
            </div>
          </section>
        )}
        <section className="auth-card" aria-labelledby="auth-title">
          {centered ? (
            <>
              <Link href="/auth/login" className="auth-back-link">Back to sign in</Link>
              <Link href="/" className="auth-brand auth-brand-card">
                <span className="auth-brand-mark"><MessagesSquare aria-hidden="true" /></span>
                <span>{appConfig.name.toLowerCase()}</span>
              </Link>
            </>
          ) : (
            <Link href="/" className="auth-brand auth-brand-mobile">
              <span className="auth-brand-mark"><MessagesSquare aria-hidden="true" /></span>
              <span>{appConfig.name.toLowerCase()}</span>
            </Link>
          )}
          <p className="auth-eyebrow">{eyebrow}</p>
          <h2 id="auth-title">{title}</h2>
          <p className="auth-description">{description}</p>
          <div className="auth-form-slot">{children}</div>
        </section>
      </div>
    </main>
  );
}
