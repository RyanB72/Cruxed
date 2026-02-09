"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AdminShell({ email }: { email: string }) {
  return (
    <header className="border-b border-stone-800 bg-stone-900/60 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/admin/dashboard"
          className="font-heading text-xl font-bold tracking-widest text-stone-50 hover:text-terracotta transition-colors"
        >
          CRUXED
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-sm text-stone-400 truncate max-w-48">
            {email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
