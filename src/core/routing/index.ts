// ============================================
// 🗺️ CORE/ROUTING — Rotas Desacopladas
// Import direto: import { ROUTES, getRoute } from "@/core/routing"
// ============================================

export {
  ROUTES,
  ROUTE_DEFINITIONS,
  getRoute,
  getRouteWithParams,
  canAccessRoute,
  getRouteDefinition,
  getRouteKeysByDomain,
  getRedirectUrl,
  isValidRoute,
  type RouteKey,
  type RouteDefinition,
  type RouteDomain,
} from "../routes";

export { default } from "../routes";
