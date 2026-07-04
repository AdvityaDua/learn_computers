import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-danger/25 bg-danger-soft px-6 py-12 text-center">
      <AlertTriangle size={26} className="text-danger" />
      <p className="text-sm font-semibold text-danger">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
