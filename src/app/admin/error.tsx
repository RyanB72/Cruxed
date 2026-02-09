"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-20 px-4">
      <Card className="max-w-sm w-full text-center">
        <h2 className="text-h3 font-heading text-stone-50 mb-2">Something went wrong</h2>
        <p className="text-sm text-stone-400 mb-4">{error.message}</p>
        <Button onClick={reset} variant="secondary">
          Try again
        </Button>
      </Card>
    </div>
  );
}
