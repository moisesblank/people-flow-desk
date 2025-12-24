// ============================================
// 🔄 LEGACY REDIRECT HANDLER
// Executa redirects de rotas legadas automaticamente
// /aluno/* → /alunos/*
// /admin/* → /gestao/*
// ============================================

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { shouldRedirect, logLegacyRedirect } from "@/lib/cloudflare/legacyRedirects";

export function LegacyRedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const result = shouldRedirect(location.pathname);
    
    if (result.shouldRedirect && result.matched) {
      // Preservar query string e hash
      const queryString = location.search || "";
      const hash = location.hash || "";
      const fullTarget = `${result.to}${queryString}${hash}`;
      
      // Log do redirect para auditoria
      logLegacyRedirect({
        type: "legacy_redirect",
        from: result.from,
        to: result.to,
        permanent: result.permanent,
        description: result.description,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
      
      // Executar redirect
      navigate(fullTarget, { replace: true });
      
      console.log(`[LEGACY-REDIRECT] ${result.from} → ${fullTarget}`);
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return null; // Componente invisível
}
