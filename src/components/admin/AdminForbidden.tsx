import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

interface AdminForbiddenProps {
  onUnlock: () => void;
}

export function AdminForbidden({ onUnlock }: AdminForbiddenProps) {
  const [typedKeys, setTypedKeys] = useState<string[]>([]);

  useEffect(() => {
    // Secret trigger 1: Ctrl + Shift + A
    // Secret trigger 2: typing "stride"
    const handleKeyDown = (e: KeyboardEvent) => {
      // Trigger 1 check
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        onUnlock();
        return;
      }

      // Trigger 2 check: typing "stride"
      const targetSequence = ["s", "t", "r", "i", "d", "e"];
      const key = e.key.toLowerCase();

      // Only track single character keys
      if (key.length === 1) {
        setTypedKeys((prev) => {
          const next = [...prev, key].slice(-targetSequence.length);
          if (next.join("") === targetSequence.join("")) {
            onUnlock();
            return [];
          }
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onUnlock]);

  return (
    <div className="stride-section-dark min-h-screen flex items-center justify-center px-4 select-none">
      <div className="max-w-md text-center">
        <div className="eyebrow text-[color:var(--muted-on-dark)] tracking-[0.2em] font-mono uppercase">
          403 · Forbidden
        </div>
        <h1 className="mt-6 font-display text-[clamp(3rem,10vw,7rem)] leading-[0.9] text-white">
          Access denied.
        </h1>
        <p className="mt-6 text-sm text-[color:var(--muted-on-dark)] max-w-sm mx-auto leading-relaxed">
          You do not have permission to view this area.
        </p>
        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center bg-[color:var(--ember)] hover:bg-[color:var(--ember-hover)] transition-colors px-6 py-3..5 text-sm font-medium text-[color:var(--ember-foreground)] uppercase tracking-wider"
            style={{ borderRadius: 3 }}
          >
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
