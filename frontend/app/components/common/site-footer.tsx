import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="theme-surface theme-border border-t panel-elevated">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-3 md:px-10">
        <div>
          <p className="theme-text text-lg font-black">Learn Computers</p>
          <p className="theme-muted mt-2 text-sm leading-relaxed">
            The smarter way for students to learn, practice, and improve consistently.
          </p>
        </div>

        <div>
          <p className="theme-muted text-sm font-bold uppercase tracking-[0.12em]">Navigate</p>
          <div className="mt-3 flex flex-col gap-2 text-sm font-semibold">
            <Link href="/" className="nav-link">About</Link>
            <Link href="/signup" className="nav-link">Sign Up</Link>
            <Link href="/login" className="nav-link">Login</Link>
            <Link href="/#contact" className="nav-link">Contact</Link>
            <Link href="/privacy-policy" className="nav-link">Privacy Policy</Link>
          </div>
        </div>

        <div>
          <p className="theme-muted text-sm font-bold uppercase tracking-[0.12em]">Social</p>
          <div className="mt-3 flex gap-3 text-sm font-semibold">
            <a href="#" className="nav-link" aria-label="X">
              X
            </a>
            <a href="#" className="nav-link" aria-label="LinkedIn">
              LinkedIn
            </a>
            <a href="#" className="nav-link" aria-label="YouTube">
              YouTube
            </a>
          </div>
        </div>
      </div>

      <div className="theme-border theme-muted border-t py-4 text-center text-sm">
        Copyright {new Date().getFullYear()} Learn Computers. All rights reserved.
      </div>
    </footer>
  );
}
