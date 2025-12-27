// ============================================
// 🌐 ROTAS PÚBLICAS (SEM AUTH)
// ============================================

import { Route } from "react-router-dom";
import { lazy } from "react";

// Lazy imports
const Home = lazy(() => import("@/pages/Home"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Auth = lazy(() => import("@/pages/Auth"));
const TermosDeUso = lazy(() => import("@/pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("@/pages/PoliticaPrivacidade"));
const AreaGratuita = lazy(() => import("@/pages/AreaGratuita"));
const PerfilIncompleto = lazy(() => import("@/pages/PerfilIncompleto"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export const publicRoutes = (
  <>
    <Route path="/" element={<Home />} />
    <Route path="/site" element={<LandingPage />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/termos" element={<TermosDeUso />} />
    <Route path="/privacidade" element={<PoliticaPrivacidade />} />
    <Route path="/area-gratuita" element={<AreaGratuita />} />
    {/* 🚨 P0-3 CONSTITUIÇÃO v10.0: Usuário autenticado SEM role */}
    <Route path="/perfil-incompleto" element={<PerfilIncompleto />} />
    <Route path="*" element={<NotFound />} />
  </>
);
