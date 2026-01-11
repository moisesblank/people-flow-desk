// ============================================
// 👨‍🎓 CENTRAL DO ALUNO BETA (PAGANTE)
// pro.moisesmedeiros.com.br/alunos/*
// ============================================

import { Route, Navigate } from "react-router-dom";
import { lazy } from "react";
import { ProtectedPage } from "./routeHelpers";
import { CaseInsensitiveAlunosRedirect } from "@/components/routing/CaseInsensitiveAlunosRedirect";

// ✅ P0: /alunos NÃO pode depender de chunk lazy para existir.
// Root-cause fix: evitar Suspense infinito se o chunk do switcher falhar/stallar.
import AlunosRouteSwitcher from "@/pages/AlunosRouteSwitcher";

// Lazy imports - Central do Aluno (subrotas)
const AlunoUniversalDashboard = lazy(() => import("@/pages/aluno/AlunoUniversalDashboard"));
const AlunoLivroWeb = lazy(() => import("@/pages/aluno/AlunoLivroWeb"));
const AlunoCursos = lazy(() => import("@/pages/aluno/AlunoCursos"));
const AlunoVideoaulas = lazy(() => import("@/pages/aluno/AlunoVideoaulas"));
const AlunoQuestoes = lazy(() => import("@/pages/aluno/AlunoQuestoes"));
const AlunoSimulados = lazy(() => import("@/pages/aluno/AlunoSimulados"));
const AlunoRanking = lazy(() => import("@/pages/RankingPage"));
const AlunoTabelaPeriodica = lazy(() => import("@/pages/aluno/AlunoTabelaPeriodica"));
const TutoriaIA = lazy(() => import("@/pages/aluno/TutoriaIA"));
const AlunoPlanejamento = lazy(() => import("@/pages/aluno/AlunoPlanejamento"));
const AlunoFlashcards = lazy(() => import("@/pages/FlashcardsPage"));
const AlunoPerfil = lazy(() => import("@/pages/ProfilePage"));

// Placeholders - Named exports
const AlunoCronograma = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoCronograma })));
const AlunoMateriais = lazy(() => import("@/pages/aluno/AlunoMateriaisNetflix"));
const AlunoResumos = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoResumos })));
const AlunoMapasMentais = lazy(() => import("@/pages/aluno/AlunoMapasMentais"));
const AlunoRedacao = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoRedacao })));
const AlunoDesempenho = lazy(() => import("@/pages/aluno/AlunoDesempenho"));
const AlunoConquistas = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoConquistas })));
const AlunoForum = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoForum })));
const AlunoLives = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoLives })));
const AlunoDuvidas = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoDuvidas })));
const AlunoRevisao = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoRevisao })));
const AlunoLaboratorio = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoLaboratorio })));
const AlunoCalculadora = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoCalculadora })));
const AlunoMetas = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoMetas })));
const AlunoAgenda = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoAgenda })));
const AlunoCertificados = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoCertificados })));

export const alunoRoutes = (
  <>
    {/* P0: Alias case-insensitive ANTES de qualquer outra rota /ALUNOS */}
    {/* Rota exata /ALUNOS deve vir ANTES de /ALUNOS/* para evitar conflito */}
    <Route path="/ALUNOS" element={<Navigate to="/alunos/dashboard" replace />} />
    <Route path="/ALUNOS/*" element={<CaseInsensitiveAlunosRedirect />} />
    <Route path="/alunos" element={<ProtectedPage><AlunosRouteSwitcher /></ProtectedPage>} />
    <Route path="/alunos/dashboard" element={<ProtectedPage><AlunoUniversalDashboard /></ProtectedPage>} />
    {/* Canonical - Livros Web */}
    <Route path="/alunos/livro-web" element={<ProtectedPage><AlunoLivroWeb /></ProtectedPage>} />
    {/* Canonical - Cursos (Mirror Read-Only) */}
    <Route path="/alunos/cursos" element={<ProtectedPage><AlunoCursos /></ProtectedPage>} />
    <Route path="/alunos/cronograma" element={<ProtectedPage><AlunoCronograma /></ProtectedPage>} />
    <Route path="/alunos/videoaulas" element={<ProtectedPage><AlunoVideoaulas /></ProtectedPage>} />
    <Route path="/alunos/materiais" element={<ProtectedPage><AlunoMateriais /></ProtectedPage>} />
    <Route path="/alunos/resumos" element={<ProtectedPage><AlunoResumos /></ProtectedPage>} />
    <Route path="/alunos/mapas-mentais" element={<ProtectedPage><AlunoMapasMentais /></ProtectedPage>} />
    <Route path="/alunos/questoes" element={<ProtectedPage><AlunoQuestoes /></ProtectedPage>} />
    <Route path="/alunos/simulados" element={<ProtectedPage><AlunoSimulados /></ProtectedPage>} />
    <Route path="/alunos/redacao" element={<ProtectedPage><AlunoRedacao /></ProtectedPage>} />
    <Route path="/alunos/desempenho" element={<ProtectedPage><AlunoDesempenho /></ProtectedPage>} />
    <Route path="/alunos/ranking" element={<ProtectedPage><AlunoRanking /></ProtectedPage>} />
    <Route path="/alunos/conquistas" element={<ProtectedPage><AlunoConquistas /></ProtectedPage>} />
    <Route path="/alunos/tutoria" element={<ProtectedPage><TutoriaIA /></ProtectedPage>} />
    <Route path="/alunos/forum" element={<ProtectedPage><AlunoForum /></ProtectedPage>} />
    <Route path="/alunos/lives" element={<ProtectedPage><AlunoLives /></ProtectedPage>} />
    <Route path="/alunos/duvidas" element={<ProtectedPage><AlunoDuvidas /></ProtectedPage>} />
    <Route path="/alunos/revisao" element={<ProtectedPage><AlunoRevisao /></ProtectedPage>} />
    <Route path="/alunos/laboratorio" element={<ProtectedPage><AlunoLaboratorio /></ProtectedPage>} />
    <Route path="/alunos/calculadora" element={<ProtectedPage><AlunoCalculadora /></ProtectedPage>} />
    <Route path="/alunos/tabela-periodica" element={<ProtectedPage><AlunoTabelaPeriodica /></ProtectedPage>} />
    <Route path="/alunos/flashcards" element={<ProtectedPage><AlunoFlashcards /></ProtectedPage>} />
    <Route path="/alunos/metas" element={<ProtectedPage><AlunoMetas /></ProtectedPage>} />
    <Route path="/alunos/agenda" element={<ProtectedPage><AlunoAgenda /></ProtectedPage>} />
    <Route path="/alunos/certificados" element={<ProtectedPage><AlunoCertificados /></ProtectedPage>} />
    <Route path="/alunos/perfil" element={<ProtectedPage><AlunoPerfil /></ProtectedPage>} />
    <Route path="/alunos/planejamento" element={<ProtectedPage><AlunoPlanejamento /></ProtectedPage>} />
  </>
);
