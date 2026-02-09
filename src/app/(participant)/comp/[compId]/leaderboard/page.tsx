"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getCompSession } from "@/lib/participant-session";

interface LeaderboardEntry {
  rank: number;
  participantId: string;
  displayName: string;
  totalPoints: number;
  climbsTopped: number;
  totalAttempts: number;
}

interface Category {
  id: string;
  name: string;
}

export default function LeaderboardPage() {
  const { compId } = useParams<{ compId: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const session = getCompSession(compId);

  useEffect(() => {
    fetch(`/api/comps/${compId}/categories`)
      .then((r) => r.json())
      .then((cats) => {
        setCategories(cats);
        // Default to participant's own category
        const defaultCat = session?.categoryId || (cats.length > 0 ? cats[0].id : null);
        setSelectedCategoryId(defaultCat);
      })
      .catch(() => {});
  }, [compId]);

  const loadLeaderboard = useCallback(async () => {
    if (!selectedCategoryId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/comps/${compId}/leaderboard?categoryId=${selectedCategoryId}`
      );
      if (res.ok) {
        setEntries(await res.json());
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [compId, selectedCategoryId]);

  useEffect(() => {
    if (selectedCategoryId) {
      loadLeaderboard();
    }
  }, [selectedCategoryId, loadLeaderboard]);

  return (
    <main className="px-4 py-6 max-w-lg mx-auto">
      <button
        onClick={() => router.push(`/comp/${compId}`)}
        className="text-sm text-stone-500 hover:text-stone-300 mb-4 font-heading uppercase tracking-wide"
      >
        &larr; Back
      </button>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-h1 font-heading">Leaderboard</h1>
        <Button size="sm" variant="secondary" onClick={loadLeaderboard} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-heading font-semibold whitespace-nowrap transition-all shrink-0 ${
              selectedCategoryId === cat.id
                ? "bg-terracotta text-white"
                : "bg-stone-800 text-stone-400 border border-stone-700"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading && entries.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="text-center">
          <p className="text-stone-500">No scores yet</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => {
            const isMe = session?.participantId === entry.participantId;
            return (
              <Card
                key={entry.participantId}
                className={`${isMe ? "border-terracotta" : ""}`}
                padding="sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-sm ${
                    entry.rank === 1
                      ? "bg-terracotta text-stone-50"
                      : entry.rank === 2
                        ? "bg-stone-600 text-stone-50"
                        : entry.rank === 3
                          ? "bg-terracotta-dark text-stone-200"
                          : "bg-stone-800 text-stone-400"
                  }`}>
                    {entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-heading font-semibold truncate ${isMe ? "text-terracotta" : "text-stone-50"}`}>
                      {entry.displayName}
                      {isMe && <span className="text-xs text-stone-500 ml-2">(you)</span>}
                    </p>
                    <p className="text-xs text-stone-500">
                      {entry.climbsTopped} tops &middot; {entry.totalAttempts} att
                    </p>
                  </div>
                  <p className="text-xl font-heading font-bold text-stone-50">
                    {entry.totalPoints}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
