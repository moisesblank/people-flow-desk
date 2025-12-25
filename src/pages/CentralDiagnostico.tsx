// ============================================
// 🔬 CENTRAL DE DIAGNÓSTICO OMEGA v4.0
// Monitor completo + Sistema de Auditoria Zero Cliques Mortos
// Owner Only - Visão Total
// ============================================

import React, { useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Stethoscope, 
  Database, 
  Webhook, 
  Server, 
  Shield, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Zap,
  HardDrive,
  Brain,
  AlertTriangle,
  Route,
  MousePointer,
  Download,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Core imports
import { ROUTES, ROUTE_DEFINITIONS, RouteKey } from "@/core/routes";
import { ACTIONS, ActionKey } from "@/core/actions";
import { BUCKETS, BucketKey, BUCKET_DEFINITIONS } from "@/core/storage";
import { FUNCTION_MATRIX, auditAllFunctions } from "@/core/functionMatrix";
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
const CentralDiagnostico = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);

  // ============================================
  // QUERIES - MONITORAMENTO EM TEMPO REAL
  // ============================================

  // Status geral do sistema
  const { data: systemStatus, refetch: refetchSystem, isLoading: loadingSystem } = useQuery({
    queryKey: ['diagnostico-system-status'],
    queryFn: async () => {
      const checks = { database: false, auth: false, storage: false, functions: false };

      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      checks.database = !dbError;

      const { data: { user } } = await supabase.auth.getUser();
      checks.auth = !!user;

      const { data: buckets } = await supabase.storage.listBuckets();
      checks.storage = !!buckets && buckets.length > 0;

      try {
        const response = await supabase.functions.invoke('sna-gateway', { body: { action: 'health' } });
        checks.functions = !response.error;
      } catch {
        checks.functions = false;
      }

      return checks;
    },
    refetchInterval: 60000 // ⚡ DOGMA V.5K: 60s (de 30s)
  });

  // Webhooks recentes
  const { data: webhookStats } = useQuery({
    queryKey: ['diagnostico-webhooks'],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('integration_events')
        .select('id, event_type, source, processed, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      const { count: totalToday } = await supabase
        .from('integration_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { count: processedToday } = await supabase
        .from('integration_events')
        .select('id', { count: 'exact', head: true })
        .eq('processed', true)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const total = totalToday || 0;
      const processed = processedToday || 0;
      
      return {
        recent: events || [],
        totalToday: total,
        processedToday: processed,
        successRate: total > 0 ? Math.round((processed / total) * 100) : 100
      };
    },
    refetchInterval: 60000 // ⚡ DOGMA V.5K: 60s (de 15s)
  });

  // SNA Jobs status
  const { data: snaStatus } = useQuery({
    queryKey: ['diagnostico-sna'],
    queryFn: async () => {
      const { data: jobsData } = await supabase
        .from('sna_jobs')
        .select('id, job_type, status, priority, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      const { count: pending } = await supabase
        .from('sna_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: processing } = await supabase
        .from('sna_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'processing');

      const { count: failed } = await supabase
        .from('sna_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed');

      return {
        jobs: jobsData || [],
        pending: pending || 0,
        processing: processing || 0,
        failed: failed || 0
      };
    },
    refetchInterval: 60000 // ⚡ DOGMA V.5K: 60s (de 10s)
  });

  // Eventos de segurança
  const { data: securityEvents } = useQuery({
    queryKey: ['diagnostico-security'],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('security_events')
        .select('id, event_type, severity, source, description, created_at')
        .order('created_at', { ascending: false })
        .limit(30);

      const { count: criticalToday } = await supabase
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .gte('severity', 80)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      return {
        recent: events || [],
        criticalToday: criticalToday || 0
      };
    },
    refetchInterval: 60000 // ⚡ DOGMA V.5K: 60s (de 20s)
  });

  // Usuários online
  const { data: usersOnline } = useQuery({
    queryKey: ['diagnostico-users-online'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_online', true)
        .gte('last_activity_at', fiveMinutesAgo);

      return count || 0;
    },
    refetchInterval: 60000 // ⚡ DOGMA V.5K: 60s (de 30s)
  });

  // ============================================
  // AUDITORIAS - ZERO CLIQUES MORTOS
  // ============================================

  const auditRoutes = useCallback((): AuditResult[] => {
    const results: AuditResult[] = [];
    const routeKeys = Object.keys(ROUTES) as RouteKey[];
    
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

    const categories = new Map<string, number>();
    actionKeys.forEach(key => {
      const action = ACTIONS[key];
      const category = action?.category || "unknown";
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

    const functionsWithRLS = FUNCTION_MATRIX.filter(f => 
      f.security.rlsTables.length > 0
    ).length;

    results.push({
      category: "Segurança",
      name: "Funções com RLS",
      status: "pass",
      message: `${functionsWithRLS} funções declaram tabelas RLS`,
    });

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

    const audits = [
      { name: "Rotas", fn: auditRoutes },
      { name: "Navegação", fn: auditNavigation },
      { name: "Funções", fn: auditFunctions },
      { name: "Storage", fn: auditStorage },
      { name: "Ações", fn: auditActions },
      { name: "Segurança", fn: auditSecurity },
    ];

    for (let i = 0; i < audits.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const results = audits[i].fn();
      allResults.push(...results);
      setProgress(Math.round(((i + 1) / audits.length) * 100));
    }

    const summary = {
      total: allResults.length,
      passed: allResults.filter(r => r.status === "pass").length,
      failed: allResults.filter(r => r.status === "fail").length,
      warnings: allResults.filter(r => r.status === "warn").length,
    };

    const newReport: AuditReport = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      results: allResults,
      summary,
    };

    setReport(newReport);
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
*Gerado automaticamente pela Central de Diagnóstico OMEGA*
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
  // HELPERS
  // ============================================
  const handleRefreshAll = () => {
    refetchSystem();
    toast.success('Diagnóstico atualizado!');
  };

  const getStatusBadge = (processed: boolean | null) => {
    if (processed) {
      return <Badge className="gap-1 bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3" />processado</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />pendente</Badge>;
  };

  const getJobStatusBadge = (status: string) => {
    const isSuccess = status === 'completed';
    const isFailed = status === 'failed';
    const isProcessing = status === 'processing';
    
    if (isSuccess) return <Badge className="gap-1 bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3" />{status}</Badge>;
    if (isFailed) return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{status}</Badge>;
    if (isProcessing) return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3 animate-spin" />{status}</Badge>;
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{status}</Badge>;
  };

  const getSeverityColor = (severity: number | null) => {
    const sev = severity || 0;
    if (sev >= 80) return 'text-red-500 bg-red-500/10';
    if (sev >= 50) return 'text-yellow-500 bg-yellow-500/10';
    if (sev >= 20) return 'text-blue-500 bg-blue-500/10';
    return 'text-muted-foreground bg-muted';
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <Helmet>
        <title>Central de Diagnóstico OMEGA | Gestão Moisés Medeiros</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/20">
                <Shield className="h-8 w-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Central de Diagnóstico OMEGA
                </h1>
                <p className="text-gray-400">Zero Cliques Mortos • Monitoramento Completo</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleRefreshAll} disabled={loadingSystem} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingSystem ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
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
                {isRunning ? "Auditando..." : "Auditoria Completa"}
              </Button>
              {report && (
                <Button variant="outline" onClick={exportReport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              )}
            </div>
          </motion.div>

          {/* Progress */}
          {isRunning && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <Progress value={progress} className="flex-1" />
                  <span className="text-sm text-gray-400 w-12">{progress}%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Database className={`h-5 w-5 ${systemStatus?.database ? 'text-green-500' : 'text-red-500'}`} />
                  <div>
                    <p className="text-xs text-gray-400">Database</p>
                    <p className="font-semibold text-white">{systemStatus?.database ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Shield className={`h-5 w-5 ${systemStatus?.auth ? 'text-green-500' : 'text-red-500'}`} />
                  <div>
                    <p className="text-xs text-gray-400">Auth</p>
                    <p className="font-semibold text-white">{systemStatus?.auth ? 'Ativo' : 'Inativo'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <HardDrive className={`h-5 w-5 ${systemStatus?.storage ? 'text-green-500' : 'text-red-500'}`} />
                  <div>
                    <p className="text-xs text-gray-400">Storage</p>
                    <p className="font-semibold text-white">{systemStatus?.storage ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Zap className={`h-5 w-5 ${systemStatus?.functions ? 'text-green-500' : 'text-yellow-500'}`} />
                  <div>
                    <p className="text-xs text-gray-400">Functions</p>
                    <p className="font-semibold text-white">{systemStatus?.functions ? 'Ativas' : 'Verificando'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-400">Online</p>
                    <p className="font-semibold text-white">{usersOnline || 0} usuários</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${(securityEvents?.criticalToday || 0) > 0 ? 'text-red-500' : 'text-green-500'}`} />
                  <div>
                    <p className="text-xs text-gray-400">Alertas</p>
                    <p className="font-semibold text-white">{securityEvents?.criticalToday || 0} críticos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audit Report Summary */}
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

          {/* Tabs */}
          <Tabs defaultValue="audit" className="space-y-4">
            <TabsList className="bg-slate-900/50">
              <TabsTrigger value="audit" className="gap-2"><Stethoscope className="h-4 w-4" />Auditoria</TabsTrigger>
              <TabsTrigger value="webhooks" className="gap-2"><Webhook className="h-4 w-4" />Webhooks</TabsTrigger>
              <TabsTrigger value="sna" className="gap-2"><Brain className="h-4 w-4" />SNA Jobs</TabsTrigger>
              <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" />Segurança</TabsTrigger>
            </TabsList>

            {/* Audit Tab */}
            <TabsContent value="audit">
              {report ? (
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle>Resultados Detalhados</CardTitle>
                    <CardDescription>
                      Auditoria executada em {report.duration}ms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
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
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-900/50 border-slate-800 border-dashed">
                  <CardContent className="py-16 text-center">
                    <Stethoscope className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Nenhuma auditoria executada</h3>
                    <p className="text-gray-400 mb-4">
                      Clique em "Auditoria Completa" para verificar o sistema
                    </p>
                    <Button onClick={runFullAudit} className="gap-2">
                      <Zap className="h-4 w-4" />
                      Iniciar Auditoria
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Webhook className="h-5 w-5" />Eventos de Webhook
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{webhookStats?.totalToday || 0} hoje</Badge>
                      <Badge variant={webhookStats?.successRate === 100 ? "default" : "secondary"}>
                        {webhookStats?.successRate || 100}% processados
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {webhookStats?.recent?.map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between p-3 border border-slate-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Server className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-sm text-white">{event.event_type}</p>
                              <p className="text-xs text-gray-500">{event.source}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(event.processed)}
                            <span className="text-xs text-gray-500">
                              {format(new Date(event.created_at), 'HH:mm:ss', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!webhookStats?.recent || webhookStats.recent.length === 0) && (
                        <p className="text-center text-gray-500 py-8">Nenhum evento recente</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SNA Jobs Tab */}
            <TabsContent value="sna">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5" />SNA Jobs Queue
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{snaStatus?.pending || 0} pendentes</Badge>
                      <Badge variant="secondary">{snaStatus?.processing || 0} processando</Badge>
                      {(snaStatus?.failed || 0) > 0 && <Badge variant="destructive">{snaStatus?.failed || 0} falhas</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {snaStatus?.jobs?.map((job: any) => (
                        <div key={job.id} className="flex items-center justify-between p-3 border border-slate-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Zap className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-sm text-white">{job.job_type}</p>
                              <p className="text-xs text-gray-500">Prioridade: {job.priority}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getJobStatusBadge(job.status)}
                            <span className="text-xs text-gray-500">
                              {format(new Date(job.created_at), 'HH:mm:ss', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!snaStatus?.jobs || snaStatus.jobs.length === 0) && (
                        <p className="text-center text-gray-500 py-8">Nenhum job na fila</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />Eventos de Segurança
                    </CardTitle>
                    {(securityEvents?.criticalToday || 0) > 0 && (
                      <Badge variant="destructive">{securityEvents?.criticalToday} críticos hoje</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {securityEvents?.recent?.map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between p-3 border border-slate-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${getSeverityColor(event.severity)}`}>
                              <Activity className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-white">{event.event_type}</p>
                              <p className="text-xs text-gray-500">{event.description || event.source}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">Sev: {event.severity || 0}</Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(event.created_at), 'HH:mm:ss', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!securityEvents?.recent || securityEvents.recent.length === 0) && (
                        <p className="text-center text-gray-500 py-8">Nenhum evento de segurança</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* System Stats */}
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
    </>
  );
};

export default CentralDiagnostico;
