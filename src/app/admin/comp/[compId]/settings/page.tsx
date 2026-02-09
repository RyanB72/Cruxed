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

interface Comp {
  id: string;
  name: string;
  code: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  ownerId: string;
  defaultPointConfig: PointConfig;
  closesAt: string | null;
}

interface CoAdmin {
  id: string;
  userId: string;
  user: { id: string; email: string; name: string | null };
}

interface Category {
  id: string;
  name: string;
  _count: { participants: number };
}

const STATUS_FLOW: Record<string, string> = {
  DRAFT: "ACTIVE",
  ACTIVE: "COMPLETED",
};

const statusVariant: Record<string, "neutral" | "terracotta" | "sage"> = {
  DRAFT: "neutral",
  ACTIVE: "terracotta",
  COMPLETED: "sage",
};

export default function SettingsPage() {
  const { compId } = useParams<{ compId: string }>();
  const router = useRouter();

  const [comp, setComp] = useState<Comp | null>(null);
  const [loading, setLoading] = useState(true);

  // Name edit
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Status
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Co-admins
  const [coAdmins, setCoAdmins] = useState<CoAdmin[]>([]);
  const [coAdminEmail, setCoAdminEmail] = useState("");
  const [addingCoAdmin, setAddingCoAdmin] = useState(false);
  const [coAdminError, setCoAdminError] = useState("");
  const [removingCoAdmin, setRemovingCoAdmin] = useState<string | null>(null);

  // Default point config
  const [editConfig, setEditConfig] = useState<PointConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Closing date
  const [editClosesAt, setEditClosesAt] = useState("");
  const [savingClosesAt, setSavingClosesAt] = useState(false);
  const [closesAtSuccess, setClosesAtSuccess] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [catError, setCatError] = useState("");

  // Delete
  const [deleting, setDeleting] = useState(false);

  // Error
  const [error, setError] = useState("");

  const loadCoAdmins = useCallback(async () => {
    try {
      const res = await fetch(`/api/comps/${compId}/co-admins`);
      if (res.ok) {
        const data = await res.json();
        setCoAdmins(data);
      }
    } catch {
      // silent
    }
  }, [compId]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/comps/${compId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setComp(data);
        setEditName(data.name);
        if (data.defaultPointConfig) setEditConfig(data.defaultPointConfig);
        if (data.closesAt) setEditClosesAt(data.closesAt.slice(0, 10));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
    loadCoAdmins();
    loadCategories();
  }, [compId, loadCoAdmins]);

  async function loadCategories() {
    try {
      const res = await fetch(`/api/comps/${compId}/categories`);
      if (res.ok) setCategories(await res.json());
    } catch { /* silent */ }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || editName.trim() === comp?.name) return;
    setSavingName(true);
    setError("");
    try {
      const res = await fetch(`/api/comps/${compId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComp(updated);
        setNameSuccess(true);
        setTimeout(() => setNameSuccess(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update name");
      }
    } catch {
      setError("Network error");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveConfig() {
    if (!editConfig) return;
    setSavingConfig(true);
    try {
      const res = await fetch(`/api/comps/${compId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultPointConfig: editConfig }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComp(updated);
        setConfigSuccess(true);
        setTimeout(() => setConfigSuccess(false), 2000);
      }
    } catch { /* silent */ }
    finally { setSavingConfig(false); }
  }

  async function handleSaveClosesAt() {
    setSavingClosesAt(true);
    try {
      const res = await fetch(`/api/comps/${compId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closesAt: editClosesAt || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComp(updated);
        setClosesAtSuccess(true);
        setTimeout(() => setClosesAtSuccess(false), 2000);
      }
    } catch { /* silent */ }
    finally { setSavingClosesAt(false); }
  }

  async function handleStatusChange() {
    if (!comp) return;
    const nextStatus = STATUS_FLOW[comp.status];
    if (!nextStatus) return;

    const label =
      nextStatus === "ACTIVE" ? "activate" : "mark as completed";
    if (!confirm(`Are you sure you want to ${label} this competition?`)) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/comps/${compId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComp(updated);
      }
    } catch {
      // silent
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAddCoAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!coAdminEmail.trim()) return;
    setAddingCoAdmin(true);
    setCoAdminError("");
    try {
      const res = await fetch(`/api/comps/${compId}/co-admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: coAdminEmail.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setCoAdmins((prev) => [...prev, created]);
        setCoAdminEmail("");
      } else {
        const data = await res.json();
        setCoAdminError(data.error || "Failed to add co-admin");
      }
    } catch {
      setCoAdminError("Network error");
    } finally {
      setAddingCoAdmin(false);
    }
  }

  async function handleRemoveCoAdmin(userId: string) {
    if (!confirm("Remove this co-admin?")) return;
    setRemovingCoAdmin(userId);
    try {
      const res = await fetch(`/api/comps/${compId}/co-admins`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setCoAdmins((prev) => prev.filter((ca) => ca.userId !== userId));
      }
    } catch {
      // silent
    } finally {
      setRemovingCoAdmin(null);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    setCatError("");
    try {
      const res = await fetch(`/api/comps/${compId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setCategories((prev) => [...prev, created]);
        setNewCatName("");
      } else {
        const data = await res.json();
        setCatError(data.error || "Failed to add category");
      }
    } catch {
      setCatError("Network error");
    } finally {
      setAddingCat(false);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!confirm("Remove this category?")) return;
    try {
      const res = await fetch(`/api/comps/${compId}/categories`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete category");
      }
    } catch { /* silent */ }
  }

  async function handleDelete() {
    if (
      !confirm(
        "DELETE this competition? All climbs, participants, and scores will be permanently removed. This cannot be undone."
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/comps/${compId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!comp) {
    return (
      <Card className="text-center py-16">
        <p className="text-stone-400">Competition not found</p>
      </Card>
    );
  }

  const nextStatus = STATUS_FLOW[comp.status];

  return (
    <div>
      <button
        onClick={() => router.push(`/admin/comp/${compId}`)}
        className="text-sm text-stone-500 hover:text-stone-300 transition-colors mb-6 flex items-center gap-1"
      >
        <span>&larr;</span> Back to overview
      </button>

      <h1 className="text-h1 font-heading font-bold text-stone-50 mb-8">
        Settings
      </h1>

      {/* Competition Name */}
      <Card className="mb-6">
        <h2 className="font-heading font-semibold text-stone-50 mb-4">
          Competition Name
        </h2>
        <form onSubmit={handleSaveName} className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            loading={savingName}
            disabled={!editName.trim() || editName.trim() === comp.name}
          >
            {nameSuccess ? "Saved!" : "Save"}
          </Button>
        </form>
        {error && <p className="text-sm text-error mt-2">{error}</p>}
      </Card>

      {/* Status Management */}
      <Card className="mb-6">
        <h2 className="font-heading font-semibold text-stone-50 mb-4">
          Status
        </h2>
        <div className="flex items-center gap-4">
          <Badge variant={statusVariant[comp.status]}>{comp.status}</Badge>
          {nextStatus && (
            <Button
              size="sm"
              onClick={handleStatusChange}
              loading={updatingStatus}
            >
              {nextStatus === "ACTIVE" ? "Activate" : "Complete"}
            </Button>
          )}
          {!nextStatus && (
            <p className="text-sm text-stone-500">
              Competition is completed. No further status changes available.
            </p>
          )}
        </div>
      </Card>

      {/* Default Point Config */}
      <Card className="mb-6">
        <h2 className="font-heading font-semibold text-stone-50 mb-2">
          Default Climb Points
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          New climbs will use this point configuration by default.
        </p>
        {editConfig && (
          <>
            <PointConfigEditor value={editConfig} onChange={setEditConfig} />
            <div className="mt-4">
              <Button onClick={handleSaveConfig} loading={savingConfig}>
                {configSuccess ? "Saved!" : "Save"}
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Final Logging Day */}
      <Card className="mb-6">
        <h2 className="font-heading font-semibold text-stone-50 mb-2">
          Final Logging Day
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          After this date climbers can no longer log scores. Leaderboard stays visible.
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <input
              type="date"
              value={editClosesAt}
              onChange={(e) => setEditClosesAt(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta/50"
            />
          </div>
          <Button onClick={handleSaveClosesAt} loading={savingClosesAt}>
            {closesAtSuccess ? "Saved!" : "Save"}
          </Button>
        </div>
      </Card>

      {/* Categories */}
      <Card className="mb-6">
        <h2 className="font-heading font-semibold text-stone-50 mb-4">
          Categories
        </h2>

        {categories.length === 0 ? (
          <p className="text-stone-500 text-sm mb-4">No categories yet</p>
        ) : (
          <div className="space-y-2 mb-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between bg-stone-800 rounded-xl px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-stone-200">{cat.name}</p>
                  <p className="text-xs text-stone-500">
                    {cat._count.participants} climber{cat._count.participants !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={cat._count.participants > 0}
                  onClick={() => handleDeleteCategory(cat.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddCategory} className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="New category"
              placeholder="e.g. Youth Male"
              value={newCatName}
              onChange={(e) => { setNewCatName(e.target.value); setCatError(""); }}
            />
          </div>
          <Button type="submit" size="sm" loading={addingCat}>
            Add
          </Button>
        </form>
        {catError && <p className="text-sm text-error mt-2">{catError}</p>}
      </Card>

      {/* Co-Admin Management */}
      <Card className="mb-6">
        <h2 className="font-heading font-semibold text-stone-50 mb-4">
          Co-Admins
        </h2>

        {coAdmins.length === 0 ? (
          <p className="text-stone-500 text-sm mb-4">No co-admins yet</p>
        ) : (
          <div className="space-y-2 mb-4">
            {coAdmins.map((ca) => (
              <div
                key={ca.id}
                className="flex items-center justify-between bg-stone-800 rounded-xl px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-stone-200 truncate">
                    {ca.user.name || ca.user.email}
                  </p>
                  {ca.user.name && (
                    <p className="text-xs text-stone-500 truncate">
                      {ca.user.email}
                    </p>
                  )}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  loading={removingCoAdmin === ca.userId}
                  onClick={() => handleRemoveCoAdmin(ca.userId)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddCoAdmin} className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Add co-admin by email"
              placeholder="user@example.com"
              type="email"
              value={coAdminEmail}
              onChange={(e) => {
                setCoAdminEmail(e.target.value);
                setCoAdminError("");
              }}
            />
          </div>
          <Button type="submit" size="sm" loading={addingCoAdmin}>
            Add
          </Button>
        </form>
        {coAdminError && (
          <p className="text-sm text-error mt-2">{coAdminError}</p>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="border-error/30">
        <h2 className="font-heading font-semibold text-error mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-stone-400 mb-4">
          Permanently delete this competition and all associated data. This
          action cannot be undone.
        </p>
        <Button variant="danger" loading={deleting} onClick={handleDelete}>
          Delete Competition
        </Button>
      </Card>
    </div>
  );
}
