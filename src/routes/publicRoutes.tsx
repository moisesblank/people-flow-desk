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
const GuiaDaPlataforma = lazy(() => import("@/pages/GuiaDaPlataforma"));
const PrimeiroAcesso = lazy(() => import("@/pages/PrimeiroAcesso"));
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
    {/* 📚 Guia Educacional da Plataforma */}
    <Route path="/guia-plataforma" element={<GuiaDaPlataforma />} />
    {/* 🔐 ONBOARDING OBRIGATÓRIO - Primeiro Acesso */}
    <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
    <Route path="*" element={<NotFound />} />
  </>
);
