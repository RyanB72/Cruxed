"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a competition code");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/comps/lookup?code=${trimmed}`);
      if (!res.ok) {
        setError("Competition not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      router.push(`/comp/${data.id}`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-display font-heading tracking-tight">
            CRUXED
          </h1>
          <div className="w-12 h-1 bg-terracotta rounded-full mx-auto mt-3" />
          <p className="text-stone-400 mt-4">
            Enter your competition code
          </p>
        </div>

        <Card className="w-full">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="ABC123"
              maxLength={6}
              error={error}
              className="text-center text-2xl font-heading tracking-[0.3em] uppercase"
              autoComplete="off"
            />
            <Button type="submit" size="lg" loading={loading} className="w-full">
              Enter
            </Button>
          </form>
        </Card>

        <a
          href="/login"
          className="text-sm text-stone-500 hover:text-stone-400 transition-colors font-heading uppercase tracking-wide"
        >
          Admin Login
        </a>
      </div>
    </main>
  );
}
