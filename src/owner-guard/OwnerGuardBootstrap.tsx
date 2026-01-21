// ============================================
// 🔒 OWNER GUARD — BOOTSTRAP GLOBAL
// P0: garante que Owner NUNCA permaneça em /alunos (ou qualquer rota fora de /gestaofc)
//
// Regras:
// - Toda lógica de redirect do Owner vive em src/owner-guard/*
// - Este componente só ORQUESTRA a execução no ciclo do Router
// ============================================

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { enforceOwnerRedirectAsync, executeOwnerRedirect } from "./enforceOwnerRedirect";
import { OWNER_HOME } from "./constants";

/**
 * Deve ser renderizado UMA vez, dentro do <BrowserRouter>.
 * Ele executa:
 * 1) tentativa síncrona via cache (isOwnerSync) para evitar flicker
 * 2) fallback assíncrono resolvendo role no banco (última linha de defesa)
 */
export function OwnerGuardBootstrap() {
  const location = useLocation();
  const lastPathRef = useRef<string>("");

  useEffect(() => {
    const pathname = location.pathname;

    // Evita loop se o Router estiver re-renderizando sem mudança real de path
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    // 1) Fast path: se cache síncrono indicar owner, já executa redirect.
    // (executeOwnerRedirect internamente usa isOwnerSync quando role não é fornecida)
    const redirectedSync = executeOwnerRedirect({ pathname });
    if (redirectedSync) return;

    // 2) Slow path: resolve role (cache → sessão → banco) e decide.
    (async () => {
      try {
        const result = await enforceOwnerRedirectAsync(pathname);
        if (result.shouldRedirect && result.targetPath && result.targetPath !== pathname) {
          window.location.replace(result.targetPath);
        }
      } catch (err) {
        // FAIL-OPEN: nunca bloquear render (evita tela preta).
        // Porém, se por algum motivo estivermos em /alunos, fazemos fallback final.
        if (pathname.startsWith("/alunos")) {
          window.location.replace(OWNER_HOME);
        }
      }
    })();
  }, [location.pathname]);

  return null;
}
