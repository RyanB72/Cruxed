"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

interface Participant {
  id: string;
  displayName: string;
}

interface Climb {
  id: string;
  name: string;
  climbNumber: number;
  sortOrder: number;
  pointConfig: {
    flash: number;
    attempts: Record<string, number>;
    maxAttempts: number;
    minPoints: number;
  };
}

interface Score {
  id: string;
  participantId: string;
  climbId: string;
  attempts: number;
  topped: boolean;
  points: number;
}

interface ClimbRow {
  climb: Climb;
  attempts: number;
  topped: boolean;
  dirty: boolean;
  saving: boolean;
}

export default function ScoresPage() {
  const { compId } = useParams<{ compId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [rows, setRows] = useState<ClimbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState("");

  // Load participants and climbs
  useEffect(() => {
    async function load() {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch(`/api/comps/${compId}/participants`),
          fetch(`/api/comps/${compId}/climbs`),
        ]);
        if (pRes.ok) {
          const pData = await pRes.json();
          setParticipants(pData);
        }
        if (cRes.ok) {
          const cData = await cRes.json();
          setClimbs(cData);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [compId]);

  // Auto-select participant from query param
  useEffect(() => {
    const pid = searchParams.get("participant");
    if (pid && participants.some((p) => p.id === pid)) {
      setSelectedParticipant(pid);
    }
  }, [searchParams, participants]);

  // Load scores when participant changes
  const loadScores = useCallback(async () => {
    if (!selectedParticipant) {
      setScores([]);
      setRows([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/comps/${compId}/scores?participantId=${selectedParticipant}`
      );
      if (res.ok) {
        const data: Score[] = await res.json();
        setScores(data);
      }
    } catch {
      // silent
    }
  }, [compId, selectedParticipant]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  // Build rows when climbs or scores change
  useEffect(() => {
    if (!selectedParticipant || climbs.length === 0) {
      setRows([]);
      return;
    }
    const scoreMap = new Map<string, Score>();
    for (const s of scores) {
      scoreMap.set(s.climbId, s);
    }

    setRows(
      climbs.map((climb) => {
        const existing = scoreMap.get(climb.id);
        return {
          climb,
          attempts: existing?.attempts ?? 1,
          topped: existing?.topped ?? false,
          dirty: false,
          saving: false,
        };
      })
    );
  }, [climbs, scores, selectedParticipant]);

  function updateRow(climbId: string, updates: Partial<ClimbRow>) {
    setRows((prev) =>
      prev.map((r) =>
        r.climb.id === climbId ? { ...r, ...updates, dirty: true } : r
      )
    );
  }

  async function saveRow(climbId: string) {
    const row = rows.find((r) => r.climb.id === climbId);
    if (!row) return;

    setRows((prev) =>
      prev.map((r) =>
        r.climb.id === climbId ? { ...r, saving: true } : r
      )
    );
    setError("");

    try {
      const res = await fetch(`/api/comps/${compId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: selectedParticipant,
          climbId,
          attempts: row.attempts,
          topped: row.topped,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save score");
      } else {
        const saved: Score = await res.json();
        setScores((prev) => {
          const idx = prev.findIndex((s) => s.climbId === climbId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [...prev, saved];
        });
        setRows((prev) =>
          prev.map((r) =>
            r.climb.id === climbId ? { ...r, dirty: false, saving: false } : r
          )
        );
        return;
      }
    } catch {
      setError("Network error");
    }

    setRows((prev) =>
      prev.map((r) =>
        r.climb.id === climbId ? { ...r, saving: false } : r
      )
    );
  }

  async function saveAll() {
    const dirtyRows = rows.filter((r) => r.dirty);
    if (dirtyRows.length === 0) return;
    setSavingAll(true);
    setError("");

    for (const row of dirtyRows) {
      await saveRow(row.climb.id);
    }

    setSavingAll(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const dirtyCount = rows.filter((r) => r.dirty).length;

  return (
    <div>
      <button
        onClick={() => router.push(`/admin/comp/${compId}`)}
        className="text-sm text-stone-500 hover:text-stone-300 transition-colors mb-6 flex items-center gap-1"
      >
        <span>&larr;</span> Back to overview
      </button>

      <h1 className="text-h1 font-heading font-bold text-stone-50 mb-8">
        Score Override
      </h1>

      {/* Participant selector */}
      <Card className="mb-6">
        <label className="text-sm font-medium text-stone-400 font-heading uppercase tracking-wide block mb-2">
          Select Participant
        </label>
        <select
          value={selectedParticipant}
          onChange={(e) => setSelectedParticipant(e.target.value)}
          className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:ring-1 focus:border-terracotta focus:ring-terracotta"
        >
          <option value="">-- Select a participant --</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName}
            </option>
          ))}
        </select>
      </Card>

      {error && (
        <p className="text-sm text-error mb-4">{error}</p>
      )}

      {/* Climb score rows */}
      {selectedParticipant && rows.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-400">
              {rows.length} climb{rows.length !== 1 ? "s" : ""}
            </p>
            {dirtyCount > 0 && (
              <Button size="sm" loading={savingAll} onClick={saveAll}>
                Save All ({dirtyCount})
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {rows.map((row) => {
              const existingScore = scores.find(
                (s) => s.climbId === row.climb.id
              );
              return (
                <Card
                  key={row.climb.id}
                  className={
                    row.dirty ? "border-terracotta/50" : ""
                  }
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Climb info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading font-semibold text-stone-50 truncate">
                          {row.climb.name}
                        </h3>
                        {row.climb.climbNumber && (
                          <Badge variant="terracotta">#{row.climb.climbNumber}</Badge>
                        )}
                      </div>
                      {existingScore && (
                        <p className="text-xs text-stone-500">
                          Current: {existingScore.points} pts
                          {existingScore.topped ? " (topped)" : " (not topped)"}
                          , {existingScore.attempts} att
                        </p>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-stone-500 font-heading uppercase tracking-wide">
                          Attempts
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={row.attempts}
                          onChange={(e) =>
                            updateRow(row.climb.id, {
                              attempts: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-20 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-center focus:outline-none focus:ring-1 focus:border-terracotta focus:ring-terracotta"
                        />
                      </div>

                      <div className="flex flex-col gap-1 items-center">
                        <label className="text-xs text-stone-500 font-heading uppercase tracking-wide">
                          Topped
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            updateRow(row.climb.id, { topped: !row.topped })
                          }
                          className={`w-12 h-8 rounded-full transition-colors ${
                            row.topped
                              ? "bg-sage"
                              : "bg-stone-700"
                          }`}
                        >
                          <span
                            className={`block w-6 h-6 bg-stone-50 rounded-full transition-transform mx-auto ${
                              row.topped
                                ? "translate-x-2"
                                : "-translate-x-2"
                            }`}
                          />
                        </button>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        loading={row.saving}
                        disabled={!row.dirty}
                        onClick={() => saveRow(row.climb.id)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {selectedParticipant && climbs.length === 0 && (
        <Card className="text-center py-16">
          <p className="text-stone-400">No climbs in this competition yet</p>
        </Card>
      )}

      {!selectedParticipant && (
        <Card className="text-center py-16">
          <p className="text-stone-400">
            Select a participant above to edit their scores
          </p>
        </Card>
      )}
    </div>
  );
}
