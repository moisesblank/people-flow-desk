// ============================================
// 📍 ROUTES INDEX - Central de Rotas
// MIGRAÇÃO: gestao.* → /gestaofc (área interna única)
// App.tsx refatorado: 485 → ~180 linhas
// ============================================

export { publicRoutes } from "./publicRoutes";
export { comunidadeRoutes } from "./comunidadeRoutes";
export { gestaofcRoutes as gestaoRoutes } from "./gestaofcRoutes";
export { alunoRoutes } from "./alunoRoutes";
export { legacyRoutes } from "./legacyRoutes";
export { ProtectedPage, PageLoader } from "./routeHelpers";
