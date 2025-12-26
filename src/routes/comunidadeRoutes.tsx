// ============================================
// 🌐 COMUNIDADE (NÃO PAGANTE + BETA)
// pro.moisesmedeiros.com.br/comunidade
// ============================================

import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedPage } from "./routeHelpers";

// Lazy imports
const Comunidade = lazy(() => import("@/pages/Comunidade"));
const ComunidadeForum = lazy(() => import("@/pages/comunidade/ComunidadeForum"));
const ComunidadePosts = lazy(() => import("@/pages/comunidade/ComunidadePosts"));
const ComunidadeMembros = lazy(() => import("@/pages/comunidade/ComunidadeMembros"));
const ComunidadeEventos = lazy(() => import("@/pages/comunidade/ComunidadeEventos"));
const ComunidadeChat = lazy(() => import("@/pages/comunidade/ComunidadeChat"));

export const comunidadeRoutes = (
  <>
    <Route path="/comunidade" element={<Comunidade />} />
    <Route path="/comunidade/forum" element={<ProtectedPage><ComunidadeForum /></ProtectedPage>} />
    <Route path="/comunidade/posts" element={<ProtectedPage><ComunidadePosts /></ProtectedPage>} />
    <Route path="/comunidade/membros" element={<ProtectedPage><ComunidadeMembros /></ProtectedPage>} />
    <Route path="/comunidade/eventos" element={<ProtectedPage><ComunidadeEventos /></ProtectedPage>} />
    <Route path="/comunidade/chat" element={<ProtectedPage><ComunidadeChat /></ProtectedPage>} />
  </>
);
