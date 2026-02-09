"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

interface Category {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  displayName: string;
  categoryId: string;
  category: { id: string; name: string };
  createdAt: string;
  _count: { scores: number };
  totalPoints?: number;
}

export default function ParticipantsPage() {
  const { compId } = useParams<{ compId: string }>();
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [res, scoresRes, catsRes] = await Promise.all([
          fetch(`/api/comps/${compId}/participants`),
          fetch(`/api/comps/${compId}/scores`),
          fetch(`/api/comps/${compId}/categories`),
        ]);

        if (!res.ok) throw new Error();
        const data: Participant[] = await res.json();

        if (scoresRes.ok) {
          const scores: { participantId: string; points: number }[] =
            await scoresRes.json();
          const pointsByParticipant = new Map<string, number>();
          for (const s of scores) {
            pointsByParticipant.set(
              s.participantId,
              (pointsByParticipant.get(s.participantId) ?? 0) + s.points
            );
          }
          for (const p of data) {
            p.totalPoints = pointsByParticipant.get(p.id) ?? 0;
          }
        }

        setParticipants(data);

        if (catsRes.ok) {
          setCategories(await catsRes.json());
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [compId]);

  async function handleRemove(participantId: string, name: string) {
    if (!confirm(`Remove "${name}" and all their scores? This cannot be undone.`)) {
      return;
    }
    setRemoving(participantId);
    try {
      const res = await fetch(
        `/api/comps/${compId}/participants/${participantId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      }
    } catch { /* silent */ }
    finally { setRemoving(null); }
  }

  async function handleReassign(participantId: string, categoryId: string) {
    setReassigning(participantId);
    try {
      const res = await fetch(
        `/api/comps/${compId}/participants/${participantId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === participantId
              ? { ...p, categoryId: updated.categoryId, category: updated.category }
              : p
          )
        );
      }
    } catch { /* silent */ }
    finally { setReassigning(null); }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push(`/admin/comp/${compId}`)}
        className="text-sm text-stone-500 hover:text-stone-300 transition-colors mb-6 flex items-center gap-1"
      >
        <span>&larr;</span> Back to overview
      </button>

      <h1 className="text-h1 font-heading font-bold text-stone-50 mb-8">
        Participants
      </h1>

      {participants.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-stone-400">No participants yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {participants.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-stone-50 truncate">
                    {p.displayName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="neutral">{p.category.name}</Badge>
                    <span className="text-xs text-stone-500">
                      {p._count.scores} scores &middot; {(p.totalPoints ?? 0).toLocaleString()} pts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Category reassign */}
                  <select
                    value={p.categoryId}
                    onChange={(e) => handleReassign(p.id, e.target.value)}
                    disabled={reassigning === p.id}
                    className="bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-sm text-stone-300 focus:outline-none focus:border-terracotta"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/admin/comp/${compId}/scores?participant=${p.id}`
                      )
                    }
                  >
                    Scores
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={removing === p.id}
                    onClick={() => handleRemove(p.id, p.displayName)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
