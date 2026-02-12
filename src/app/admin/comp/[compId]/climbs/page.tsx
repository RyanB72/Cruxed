"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  PointConfigEditor,
  type PointConfig,
} from "@/components/admin/point-config-editor";
import { type Grade } from "@/lib/default-grades";

interface Climb {
  id: string;
  name: string;
  gradeName: string | null;
  climbNumber: number;
  sortOrder: number;
  pointConfig: PointConfig;
}

const FALLBACK_POINT_CONFIG: PointConfig = {
  flash: 1000,
  attempts: { "2": 800, "3": 600, "4": 500 },
  maxAttempts: 10,
  minPoints: 100,
};

export default function ClimbsPage() {
  const { compId } = useParams<{ compId: string }>();
  const router = useRouter();
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultConfig, setDefaultConfig] = useState<PointConfig>(FALLBACK_POINT_CONFIG);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formGrade, setFormGrade] = useState("");
  const [formClimbNumber, setFormClimbNumber] = useState("");
  const [formConfig, setFormConfig] = useState<PointConfig>(FALLBACK_POINT_CONFIG);
  const [showPointOverride, setShowPointOverride] = useState(false);

  const resetForm = useCallback(() => {
    setFormGrade("");
    setFormClimbNumber("");
    setFormConfig(defaultConfig);
    setShowPointOverride(false);
    setEditingId(null);
    setShowForm(false);
    setError("");
  }, [defaultConfig]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/comps/${compId}/climbs`).then((r) => r.json()),
      fetch(`/api/comps/${compId}`).then((r) => r.json()),
    ])
      .then(([climbsData, compData]) => {
        if (Array.isArray(climbsData)) setClimbs(climbsData);
        if (compData?.defaultPointConfig) {
          setDefaultConfig(compData.defaultPointConfig);
          setFormConfig(compData.defaultPointConfig);
        }
        if (Array.isArray(compData?.grades)) {
          setGrades(compData.grades);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [compId]);

  function startEdit(climb: Climb) {
    setFormGrade(climb.gradeName ?? climb.name);
    setFormClimbNumber(String(climb.climbNumber));
    setFormConfig(climb.pointConfig);
    setShowPointOverride(true);
    setEditingId(climb.id);
    setShowForm(true);
    setError("");
  }

  function handleGradeChange(gradeName: string) {
    setFormGrade(gradeName);
    const grade = grades.find((g) => g.name === gradeName);
    if (grade) {
      setFormConfig({ ...grade.pointConfig, attempts: { ...grade.pointConfig.attempts } });
      setShowPointOverride(false);
    }
  }

  function nextClimbNumber(): number {
    if (climbs.length === 0) return 1;
    return Math.max(...climbs.map((c) => c.climbNumber)) + 1;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formGrade.trim()) return;
    setSaving(true);
    setError("");

    const num = parseInt(formClimbNumber, 10);
    if (!num || num < 1) {
      setError("Climb number is required");
      setSaving(false);
      return;
    }

    const body = {
      name: formGrade.trim(),
      gradeName: formGrade.trim(),
      climbNumber: num,
      pointConfig: formConfig,
    };

    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/comps/${compId}/climbs/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to update climb");
          return;
        }
        const updated = await res.json();
        setClimbs((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c))
        );
      } else {
        // Create
        const res = await fetch(`/api/comps/${compId}/climbs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to create climb");
          return;
        }
        const created = await res.json();
        setClimbs((prev) => [...prev, created]);
      }
      resetForm();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(climbId: string) {
    try {
      const res = await fetch(`/api/comps/${compId}/climbs/${climbId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setClimbs((prev) => prev.filter((c) => c.id !== climbId));
        if (editingId === climbId) resetForm();
      }
    } catch {
      // silently fail
    }
  }

  function pointSummary(config: PointConfig): string {
    const parts = [`Flash: ${config.flash}`];
    const keys = Object.keys(config.attempts)
      .map(Number)
      .sort((a, b) => a - b);
    for (const k of keys) {
      parts.push(`${k}att: ${config.attempts[String(k)]}`);
    }
    parts.push(`Min: ${config.minPoints}`);
    return parts.join(" / ");
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

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h1 font-heading font-bold text-stone-50">
          Climbs
        </h1>
        <Button
          onClick={() => {
            if (showForm && !editingId) {
              resetForm();
            } else {
              resetForm();
              setFormClimbNumber(String(nextClimbNumber()));
              setShowForm(true);
            }
          }}
        >
          {showForm && !editingId ? "Cancel" : "Add Climb"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-heading font-semibold text-stone-50">
              {editingId ? "Edit Climb" : "New Climb"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Climb Number"
                placeholder="1"
                type="number"
                min="1"
                value={formClimbNumber}
                onChange={(e) => setFormClimbNumber(e.target.value)}
                autoFocus
              />
              {grades.length > 0 ? (
                <div>
                  <label className="block text-xs text-stone-400 mb-1.5">Grade</label>
                  <select
                    value={formGrade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta/50"
                  >
                    <option value="">Select grade</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <Input
                  label="Name"
                  placeholder="Tag Colour"
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                />
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowPointOverride(!showPointOverride)}
                className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
              >
                {showPointOverride ? "Hide point override" : "Override points for this climb"}
              </button>
              {showPointOverride && (
                <div className="mt-3">
                  <PointConfigEditor value={formConfig} onChange={setFormConfig} />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                {editingId ? "Save Changes" : "Add Climb"}
              </Button>
              {editingId && (
                <Button variant="ghost" type="button" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {/* Climb list */}
      {climbs.length === 0 && !showForm ? (
        <Card className="text-center py-16">
          <p className="text-stone-400 mb-4">No climbs yet</p>
          <Button onClick={() => setShowForm(true)}>Add your first climb</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {climbs.map((climb) => (
            <Card
              key={climb.id}
              className={`transition-colors ${
                editingId === climb.id ? "border-terracotta/50" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="terracotta">#{climb.climbNumber}</Badge>
                    <h3 className="font-heading font-semibold text-stone-50 truncate">
                      {climb.name}
                    </h3>
                    {climb.gradeName && (
                      <Badge variant="sage">{climb.gradeName}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 truncate">
                    {pointSummary(climb.pointConfig)}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(climb)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(climb.id)}
                  >
                    Delete
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
