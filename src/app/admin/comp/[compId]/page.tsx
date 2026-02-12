"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

interface CompDetail {
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

export default function CompOverviewPage() {
  const { compId } = useParams<{ compId: string }>();
  const router = useRouter();
  const [comp, setComp] = useState<CompDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetch(`/api/comps/${compId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setComp(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [compId]);

  async function handleActivate() {
    setActivating(true);
    try {
      const res = await fetch(`/api/comps/${compId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComp(updated);
      }
    } finally {
      setActivating(false);
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

  return (
    <div>
      <button
        onClick={() => router.push("/admin/dashboard")}
        className="text-sm text-stone-500 hover:text-stone-300 transition-colors mb-6 flex items-center gap-1"
      >
        <span>&larr;</span> Back to dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <h1 className="text-h1 font-heading font-bold text-stone-50 flex-1">
          {comp.name}
        </h1>
        <Badge variant={statusVariant[comp.status]} className="self-start">
          {comp.status}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <p className="text-xs text-stone-500 font-heading uppercase tracking-wider mb-1">
            Climbs
          </p>
          <p className="text-3xl font-heading font-bold text-stone-50">
            {comp._count.climbs}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-stone-500 font-heading uppercase tracking-wider mb-1">
            Participants
          </p>
          <p className="text-3xl font-heading font-bold text-stone-50">
            {comp._count.participants}
          </p>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button onClick={() => router.push(`/admin/comp/${compId}/climbs`)}>
          Manage Climbs
        </Button>
        <Button
          variant="secondary"
          onClick={() => router.push(`/admin/comp/${compId}/participants`)}
        >
          View Participants
        </Button>
        <Button
          variant="secondary"
          onClick={() => router.push(`/admin/comp/${compId}/settings`)}
        >
          Settings
        </Button>
      </div>

      {comp.status === "DRAFT" && (
        <Card className="border-terracotta/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-stone-50 mb-1">
                Ready to go live?
              </h3>
              <p className="text-sm text-stone-400">
                Activate this competition to allow participants to join and log
                scores.
              </p>
            </div>
            <Button onClick={handleActivate} loading={activating}>
              Activate Competition
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
