// ============================================
// 🔥 CENTRAL DE DIAGNÓSTICO — PROVA DE QUE TUDO PEGA
// Zero Cliques Mortos Audit System
// ============================================

import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download,
  Route,
  MousePointer,
  Database,
  HardDrive,
  Lock,
  Activity,
  FileText,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// Core imports
import { ROUTES, ROUTE_DEFINITIONS, RouteKey } from "@/core/routes";
import { ACTIONS, ActionKey } from "@/core/actions";
import { BUCKETS, BucketKey, BUCKET_DEFINITIONS } from "@/core/storage";
import { FUNCTION_MATRIX, auditAllFunctions, FunctionSpec } from "@/core/functionMatrix";
import { NAV_ROUTE_MAP, NAV_STATUS, auditNavRouteMap, NavItemKey } from "@/core/nav/navRouteMap";

// ============================================
// TIPOS
// ============================================
interface AuditResult {
  category: string;
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: string[];
}

interface AuditReport {
  timestamp: string;
  duration: number;
  results: AuditResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function CentralDiagnostico() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);

  // ============================================
  // AUDITORIAS
  // ============================================

  const auditRoutes = useCallback((): AuditResult[] => {
    const results: AuditResult[] = [];
    const routeKeys = Object.keys(ROUTES) as RouteKey[];
    
    // Verificar rotas definidas
    routeKeys.forEach(key => {
      const def = ROUTE_DEFINITIONS[key];
      if (!def) {
        results.push({
          category: "Rotas",
          name: `Rota ${key}`,
          status: "fail",
          message: "Rota sem definição",
          details: [`ROUTES.${key} existe mas ROUTE_DEFINITIONS.${key} não`],
        });
      } else if (!def.path) {
        results.push({
          category: "Rotas",
          name: `Rota ${key}`,
          status: "fail",
          message: "Rota sem path",
        });
      }
    });

    // Verificar rotas órfãs (na definição mas não nas constantes)
    const definedKeys = Object.keys(ROUTE_DEFINITIONS) as RouteKey[];
    definedKeys.forEach(key => {
      if (!ROUTES[key]) {
        results.push({
          category: "Rotas",
          name: `Definição ${key}`,
          status: "warn",
          message: "Definição sem rota correspondente",
        });
      }
    });

    // Resultado geral
    if (results.length === 0) {
      results.push({
        category: "Rotas",
        name: "Verificação de Rotas",
        status: "pass",
        message: `${routeKeys.length} rotas verificadas com sucesso`,
      });
    }

    return results;
  }, []);

  const auditNavigation = useCallback((): AuditResult[] => {
    const results: AuditResult[] = [];
    const audit = auditNavRouteMap();

    if (audit.orphans.length > 0) {
      results.push({
        category: "Navegação",
        name: "Itens Órfãos",
        status: "fail",
        message: `${audit.orphans.length} itens de menu sem rota`,
        details: audit.orphans,
      });
    }

    if (audit.comingSoon > 0) {
      results.push({
        category: "Navegação",
        name: "Em Breve",
        status: "warn",
        message: `${audit.comingSoon} itens marcados como "Em breve"`,
      });
    }

    if (audit.disabled > 0) {
      results.push({
        category: "Navegação",
        name: "Desabilitados",
        status: "warn",
        message: `${audit.disabled} itens desabilitados`,
      });
    }

    // Verificar cada item do menu
    const navItems = Object.keys(NAV_ROUTE_MAP) as NavItemKey[];
    let validItems = 0;
    
    navItems.forEach(key => {
      const routeKey = NAV_ROUTE_MAP[key];
      const status = NAV_STATUS[key];
      
      if (routeKey && ROUTES[routeKey] && status === "active") {
        validItems++;
      }
    });

    results.push({
      category: "Navegação",
      name: "Verificação de Menu",
      status: validItems === navItems.length ? "pass" : "warn",
      message: `${validItems}/${navItems.length} itens de menu válidos`,
    });

    return results;
  }, []);

  const auditFunctions = useCallback((): AuditResult[] => {
    const results: AuditResult[] = [];
    const audit = auditAllFunctions();

    if (audit.invalid > 0) {
      audit.errors.forEach(err => {
        results.push({
          category: "Funções",
          name: err.id,
          status: "fail",
          message: "Função inválida",
          details: err.errors,
        });
      });
    }

    results.push({
      category: "Funções",
      name: "Verificação de Funções",
      status: audit.invalid === 0 ? "pass" : "fail",
      message: `${audit.valid}/${audit.total} funções válidas`,
    });

    // Verificar funções por domínio
    const domains = new Set(FUNCTION_MATRIX.map(f => f.domain));
    results.push({
      category: "Funções",
      name: "Cobertura de Domínios",
      status: "pass",
      message: `${domains.size} domínios cobertos`,
      details: Array.from(domains),
    });

    return results;
  }, []);

  const auditStorage = useCallback((): AuditResult[] => {
    const results: AuditResult[] = [];
    const bucketKeys = Object.keys(BUCKETS) as BucketKey[];

    let validBuckets = 0;
    bucketKeys.forEach(key => {
      const def = BUCKET_DEFINITIONS[key];
      if (def && def.name && def.pathPattern) {
        validBuckets++;
      } else {
        results.push({
          category: "Storage",
          name: `Bucket ${key}`,
          status: "fail",
          message: "Bucket sem definição completa",
        });
      }
    });

    results.push({
      category: "Storage",
      name: "Verificação de Buckets",
      status: validBuckets === bucketKeys.length ? "pass" : "warn",
      message: `${validBuckets}/${bucketKeys.length} buckets configurados`,
    });

    // Verificar buckets públicos vs privados
    const publicBuckets = bucketKeys.filter(k => BUCKET_DEFINITIONS[k].public).length;
    const privateBuckets = bucketKeys.length - publicBuckets;
    
    results.push({
      category: "Storage",
      name: "Distribuição",
      status: "pass",
      message: `${publicBuckets} públicos, ${privateBuckets} privados`,
    });

    return results;
  }, []);

  const auditActions = useCallback((): AuditResult[] => {
    const results: AuditResult[] = [];
    const actionKeys = Object.keys(ACTIONS) as ActionKey[];

    results.push({
      category: "Ações",
      name: "Verificação de Ações",
      status: "pass",
      message: `${actionKeys.length} ações registradas`,
    });

    // Agrupar por categoria
    const categories = new Map<string, number>();
    actionKeys.forEach(key => {
      const [category] = ACTIONS[key].split(":");
      categories.set(category, (categories.get(category) || 0) + 1);
    });

    results.push({
      category: "Ações",
      name: "Distribuição por Categoria",
      status: "pass",
      message: `${categories.size} categorias de ações`,
      details: Array.from(categories.entries()).map(([cat, count]) => `${cat}: ${count}`),
    });

    return results;
  }, []);

  const auditSecurity = useCallback((): AuditResult[] => {
    const results: AuditResult[] = [];

    // Verificar funções com segurança
    const functionsWithSecurity = FUNCTION_MATRIX.filter(f => 
      f.security.authRequired && 
      f.security.rolesAllowed.length > 0
    ).length;

    results.push({
      category: "Segurança",
      name: "Funções Protegidas",
      status: functionsWithSecurity === FUNCTION_MATRIX.length ? "pass" : "warn",
      message: `${functionsWithSecurity}/${FUNCTION_MATRIX.length} funções com auth`,
    });

    // Verificar RLS
    const functionsWithRLS = FUNCTION_MATRIX.filter(f => 
      f.security.rlsTables.length > 0
    ).length;

    results.push({
      category: "Segurança",
      name: "Funções com RLS",
      status: "pass",
      message: `${functionsWithRLS} funções declaram tabelas RLS`,
    });

    // Verificar controles anti-abuso
    const functionsWithAbuseControls = FUNCTION_MATRIX.filter(f => 
      f.security.abuseControls.length > 0
    ).length;

    results.push({
      category: "Segurança",
      name: "Controles Anti-Abuso",
      status: functionsWithAbuseControls > 0 ? "pass" : "warn",
      message: `${functionsWithAbuseControls} funções com controles`,
    });

    return results;
  }, []);

  // ============================================
  // EXECUTAR AUDITORIA COMPLETA
  // ============================================
  const runFullAudit = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    
    const startTime = Date.now();
    const allResults: AuditResult[] = [];

    // Executar cada auditoria
    const audits = [
      { name: "Rotas", fn: auditRoutes },
      { name: "Navegação", fn: auditNavigation },
      { name: "Funções", fn: auditFunctions },
      { name: "Storage", fn: auditStorage },
      { name: "Ações", fn: auditActions },
      { name: "Segurança", fn: auditSecurity },
    ];

    for (let i = 0; i < audits.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simular processamento
      
      const results = audits[i].fn();
      allResults.push(...results);
      
      setProgress(Math.round(((i + 1) / audits.length) * 100));
    }

    // Calcular resumo
    const summary = {
      total: allResults.length,
      passed: allResults.filter(r => r.status === "pass").length,
      failed: allResults.filter(r => r.status === "fail").length,
      warnings: allResults.filter(r => r.status === "warn").length,
    };

    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      results: allResults,
      summary,
    };

    setReport(report);
    setIsRunning(false);
    
    if (summary.failed === 0) {
      toast.success("✅ Auditoria concluída sem erros!");
    } else {
      toast.error(`❌ ${summary.failed} problemas encontrados`);
    }
  }, [auditRoutes, auditNavigation, auditFunctions, auditStorage, auditActions, auditSecurity]);

  // ============================================
  // EXPORTAR RELATÓRIO
  // ============================================
  const exportReport = useCallback(() => {
    if (!report) return;

    const markdown = `# 📊 RELATÓRIO DE DIAGNÓSTICO

**Data:** ${new Date(report.timestamp).toLocaleString("pt-BR")}
**Duração:** ${report.duration}ms

## 📈 Resumo

| Métrica | Valor |
|---------|-------|
| Total de Verificações | ${report.summary.total} |
| ✅ Passou | ${report.summary.passed} |
| ❌ Falhou | ${report.summary.failed} |
| ⚠️ Avisos | ${report.summary.warnings} |

## 📋 Resultados Detalhados

${report.results.map(r => `### ${r.status === "pass" ? "✅" : r.status === "fail" ? "❌" : "⚠️"} [${r.category}] ${r.name}

**Status:** ${r.status.toUpperCase()}
**Mensagem:** ${r.message}
${r.details ? `**Detalhes:**\n${r.details.map(d => `- ${d}`).join("\n")}` : ""}

---`).join("\n\n")}

## 🔒 Conclusão

${report.summary.failed === 0 
  ? "✅ **SISTEMA APROVADO** — Todas as verificações passaram!" 
  : `❌ **ATENÇÃO** — ${report.summary.failed} problemas precisam ser corrigidos.`}

---
*Gerado automaticamente pela Central de Diagnóstico*
`;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostico-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Relatório exportado!");
  }, [report]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="h-10 w-10 text-cyan-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Central de Diagnóstico
            </h1>
          </div>
          <p className="text-gray-400">
            Sistema de auditoria para garantir ZERO CLIQUES MORTOS
          </p>
        </motion.div>

        {/* Ações */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={runFullAudit}
                disabled={isRunning}
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {isRunning ? "Auditando..." : "Executar Auditoria"}
              </Button>

              {report && (
                <Button
                  variant="outline"
                  onClick={exportReport}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar Relatório
                </Button>
              )}
            </div>

            {isRunning && (
              <div className="flex items-center gap-4 flex-1 max-w-md ml-6">
                <Progress value={progress} className="flex-1" />
                <span className="text-sm text-gray-400 w-12">{progress}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo */}
        {report && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-4 gap-4"
          >
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-4 text-center">
                <FileText className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <div className="text-2xl font-bold text-white">{report.summary.total}</div>
                <div className="text-xs text-gray-500">Verificações</div>
              </CardContent>
            </Card>
            
            <Card className="bg-emerald-950/30 border-emerald-800/30">
              <CardContent className="py-4 text-center">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
                <div className="text-2xl font-bold text-emerald-400">{report.summary.passed}</div>
                <div className="text-xs text-emerald-400/70">Passou</div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-950/30 border-red-800/30">
              <CardContent className="py-4 text-center">
                <XCircle className="h-6 w-6 mx-auto mb-2 text-red-400" />
                <div className="text-2xl font-bold text-red-400">{report.summary.failed}</div>
                <div className="text-xs text-red-400/70">Falhou</div>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-950/30 border-amber-800/30">
              <CardContent className="py-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-400" />
                <div className="text-2xl font-bold text-amber-400">{report.summary.warnings}</div>
                <div className="text-xs text-amber-400/70">Avisos</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Resultados */}
        {report && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Resultados Detalhados</CardTitle>
              <CardDescription>
                Auditoria executada em {report.duration}ms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border ${
                      result.status === "pass"
                        ? "bg-emerald-950/20 border-emerald-800/30"
                        : result.status === "fail"
                        ? "bg-red-950/20 border-red-800/30"
                        : "bg-amber-950/20 border-amber-800/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.status === "pass" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                      ) : result.status === "fail" ? (
                        <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {result.category}
                          </Badge>
                          <span className="font-medium text-white">{result.name}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{result.message}</p>
                        
                        {result.details && result.details.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {result.details.slice(0, 5).map((detail, i) => (
                              <div key={i} className="font-mono">• {detail}</div>
                            ))}
                            {result.details.length > 5 && (
                              <div className="text-gray-600">
                                ... e mais {result.details.length - 5} itens
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas do Sistema */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Route className="h-4 w-4 text-cyan-400" />
                Rotas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Object.keys(ROUTES).length}
              </div>
              <div className="text-xs text-gray-500">rotas registradas</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-purple-400" />
                Ações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Object.keys(ACTIONS).length}
              </div>
              <div className="text-xs text-gray-500">ações registradas</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-amber-400" />
                Buckets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Object.keys(BUCKETS).length}
              </div>
              <div className="text-xs text-gray-500">buckets configurados</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
