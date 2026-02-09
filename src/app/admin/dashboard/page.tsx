"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  PointConfigEditor,
  type PointConfig,
} from "@/components/admin/point-config-editor";

interface Comp {
  id: string;
  name: string;
  code: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  _count: { climbs: number; participants: number };
}

const statusVariant: Record<string, "neutral" | "terracotta" | "sage"> = {
  DRAFT: "neutral",
  ACTIVE: "terracotta",
  COMPLETED: "sage",
};

const DEFAULT_POINT_CONFIG: PointConfig = {
  flash: 1000,
  attempts: { "2": 800, "3": 600, "4": 500 },
  maxAttempts: 10,
  minPoints: 100,
};

export default function DashboardPage() {
  const router = useRouter();
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [newName, setNewName] = useState("");
  const [categories, setCategories] = useState(["Open A Male", "Open A Female"]);
  const [newCatName, setNewCatName] = useState("");
  const [pointConfig, setPointConfig] = useState<PointConfig>(DEFAULT_POINT_CONFIG);
  const [closesAt, setClosesAt] = useState("");
  const [coAdminEmails, setCoAdminEmails] = useState<string[]>([]);
  const [newCoAdminEmail, setNewCoAdminEmail] = useState("");

  useEffect(() => {
    fetch("/api/comps")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComps(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function resetForm() {
    setNewName("");
    setCategories(["Open A Male", "Open A Female"]);
    setNewCatName("");
    setPointConfig(DEFAULT_POINT_CONFIG);
    setClosesAt("");
    setCoAdminEmails([]);
    setNewCoAdminEmail("");
    setError("");
    setShowForm(false);
  }

  function addCategory() {
    const name = newCatName.trim();
    if (!name || categories.includes(name)) return;
    setCategories((prev) => [...prev, name]);
    setNewCatName("");
  }

  function removeCategory(index: number) {
    if (categories.length <= 1) return;
    setCategories((prev) => prev.filter((_, i) => i !== index));
  }

  function addCoAdmin() {
    const email = newCoAdminEmail.trim().toLowerCase();
    if (!email || coAdminEmails.includes(email)) return;
    setCoAdminEmails((prev) => [...prev, email]);
    setNewCoAdminEmail("");
  }

  function removeCoAdmin(index: number) {
    setCoAdminEmails((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (categories.length === 0) {
      setError("At least one category is required");
      return;
    }
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/comps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          categories,
          defaultPointConfig: pointConfig,
          closesAt: closesAt || null,
          coAdminEmails: coAdminEmails.length > 0 ? coAdminEmails : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create competition");
        return;
      }

      const comp = await res.json();
      setComps((prev) => [comp, ...prev]);
      resetForm();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h1 font-heading font-bold text-stone-50">
          Your Competitions
        </h1>
        <Button onClick={() => showForm ? resetForm() : setShowForm(true)}>
          {showForm ? "Cancel" : "New Competition"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-4 mb-8">
          {/* Name */}
          <Card>
            <h2 className="font-heading font-semibold text-stone-50 mb-3">
              Competition Name
            </h2>
            <Input
              placeholder="Summer Bouldering Comp"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
          </Card>

          {/* Categories */}
          <Card>
            <h2 className="font-heading font-semibold text-stone-50 mb-1">
              Categories
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Can be changed later in comp settings.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map((cat, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-stone-200"
                >
                  {cat}
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCategory(i)}
                      className="text-stone-500 hover:text-error transition-colors ml-1"
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="e.g. Open B Male"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addCategory}>
                Add
              </Button>
            </div>
          </Card>

          {/* Default Point Config */}
          <Card>
            <h2 className="font-heading font-semibold text-stone-50 mb-1">
              Default Climb Points
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              New climbs will use these defaults. Can be changed per climb or in settings.
            </p>
            <PointConfigEditor value={pointConfig} onChange={setPointConfig} />
          </Card>

          {/* Closing Date */}
          <Card>
            <h2 className="font-heading font-semibold text-stone-50 mb-1">
              Final Logging Day
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Optional. After this date climbers can no longer log scores. Leaderboard stays visible. Can be changed in settings.
            </p>
            <input
              type="date"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta/50"
            />
          </Card>

          {/* Co-Admins */}
          <Card>
            <h2 className="font-heading font-semibold text-stone-50 mb-1">
              Co-Admins
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Optional. Can be added later in comp settings.
            </p>
            {coAdminEmails.length > 0 && (
              <div className="space-y-2 mb-3">
                {coAdminEmails.map((email, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-stone-800 border border-stone-700 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-stone-200 truncate">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeCoAdmin(i)}
                      className="text-stone-500 hover:text-error transition-colors ml-2 shrink-0"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="user@example.com"
                  type="email"
                  value={newCoAdminEmail}
                  onChange={(e) => setNewCoAdminEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCoAdmin();
                    }
                  }}
                />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addCoAdmin}>
                Add
              </Button>
            </div>
          </Card>

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" size="lg" loading={creating} className="w-full">
            Create Competition
          </Button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : comps.length === 0 && !showForm ? (
        <Card className="text-center py-16">
          <p className="text-stone-400 mb-4">No competitions yet</p>
          <Button onClick={() => setShowForm(true)}>Create your first</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comps.map((comp) => (
            <Card
              key={comp.id}
              className="cursor-pointer hover:border-stone-600 transition-colors group"
              onClick={() => router.push(`/admin/comp/${comp.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-heading font-semibold text-lg text-stone-50 group-hover:text-terracotta transition-colors">
                  {comp.name}
                </h2>
                <Badge variant={statusVariant[comp.status]}>{comp.status}</Badge>
              </div>
              <p className="text-sm text-stone-500 font-mono mb-4">
                {comp.code}
              </p>
              <div className="flex gap-4 text-sm text-stone-400">
                <span>{comp._count.climbs} climbs</span>
                <span>{comp._count.participants} participants</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
