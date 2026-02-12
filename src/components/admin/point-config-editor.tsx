"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface PointConfig {
  flash: number;
  attempts: Record<string, number>;
  maxAttempts: number;
  minPoints: number;
}

interface PointConfigEditorProps {
  value: PointConfig;
  onChange: (config: PointConfig) => void;
}

export function PointConfigEditor({ value, onChange }: PointConfigEditorProps) {
  const attemptKeys = Object.keys(value.attempts)
    .map(Number)
    .sort((a, b) => a - b);

  function setFlash(flash: number) {
    onChange({ ...value, flash });
  }

  function setAttemptPoints(key: string, points: number) {
    onChange({
      ...value,
      attempts: { ...value.attempts, [key]: points },
    });
  }

  function removeAttemptTier(key: string) {
    const next = { ...value.attempts };
    delete next[key];
    const remaining = Object.keys(next).map(Number);
    const newMax = remaining.length > 0 ? Math.max(...remaining) : 1;
    onChange({ ...value, attempts: next, maxAttempts: newMax });
  }

  const highestTier = attemptKeys.length > 0 ? Math.max(...attemptKeys) : 1;

  function addAttemptTier() {
    const nextKey = attemptKeys.length > 0 ? Math.max(...attemptKeys) + 1 : 2;
    const lastValue =
      attemptKeys.length > 0
        ? value.attempts[String(Math.max(...attemptKeys))]
        : value.flash;
    const suggested = Math.max(lastValue - 50, value.minPoints);
    onChange({
      ...value,
      attempts: { ...value.attempts, [String(nextKey)]: suggested },
      maxAttempts: nextKey,
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-500 font-heading uppercase tracking-wider">
        Point Configuration
      </p>

      {/* Flash */}
      <div className="rounded-xl bg-terracotta/10 border border-terracotta/20 p-3">
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <Input
            label="Flash (1 attempt)"
            type="number"
            min={0}
            value={value.flash}
            onChange={(e) => setFlash(Number(e.target.value) || 0)}
            className="!bg-terracotta/10 !border-terracotta/25"
          />
        </div>
      </div>

      {/* Attempt tiers */}
      {attemptKeys.map((k) => {
        const key = String(k);
        return (
          <div key={key} className="rounded-xl bg-stone-900 border border-stone-700/50 p-3">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
              <Input
                label={`${k} attempts`}
                type="number"
                min={0}
                value={value.attempts[key]}
                onChange={(e) =>
                  setAttemptPoints(key, Number(e.target.value) || 0)
                }
                className="!bg-stone-800/60 !border-stone-700/50"
              />
              <button
                type="button"
                onClick={() => removeAttemptTier(key)}
                className="text-sm font-semibold uppercase tracking-wide text-error/70 hover:text-error transition-colors mt-6"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}

      <Button
        variant="secondary"
        size="sm"
        type="button"
        onClick={addAttemptTier}
      >
        + Add attempt tier
      </Button>

      {/* Min points for attempts beyond highest tier */}
      <div className="rounded-xl bg-stone-900 border border-stone-700/50 p-3">
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <Input
            label={`Greater than ${highestTier} attempt${highestTier !== 1 ? "s" : ""}`}
            type="number"
            min={0}
            value={value.minPoints}
            onChange={(e) =>
              onChange({
                ...value,
                minPoints: Number(e.target.value) || 0,
              })
            }
            className="!bg-stone-800/60 !border-stone-700/50"
          />
        </div>
      </div>
    </div>
  );
}
