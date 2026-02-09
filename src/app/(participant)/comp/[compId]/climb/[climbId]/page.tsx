"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { getDeviceId, getCompSession } from "@/lib/participant-session";

interface Climb {
  id: string;
  name: string;
  climbNumber: number;
  pointConfig: {
    flash: number;
    attempts: Record<string, number>;
    maxAttempts: number;
    minPoints: number;
  };
}

export default function ClimbPage() {
  const { compId, climbId } = useParams<{ compId: string; climbId: string }>();
  const router = useRouter();
  const [climb, setClimb] = useState<Climb | null>(null);
  const [attempts, setAttempts] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingScore, setExistingScore] = useState<{ attempts: number; topped: boolean } | null>(null);

  const session = getCompSession(compId);

  useEffect(() => {
    loadClimb();
    loadExistingScore();
  }, [compId, climbId]);

  async function loadClimb() {
    try {
      const res = await fetch(`/api/comps/${compId}/climbs`);
      if (res.ok) {
        const climbs = await res.json();
        const found = climbs.find((c: Climb) => c.id === climbId);
        if (found) setClimb(found);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function loadExistingScore() {
    if (!session) return;
    try {
      const res = await fetch(
        `/api/comps/${compId}/scores?participantId=${session.participantId}`
      );
      if (res.ok) {
        const scores = await res.json();
        const existing = scores.find((s: { climbId: string }) => s.climbId === climbId);
        if (existing) {
          setExistingScore(existing);
          setAttempts(existing.attempts);
        }
      }
    } catch { /* ignore */ }
  }

  async function handleSave() {
    if (!session || !climb) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/comps/${compId}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": getDeviceId(),
        },
        body: JSON.stringify({
          participantId: session.participantId,
          climbId,
          attempts,
          topped: true,
        }),
      });

      if (res.ok) {
        router.push(`/comp/${compId}`);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!session) return;
    setSaving(true);

    try {
      await fetch(`/api/comps/${compId}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": getDeviceId(),
        },
        body: JSON.stringify({
          participantId: session.participantId,
          climbId,
          attempts: 1,
          topped: false,
        }),
      });
      router.push(`/comp/${compId}`);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  function getPreviewPoints(): number {
    if (!climb) return 0;
    const config = climb.pointConfig;
    if (attempts === 1) return config.flash;
    const key = String(attempts);
    if (key in config.attempts) return config.attempts[key];
    if (attempts > config.maxAttempts) return config.minPoints;
    return config.minPoints;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!climb) {
    return (
      <main className="px-4 py-6 max-w-lg mx-auto text-center">
        <p className="text-stone-500">Climb not found</p>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 max-w-lg mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push(`/comp/${compId}`)}
        className="text-sm text-stone-500 hover:text-stone-300 mb-4 font-heading uppercase tracking-wide"
      >
        &larr; Back
      </button>

      {/* Climb info */}
      <div className="mb-6">
        <Badge variant="terracotta" className="mb-2">#{climb.climbNumber}</Badge>
        <h1 className="text-h1 font-heading">{climb.name}</h1>
      </div>

      {/* Attempt counter */}
      <Card className="mb-6">
        <p className="text-sm text-stone-400 font-heading uppercase tracking-wide mb-3">
          Attempts
        </p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setAttempts(Math.max(1, attempts - 1))}
            className="w-14 h-14 rounded-xl bg-stone-800 border border-stone-700 text-2xl font-heading text-stone-200 active:bg-stone-700 transition-colors"
          >
            -
          </button>
          <span className="text-4xl font-heading font-bold text-stone-50 w-16 text-center">
            {attempts}
          </span>
          <button
            onClick={() => setAttempts(attempts + 1)}
            className="w-14 h-14 rounded-xl bg-stone-800 border border-stone-700 text-2xl font-heading text-stone-200 active:bg-stone-700 transition-colors"
          >
            +
          </button>
        </div>
      </Card>

      {/* Points preview */}
      <div className="text-center mb-6">
        <p className="text-sm text-stone-500 uppercase tracking-wide">Points</p>
        <p className="text-4xl font-heading font-bold text-terracotta">
          {getPreviewPoints()}
        </p>
      </div>

      {/* Log button */}
      <Button
        size="lg"
        className="w-full mb-3"
        onClick={handleSave}
        loading={saving}
      >
        {existingScore ? "Update Score" : "Log Score"}
      </Button>

      {existingScore && (
        <Button
          size="md"
          variant="danger"
          className="w-full"
          onClick={handleDelete}
        >
          Remove Score
        </Button>
      )}
    </main>
  );
}
