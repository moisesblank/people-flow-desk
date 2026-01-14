// ============================================
// 🌐 ROTAS PÚBLICAS (SEM AUTH)
// v2.0 - Fragmentação da Landing Page
// ============================================

import { Route } from "react-router-dom";
import { lazy } from "react";

// Lazy imports - Core Pages
const Home = lazy(() => import("@/pages/Home"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Auth = lazy(() => import("@/pages/Auth"));
const TermosDeUso = lazy(() => import("@/pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("@/pages/PoliticaPrivacidade"));
const AreaGratuita = lazy(() => import("@/pages/AreaGratuita"));
const PerfilIncompleto = lazy(() => import("@/pages/PerfilIncompleto"));
const GuiaDaPlataforma = lazy(() => import("@/pages/GuiaDaPlataforma"));
const PrimeiroAcesso = lazy(() => import("@/pages/PrimeiroAcesso"));
const PrimeiroAcessoFuncionario = lazy(() => import("@/pages/PrimeiroAcessoFuncionario"));

// 🛡️ Security Pages
const DeviceLimitGate = lazy(() => import("@/pages/security/DeviceLimitGate"));
const SameTypeReplacementGate = lazy(() => import("@/pages/security/SameTypeReplacementGate"));

// 📱 QR Code Resolver - Import direto para garantir funcionamento
import QRCodeResolverPage from "@/pages/QRCodeResolver";

// 🎬 LANDING PAGES FRAGMENTADAS (novas URLs dedicadas)
const Aprovados = lazy(() => import("@/pages/landing/Aprovados"));
const Sobre = lazy(() => import("@/pages/landing/Sobre"));
const Metodologia = lazy(() => import("@/pages/landing/Metodologia"));
const CursosPage = lazy(() => import("@/pages/landing/Cursos"));
const Depoimentos = lazy(() => import("@/pages/landing/Depoimentos"));
const FAQ = lazy(() => import("@/pages/landing/FAQ"));
const Apresentacao = lazy(() => import("@/pages/landing/Apresentacao"));
const AppPage = lazy(() => import("@/pages/landing/App"));
const Estatisticas = lazy(() => import("@/pages/landing/Estatisticas"));
const Matricula = lazy(() => import("@/pages/landing/Matricula"));

export const publicRoutes = (
  <>
    {/* ===== CORE ROUTES ===== */}
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
    
    {/* 🔐 ONBOARDING OBRIGATÓRIO - Primeiro Acesso (Alunos) */}
    <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
    
    {/* 🔐 ONBOARDING FUNCIONÁRIOS - Acesso Separado (v10.4.2) */}
    <Route path="/primeiro-acesso-funcionario" element={<PrimeiroAcessoFuncionario />} />
    
    {/* 🛡️ SECURITY GATES */}
    <Route path="/security/device-limit" element={<DeviceLimitGate />} />
    <Route path="/security/same-type-replacement" element={<SameTypeReplacementGate />} />
    
    {/* 📱 QR CODE RESOLVER - Legacy QR Codes from printed materials */}
    <Route path="/qr" element={<QRCodeResolverPage />} />

    {/* ===== LANDING PAGES FRAGMENTADAS (v2.0) ===== */}
    {/* 🏆 Aprovados - Cases de Sucesso */}
    <Route path="/aprovados" element={<Aprovados />} />
    
    {/* 👨‍🏫 Sobre o Professor */}
    <Route path="/sobre" element={<Sobre />} />
    
    {/* 📖 Metodologia - Features e Materiais */}
    <Route path="/metodologia" element={<Metodologia />} />
    
    {/* 🎓 Cursos e Trilhas */}
    <Route path="/cursos" element={<CursosPage />} />
    
    {/* 💬 Depoimentos e Feedbacks */}
    <Route path="/depoimentos" element={<Depoimentos />} />
    
    {/* ❓ FAQ - Perguntas Frequentes */}
    <Route path="/faq" element={<FAQ />} />
    
    {/* 🎬 Vídeo de Apresentação */}
    <Route path="/apresentacao" element={<Apresentacao />} />
    
    {/* 📱 App Exclusivo */}
    <Route path="/app" element={<AppPage />} />
    
    {/* 📊 Estatísticas em Tempo Real */}
    <Route path="/estatisticas" element={<Estatisticas />} />
    
    {/* 🚀 Matrícula - CTA Final */}
    <Route path="/matricula" element={<Matricula />} />
  </>
);
