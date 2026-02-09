"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  getDeviceId,
  getCompSession,
  setCompSession,
  type CompSession,
} from "@/lib/participant-session";

interface Climb {
  id: string;
  name: string;
  climbNumber: number;
  sortOrder: number;
  pointConfig: unknown;
}

interface Score {
  climbId: string;
  points: number;
  attempts: number;
  topped: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function CompPage() {
  const { compId } = useParams<{ compId: string }>();
  const router = useRouter();
  const [compName, setCompName] = useState("");
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [session, setSession] = useState<CompSession | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showExisting, setShowExisting] = useState(false);
  const [existingName, setExistingName] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const loadAll = useCallback(async (participantId?: string) => {
    try {
      const pid = participantId || session?.participantId;
      const url = pid
        ? `/api/comps/${compId}/public?participantId=${pid}`
        : `/api/comps/${compId}/public`;
      const res = await fetch(url);
      if (!res.ok) {
        setError("Failed to load competition");
        return;
      }
      const data = await res.json();
      setCompName(data.name);
      setClimbs(data.climbs);
      setCategories(data.categories);
      setScores(data.scores || []);
      if (data.categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data.categories[0].id);
      }
    } catch {
      setError("Failed to load competition");
    } finally {
      setLoading(false);
    }
  }, [compId, session?.participantId, selectedCategoryId]);

  useEffect(() => {
    const existing = getCompSession(compId);
    if (existing) {
      setSession(existing);
      loadAll(existing.participantId);
    } else {
      loadAll();
    }
  }, [compId]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!selectedCategoryId) {
      setError("Select a category");
      return;
    }
    setJoining(true);
    setError("");

    try {
      const deviceId = getDeviceId();
      const res = await fetch(`/api/comps/${compId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name.trim(),
          deviceId,
          categoryId: selectedCategoryId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to join");
        setJoining(false);
        return;
      }

      const participant = await res.json();
      const sessionData: CompSession = {
        participantId: participant.id,
        displayName: participant.displayName,
        categoryId: participant.category.id,
        categoryName: participant.category.name,
      };
      setCompSession(compId, sessionData);
      setSession(sessionData);
      loadAll(participant.id);
    } catch {
      setError("Something went wrong");
    } finally {
      setJoining(false);
    }
  }

  async function handleExistingLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!existingName.trim()) return;
    setLookingUp(true);
    setError("");

    try {
      const res = await fetch(
        `/api/comps/${compId}/participants/lookup?name=${encodeURIComponent(existingName.trim())}`
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "User not found");
        setLookingUp(false);
        return;
      }

      const participant = await res.json();
      const sessionData: CompSession = {
        participantId: participant.id,
        displayName: participant.displayName,
        categoryId: participant.categoryId,
        categoryName: participant.categoryName,
      };
      setCompSession(compId, sessionData);
      setSession(sessionData);
      loadAll(participant.id);
    } catch {
      setError("Something went wrong");
    } finally {
      setLookingUp(false);
    }
  }

  function getScoreForClimb(climbId: string) {
    return scores.find((s) => s.climbId === climbId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Spinner size="lg" />
      </div>
    );
  }

  // Join form if no session
  if (!session) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <div className="text-center">
            <h1 className="text-h1 font-heading">{compName}</h1>
            <p className="text-stone-400 mt-2">Enter your name to compete</p>
          </div>
          {showExisting ? (
            <Card className="w-full">
              <form onSubmit={handleExistingLookup} className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  value={existingName}
                  onChange={(e) => { setExistingName(e.target.value); setError(""); }}
                  placeholder="Your registered name"
                  required
                />
                {error && <p className="text-sm text-error">{error}</p>}
                <Button type="submit" size="lg" loading={lookingUp} className="w-full">
                  Find Me
                </Button>
              </form>
              <button
                onClick={() => { setShowExisting(false); setError(""); }}
                className="w-full text-sm text-stone-500 hover:text-stone-400 transition-colors mt-4 font-heading uppercase tracking-wide"
              >
                New Climber
              </button>
            </Card>
          ) : (
            <Card className="w-full">
              <form onSubmit={handleJoin} className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />

                {/* Category picker */}
                <div>
                  <p className="text-sm text-stone-400 font-heading uppercase tracking-wide mb-2">
                    Category
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setSelectedCategoryId(cat.id); setError(""); }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-heading font-semibold transition-all ${
                          selectedCategoryId === cat.id
                            ? "bg-terracotta text-white"
                            : "bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-error">{error}</p>}
                <Button type="submit" size="lg" loading={joining} className="w-full">
                  Join Competition
                </Button>
              </form>
              <button
                onClick={() => { setShowExisting(true); setError(""); }}
                className="w-full text-sm text-stone-500 hover:text-stone-400 transition-colors mt-4 font-heading uppercase tracking-wide"
              >
                Existing Climber
              </button>
            </Card>
          )}
        </div>
      </main>
    );
  }

  // Main comp view - climb list
  const totalPoints = scores
    .filter((s) => s.topped)
    .reduce((sum, s) => sum + s.points, 0);

  return (
    <main className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading">{compName}</h1>
          <p className="text-sm text-stone-400">
            {session.displayName} &middot; {session.categoryName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-heading font-bold text-terracotta">{totalPoints}</p>
          <p className="text-xs text-stone-500 uppercase tracking-wide">Points</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-6">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => router.push(`/comp/${compId}/leaderboard`)}>
          Leaderboard
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search by climb number or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Climb list */}
      <div className="flex flex-col gap-3">
        {climbs
          .filter((climb) => {
            if (!search.trim()) return true;
            const q = search.trim().toLowerCase();
            return (
              String(climb.climbNumber) === q ||
              String(climb.climbNumber).startsWith(q) ||
              climb.name.toLowerCase().includes(q)
            );
          })
          .map((climb) => {
          const score = getScoreForClimb(climb.id);
          return (
            <Card
              key={climb.id}
              className="cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => router.push(`/comp/${compId}/climb/${climb.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center shrink-0">
                    <span className="font-heading font-bold text-terracotta">{climb.climbNumber}</span>
                  </div>
                  <p className="font-heading font-semibold text-stone-50">{climb.name}</p>
                </div>
                <div className="text-right">
                  {score?.topped ? (
                    <>
                      <p className="text-lg font-heading font-bold text-sage">{score.points}</p>
                      <p className="text-xs text-stone-500">{score.attempts} att</p>
                    </>
                  ) : (
                    <p className="text-sm text-stone-600">Not sent</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {climbs.length === 0 && (
        <Card className="text-center">
          <p className="text-stone-500">No climbs added yet</p>
        </Card>
      )}
    </main>
  );
}
