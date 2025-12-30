// ============================================
// 👨‍🎓 CENTRAL DO ALUNO BETA (PAGANTE)
// pro.moisesmedeiros.com.br/alunos/*
// ============================================

import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedPage } from "./routeHelpers";

// Lazy imports - Central do Aluno
const AlunosRouteSwitcher = lazy(() => import("@/pages/AlunosRouteSwitcher"));
const AlunoDashboard = lazy(() => import("@/pages/aluno/AlunoDashboard"));
const AlunoLivroWeb = lazy(() => import("@/pages/aluno/AlunoLivroWeb"));
const AlunoVideoaulas = lazy(() => import("@/pages/aluno/AlunoVideoaulas"));
const AlunoQuestoes = lazy(() => import("@/pages/aluno/AlunoQuestoes"));
const AlunoSimulados = lazy(() => import("@/pages/aluno/AlunoSimulados"));
const AlunoRanking = lazy(() => import("@/pages/RankingPage"));
const AlunoTabelaPeriodica = lazy(() => import("@/pages/aluno/AlunoTabelaPeriodica"));
const TutoriaIA = lazy(() => import("@/pages/aluno/TutoriaIA"));
const AlunoFlashcards = lazy(() => import("@/pages/FlashcardsPage"));
const AlunoPerfil = lazy(() => import("@/pages/ProfilePage"));

// Placeholders - Named exports
const AlunoCronograma = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoCronograma })));
const AlunoMateriais = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoMateriais })));
const AlunoResumos = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoResumos })));
const AlunoMapasMentais = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoMapasMentais })));
const AlunoRedacao = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoRedacao })));
const AlunoDesempenho = lazy(() => import("@/pages/aluno/AlunoPlaceholders").then(m => ({ default: m.AlunoDesempenho })));
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
    <Route path="/alunos" element={<ProtectedPage><AlunosRouteSwitcher /></ProtectedPage>} />
    <Route path="/alunos/dashboard" element={<ProtectedPage><AlunoDashboard /></ProtectedPage>} />
    {/* Canonical - Livros Web */}
    <Route path="/alunos/livro-web" element={<ProtectedPage><AlunoLivroWeb /></ProtectedPage>} />
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
  </>
);
