import { memo, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * 🔴 P0 Alive Beacon
 * Ajuda a diagnosticar "tela preta" mostrando que o React está vivo,
 * a rota atual e o último erro fatal capturado.
 *
 * Ativa com: ?debugAlunos=1 ou ?debugErrors=1
 */
export const P0AliveBeacon = memo(() => {
  const location = useLocation();
  const [lastError, setLastError] = useState<string | null>(null);

  const enabled =
    typeof window !== "undefined" &&
    (new URLSearchParams(window.location.search).get("debugAlunos") === "1" ||
      new URLSearchParams(window.location.search).has("debugErrors"));

  useEffect(() => {
    if (!enabled) return;

    const readLast = () => {
      const v = (window as any).__p0_last_fatal_error;
      if (!v) return null;
      return typeof v === "string" ? v : JSON.stringify(v);
    };

    setLastError(readLast());

    const onError = (e: ErrorEvent) => {
      try {
        const payload = {
          type: "window.error",
          message: e.message,
          file: (e as any).filename,
          line: (e as any).lineno,
          col: (e as any).colno,
        };
        (window as any).__p0_last_fatal_error = payload;
        setLastError(JSON.stringify(payload));
      } catch {
        // no-op
      }
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      try {
        const payload = { type: "unhandledrejection", reason: String((e as any).reason) };
        (window as any).__p0_last_fatal_error = payload;
        setLastError(JSON.stringify(payload));
      } catch {
        // no-op
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="fixed bottom-3 left-3 z-[2147483647] max-w-[92vw] rounded-lg border border-border bg-card/95 backdrop-blur px-3 py-2 text-xs text-foreground shadow-lg"
      role="status"
      aria-label="P0 Alive Beacon"
    >
      <div className="font-semibold">P0 Beacon (React vivo)</div>
      <div className="mt-1 text-muted-foreground break-words">
        <div>
          <span className="text-foreground/80">path:</span> {location.pathname}
        </div>
        <div>
          <span className="text-foreground/80">search:</span> {location.search || "(vazio)"}
        </div>
        {lastError && (
          <div className="mt-1">
            <div className="text-foreground/80">último erro:</div>
            <pre className="mt-1 max-h-24 overflow-auto rounded bg-muted/40 p-2">{lastError}</pre>
          </div>
        )}
      </div>
    </div>
  );
});

P0AliveBeacon.displayName = "P0AliveBeacon";
