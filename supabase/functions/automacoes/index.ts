import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ==============================================================================
// TRAMON V8: AUTOMAÇÕES INTELIGENTES EXPANDIDAS
// ==============================================================================

type AutomationType = 
  | "novo_aluno" | "venda_realizada" | "comissao_gerada" | "tarefa_criada" 
  | "relatorio_semanal" | "alerta_financeiro"
  | "daily_report" | "weekly_report" | "sync_metrics" | "audit_groups" 
  | "cleanup_logs" | "backup_data" | "process_queue";

interface AutomationRequest {
  tipo: AutomationType;
  dados?: Record<string, unknown>;
  force?: boolean;
}

async function notificarOwner(mensagem: string, tipo: string = "info") {
  try {
    await supabase.from("notifications").insert({
      title: tipo === "venda" ? "💰 Nova Venda!" : tipo === "aluno" ? "🎓 Novo Aluno!" : "📢 Notificação",
      message: mensagem,
      type: tipo,
      read: false,
      created_at: new Date().toISOString()
    });
    
    console.log(`[AUTOMAÇÃO] Notificação criada: ${mensagem}`);
    return true;
  } catch (error) {
    console.error("[AUTOMAÇÃO] Erro ao criar notificação:", error);
    return false;
  }
}

async function registrarAuditoria(acao: string, detalhes: Record<string, unknown>) {
  try {
    await supabase.from("audit_logs").insert({
      action: acao,
      metadata: detalhes,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("[AUTOMAÇÃO] Erro ao registrar auditoria:", error);
  }
}

async function logIntegracao(operacao: string, dados: Record<string, unknown>, status: string = 'success') {
  try {
    await supabase.from('logs_integracao_detalhado').insert({
      sistema_origem: 'automacao',
      sistema_destino: 'sistema',
      tipo_operacao: operacao,
      dados_saida: dados,
      status
    });
  } catch (error) {
    console.error("[AUTOMAÇÃO] Erro ao registrar log:", error);
  }
}

async function processarNovoAluno(dados: Record<string, unknown>) {
  const { nome, email, valor } = dados;
  
  console.log(`[AUTOMAÇÃO] Processando novo aluno: ${nome}`);
  
  await notificarOwner(
    `Novo aluno cadastrado: ${nome} (${email}) - R$ ${(valor as number)?.toFixed(2) || '0,00'}`,
    "aluno"
  );
  
  await registrarAuditoria("automacao_novo_aluno", { nome, email, valor });
  
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("metricas_diarias").upsert({
    data: today,
    tipo_metrica: "novos_alunos",
    valor_numerico: 1,
    dados_json: { nome, email },
    fonte: "automacao"
  }, { onConflict: "data,tipo_metrica" });
  
  return { success: true, message: `Aluno ${nome} processado com sucesso` };
}

async function processarVendaRealizada(dados: Record<string, unknown>) {
  const { valor, aluno, transacao } = dados;
  
  console.log(`[AUTOMAÇÃO] Processando venda: R$ ${valor}`);
  
  await notificarOwner(
    `Nova venda realizada! R$ ${(valor as number)?.toFixed(2)} - Cliente: ${aluno || 'N/A'}`,
    "venda"
  );
  
  await registrarAuditoria("automacao_venda", { valor, aluno, transacao });
  
  return { success: true, message: `Venda de R$ ${valor} processada` };
}

async function processarComissaoGerada(dados: Record<string, unknown>) {
  const { afiliado_id, valor, aluno } = dados;
  
  console.log(`[AUTOMAÇÃO] Processando comissão: R$ ${valor} para afiliado ${afiliado_id}`);
  
  const { data: afiliado } = await supabase
    .from("affiliates")
    .select("nome, email")
    .eq("id", afiliado_id)
    .single();
  
  await notificarOwner(
    `Comissão gerada: R$ ${(valor as number)?.toFixed(2)} para ${afiliado?.nome || 'Afiliado'} (venda: ${aluno || 'N/A'})`,
    "comissao"
  );
  
  await registrarAuditoria("automacao_comissao", { afiliado_id, valor, afiliado_nome: afiliado?.nome });
  
  return { success: true, message: `Comissão de R$ ${valor} processada` };
}

async function gerarRelatorioSemanal() {
  console.log("[AUTOMAÇÃO] Gerando relatório semanal...");
  
  const umaSemanaAtras = new Date();
  umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
  
  const [entradasResult, alunosResult, afiliadosResult, gastosResult] = await Promise.all([
    supabase.from("entradas").select("valor").gte("created_at", umaSemanaAtras.toISOString()),
    supabase.from("alunos").select("id").gte("created_at", umaSemanaAtras.toISOString()),
    supabase.from("affiliates").select("id").gte("created_at", umaSemanaAtras.toISOString()),
    supabase.from("gastos").select("valor").gte("created_at", umaSemanaAtras.toISOString())
  ]);
  
  const receitaSemana = entradasResult.data?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;
  const despesaSemana = gastosResult.data?.reduce((sum, g) => sum + (g.valor || 0), 0) || 0;
  const novosAlunos = alunosResult.data?.length || 0;
  const novosAfiliados = afiliadosResult.data?.length || 0;
  const lucro = receitaSemana - despesaSemana;
  
  const relatorio = `📊 RELATÓRIO SEMANAL TRAMON v8

💰 Receita: R$ ${receitaSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
💸 Despesas: R$ ${despesaSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📈 Lucro: R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
👨‍🎓 Novos alunos: ${novosAlunos}
🤝 Novos afiliados: ${novosAfiliados}

Período: ${umaSemanaAtras.toLocaleDateString('pt-BR')} a ${new Date().toLocaleDateString('pt-BR')}`;

  await notificarOwner(relatorio, "relatorio");
  
  // Salvar relatório no banco
  await supabase.from('relatorios_gerados').insert({
    tipo_relatorio: 'semanal',
    titulo: `Relatório Semanal - ${new Date().toLocaleDateString('pt-BR')}`,
    conteudo_json: {
      receita: receitaSemana,
      despesa: despesaSemana,
      lucro,
      novos_alunos: novosAlunos,
      novos_afiliados: novosAfiliados
    },
    status: 'gerado'
  });
  
  await registrarAuditoria("automacao_relatorio_semanal", {
    receita: receitaSemana,
    despesa: despesaSemana,
    lucro,
    novos_alunos: novosAlunos,
    novos_afiliados: novosAfiliados
  });
  
  return { success: true, relatorio, receita: receitaSemana, despesa: despesaSemana, lucro, alunos: novosAlunos, afiliados: novosAfiliados };
}

async function verificarAlertasFinanceiros() {
  console.log("[AUTOMAÇÃO] Verificando alertas financeiros...");
  
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  
  const [entradasResult, gastosResult] = await Promise.all([
    supabase.from("entradas").select("valor").gte("data", inicioMes.toISOString()),
    supabase.from("gastos").select("valor").gte("data", inicioMes.toISOString())
  ]);
  
  const receitaMes = entradasResult.data?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;
  const despesaMes = gastosResult.data?.reduce((sum, g) => sum + (g.valor || 0), 0) || 0;
  const saldo = receitaMes - despesaMes;
  
  const alertas: string[] = [];
  
  if (despesaMes > receitaMes * 0.8) {
    alertas.push(`⚠️ ALERTA: Despesas (R$ ${despesaMes.toLocaleString('pt-BR')}) estão acima de 80% da receita!`);
  }
  
  if (saldo < 0) {
    alertas.push(`🚨 CRÍTICO: Saldo negativo no mês: R$ ${saldo.toLocaleString('pt-BR')}`);
  }
  
  if (receitaMes < 1000) {
    alertas.push(`📉 ATENÇÃO: Receita do mês abaixo de R$ 1.000`);
  }
  
  for (const alerta of alertas) {
    await notificarOwner(alerta, "alerta");
  }
  
  return { success: true, alertas, receita: receitaMes, despesa: despesaMes, saldo };
}

// ============== NOVAS AUTOMAÇÕES TRAMON v8 ==============

async function gerarRelatorioDiario() {
  console.log('📊 Gerando relatório diário...');
  
  const hoje = new Date().toISOString().split('T')[0];
  
  const [entradas, gastos, alunos, tarefas] = await Promise.all([
    supabase.from('entradas').select('valor').gte('data', hoje),
    supabase.from('gastos').select('valor').gte('data', hoje),
    supabase.from('alunos').select('id').gte('created_at', hoje),
    supabase.from('calendar_tasks').select('id, is_completed').eq('task_date', hoje)
  ]);

  const totalEntradas = entradas.data?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;
  const totalGastos = gastos.data?.reduce((sum, g) => sum + (g.valor || 0), 0) || 0;
  const tarefasConcluidas = tarefas.data?.filter(t => t.is_completed).length || 0;
  const tarefasTotal = tarefas.data?.length || 0;

  await supabase.from('metricas_diarias').upsert({
    data: hoje,
    tipo_metrica: 'resumo_diario',
    valor_numerico: totalEntradas - totalGastos,
    dados_json: {
      entradas: totalEntradas,
      gastos: totalGastos,
      lucro: totalEntradas - totalGastos,
      novos_alunos: alunos.data?.length || 0,
      tarefas_concluidas: tarefasConcluidas,
      tarefas_total: tarefasTotal
    },
    fonte: 'automacao_diaria'
  }, { onConflict: 'data,tipo_metrica' });

  await supabase.from('relatorios_gerados').insert({
    tipo_relatorio: 'diario',
    titulo: `Relatório Diário - ${hoje}`,
    conteudo_json: {
      data: hoje,
      financeiro: { entradas: totalEntradas, gastos: totalGastos, lucro: totalEntradas - totalGastos },
      alunos: { novos: alunos.data?.length || 0 },
      produtividade: { tarefas_concluidas: tarefasConcluidas, tarefas_total: tarefasTotal }
    },
    status: 'gerado'
  });

  await logIntegracao('daily_report', { data: hoje, entradas: totalEntradas, gastos: totalGastos });

  return {
    success: true,
    tipo: 'daily_report',
    data: hoje,
    metricas: { entradas: totalEntradas, gastos: totalGastos, lucro: totalEntradas - totalGastos }
  };
}

async function syncMetricas() {
  console.log('🔄 Sincronizando métricas de redes sociais...');
  
  const syncTasks = [
    supabase.functions.invoke('youtube-sync', { body: {} }).catch(() => ({ error: true })),
    supabase.functions.invoke('instagram-sync', { body: {} }).catch(() => ({ error: true })),
    supabase.functions.invoke('facebook-ads-sync', { body: {} }).catch(() => ({ error: true })),
    supabase.functions.invoke('google-analytics-sync', { body: {} }).catch(() => ({ error: true }))
  ];

  const results = await Promise.allSettled(syncTasks);
  
  const syncStatus = {
    youtube: results[0].status === 'fulfilled' && !(results[0].value as Record<string, unknown>).error,
    instagram: results[1].status === 'fulfilled' && !(results[1].value as Record<string, unknown>).error,
    facebook: results[2].status === 'fulfilled' && !(results[2].value as Record<string, unknown>).error,
    analytics: results[3].status === 'fulfilled' && !(results[3].value as Record<string, unknown>).error
  };

  await logIntegracao('sync_metrics', syncStatus);

  return { success: true, tipo: 'sync_metrics', status: syncStatus };
}

async function auditGroups() {
  console.log('🔍 Auditando grupos WordPress...');
  
  try {
    const { data: auditResult } = await supabase.functions.invoke('wordpress-api', {
      body: { action: 'audit_discrepancies' }
    });

    await logIntegracao('audit_groups', auditResult || {});
    return { success: true, tipo: 'audit_groups', audit: auditResult };
  } catch (error) {
    console.error('Erro na auditoria:', error);
    return { success: false, tipo: 'audit_groups', error: 'Falha na auditoria' };
  }
}

async function cleanupLogs() {
  console.log('🧹 Limpando logs antigos...');
  
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
  const dataLimite = trintaDiasAtras.toISOString();

  const { error: logsError } = await supabase
    .from('logs_integracao_detalhado')
    .delete()
    .lt('created_at', dataLimite);

  const { error: webhooksError } = await supabase
    .from('webhooks_queue')
    .delete()
    .eq('status', 'processed')
    .lt('processed_at', dataLimite);

  const logsRemovidos = logsError ? 0 : 1;
  const webhooksRemovidos = webhooksError ? 0 : 1;

  await logIntegracao('cleanup_logs', { logs_cleaned: !logsError, webhooks_cleaned: !webhooksError });

  return {
    success: true,
    tipo: 'cleanup_logs',
    message: 'Logs antigos removidos com sucesso'
  };
}

async function backupData() {
  console.log('💾 Executando backup de dados...');
  
  try {
    const { data: backupResult } = await supabase.functions.invoke('backup-data', {
      body: { full: true }
    });

    await logIntegracao('backup_data', backupResult || {});
    return { success: true, tipo: 'backup_data', backup: backupResult };
  } catch (error) {
    console.error('Erro no backup:', error);
    return { success: false, tipo: 'backup_data', error: 'Falha no backup' };
  }
}

async function processQueue() {
  console.log('⚡ Processando fila de webhooks...');
  
  const { data: pendentes } = await supabase
    .from('webhooks_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  let processados = 0;
  let erros = 0;

  for (const webhook of pendentes || []) {
    try {
      await supabase.functions.invoke('orchestrator', {
        body: {
          source: webhook.source,
          event_type: webhook.event_type,
          payload: webhook.payload,
          webhook_id: webhook.id
        }
      });

      await supabase
        .from('webhooks_queue')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', webhook.id);

      processados++;
    } catch (error) {
      erros++;
      await supabase
        .from('webhooks_queue')
        .update({ 
          status: 'error',
          retry_count: (webhook.retry_count || 0) + 1,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', webhook.id);
    }
  }

  await logIntegracao('process_queue', { total: pendentes?.length, processados, erros });

  return { success: true, tipo: 'process_queue', total: pendentes?.length || 0, processados, erros };
}

const handler = async (req: Request): Promise<Response> => {
  // LEI VI: CORS dinâmico via allowlist
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const startTime = Date.now();

  try {
    const body: AutomationRequest = await req.json();
    const { tipo, dados = {} } = body;

    console.log(`[AUTOMAÇÃO] Recebido: ${tipo}`);

    let resultado: Record<string, unknown>;

    switch (tipo) {
      case "novo_aluno":
        resultado = await processarNovoAluno(dados);
        break;
      case "venda_realizada":
        resultado = await processarVendaRealizada(dados);
        break;
      case "comissao_gerada":
        resultado = await processarComissaoGerada(dados);
        break;
      case "relatorio_semanal":
      case "weekly_report":
        resultado = await gerarRelatorioSemanal();
        break;
      case "alerta_financeiro":
        resultado = await verificarAlertasFinanceiros();
        break;
      case "daily_report":
        resultado = await gerarRelatorioDiario();
        break;
      case "sync_metrics":
        resultado = await syncMetricas();
        break;
      case "audit_groups":
        resultado = await auditGroups();
        break;
      case "cleanup_logs":
        resultado = await cleanupLogs();
        break;
      case "backup_data":
        resultado = await backupData();
        break;
      case "process_queue":
        resultado = await processQueue();
        break;
      default:
        resultado = { success: false, error: `Tipo de automação desconhecido: ${tipo}` };
    }

    const executionTime = Date.now() - startTime;
    console.log(`[AUTOMAÇÃO] ${tipo} concluído em ${executionTime}ms`);

    return new Response(JSON.stringify({ ...resultado, execution_time_ms: executionTime }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("[AUTOMAÇÃO] Erro:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
