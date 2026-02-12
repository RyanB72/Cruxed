"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface ActiveComp {
  id: string;
  name: string;
  _count: { participants: number };
}

export default function Home() {
  const [comps, setComps] = useState<ActiveComp[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/comps/active")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComps(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center animate-fade-in-up">
          <h1 className="text-display font-heading tracking-tight">
            CRUXED
          </h1>
          <div className="w-12 h-1 bg-terracotta rounded-full mx-auto mt-3" />
          <p className="text-stone-400 mt-4">
            Choose your competition
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : comps.length === 0 ? (
          <Card className="w-full text-center animate-fade-in-up stagger-1">
            <p className="text-stone-500">No active competitions right now</p>
          </Card>
        ) : (
          <div className="w-full flex flex-col gap-3">
            {comps.map((comp, i) => (
              <Card
                key={comp.id}
                className={`cursor-pointer active:scale-[0.99] transition-transform animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}
                onClick={() => router.push(`/comp/${comp.id}`)}
              >
                <div className="flex items-center justify-between">
                  <p className="font-heading font-semibold text-stone-50">{comp.name}</p>
                  <span className="text-sm text-stone-500">{comp._count.participants} climber{comp._count.participants !== 1 ? "s" : ""}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        <a
          href="/login"
          className="text-sm text-stone-500 hover:text-stone-400 transition-colors font-heading uppercase tracking-wide animate-fade-in-up stagger-2"
        >
          Admin Login
        </a>
      </div>
    </main>
  );
}
