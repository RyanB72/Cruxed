import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <Card className="max-w-sm w-full text-center">
        <h1 className="text-display font-heading text-stone-50 mb-2">404</h1>
        <p className="text-stone-400 mb-4">Page not found</p>
        <a
          href="/"
          className="text-terracotta hover:text-terracotta-light transition-colors font-heading text-sm uppercase tracking-wide"
        >
          Go home
        </a>
      </Card>
    </main>
  );
}
