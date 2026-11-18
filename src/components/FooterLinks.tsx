import { Link } from "@tanstack/react-router";

export function FooterLinks() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-6">
      <nav aria-label="Help and policies" className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        <Link to="/faq" className="hover:text-foreground">FAQ</Link>
        <span aria-hidden="true">·</span>
        <Link to="/contact" className="hover:text-foreground">Contact</Link>
        <span aria-hidden="true">·</span>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
      </nav>
    </footer>
  );
}