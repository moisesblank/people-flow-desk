import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Redirect case-insensitive for /ALUNOS/* → /alunos/*
 * P0 anti-tela-preta: evita rota não-casada (React Router é case-sensitive).
 */
export function CaseInsensitiveAlunosRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { pathname, search, hash } = location;

    // Só aplica para o prefixo /ALUNOS (qualquer variação de subrota)
    if (!pathname.startsWith("/ALUNOS")) return;

    const lowerPath = "/alunos" + pathname.slice("/ALUNOS".length);
    navigate(`${lowerPath}${search || ""}${hash || ""}`, { replace: true });
  }, [location, navigate]);

  return null;
}
