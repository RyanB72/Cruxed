"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PointConfigEditor, type PointConfig } from "./point-config-editor";
import { type Grade, gradeId } from "@/lib/default-grades";

interface GradeListEditorProps {
  value: Grade[];
  onChange: (grades: Grade[]) => void;
}

export function GradeListEditor({ value, onChange }: GradeListEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateGrade(id: string, updates: Partial<Grade>) {
    onChange(value.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }

  function removeGrade(id: string) {
    if (value.length <= 1) return;
    onChange(value.filter((g) => g.id !== id));
  }

  function addGrade() {
    const last = value[value.length - 1];
    const newGrade: Grade = {
      id: gradeId(),
      name: "",
      sortOrder: value.length,
      pointConfig: last
        ? { ...last.pointConfig, attempts: { ...last.pointConfig.attempts } }
        : { flash: 1000, attempts: { "2": 800, "3": 600, "4": 500 }, maxAttempts: 10, minPoints: 100 },
    };
    onChange([...value, newGrade]);
    setExpandedId(newGrade.id);
  }

  return (
    <div className="space-y-3">
      {value.map((grade) => {
        const isExpanded = expandedId === grade.id;
        return (
          <div
            key={grade.id}
            className="bg-stone-800 border border-stone-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Grade name"
                  value={grade.name}
                  onChange={(e) => updateGrade(grade.id, { name: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : grade.id)}
                className="text-xs text-stone-400 hover:text-stone-200 transition-colors whitespace-nowrap"
              >
                {isExpanded ? "Hide points" : "Edit points"}
              </button>
              {value.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGrade(grade.id)}
                  className="text-stone-500 hover:text-error transition-colors"
                >
                  &times;
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-stone-700">
                <PointConfigEditor
                  value={grade.pointConfig}
                  onChange={(pc: PointConfig) =>
                    updateGrade(grade.id, { pointConfig: pc })
                  }
                />
              </div>
            )}
          </div>
        );
      })}

      <Button type="button" variant="secondary" size="sm" onClick={addGrade}>
        + Add Grade
      </Button>
    </div>
  );
}
