import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ==============================================================================
// AJUDA15: AUTOMAÇÕES INTELIGENTES
// ==============================================================================

interface AutomationRequest {
  tipo: "novo_aluno" | "venda_realizada" | "comissao_gerada" | "tarefa_criada" | "relatorio_semanal" | "alerta_financeiro";
  dados: Record<string, any>;
}

async function notificarOwner(mensagem: string, tipo: string = "info") {
  try {
    // Inserir notificação no banco
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

async function registrarAuditoria(acao: string, detalhes: Record<string, any>) {
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

async function processarNovoAluno(dados: Record<string, any>) {
  const { nome, email, valor } = dados;
  
  console.log(`[AUTOMAÇÃO] Processando novo aluno: ${nome}`);
  
  // Notificar owner
  await notificarOwner(
    `Novo aluno cadastrado: ${nome} (${email}) - R$ ${valor?.toFixed(2) || '0,00'}`,
    "aluno"
  );
  
  // Registrar auditoria
  await registrarAuditoria("automacao_novo_aluno", { nome, email, valor });
  
  // Atualizar métricas
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("synapse_metrics").upsert({
    metric_name: "daily_new_students",
    category: "alunos",
    metric_value: 1,
    metric_unit: "count",
    period: "daily",
    reference_date: today,
  }, { onConflict: "metric_name,category,reference_date" });
  
  return { success: true, message: `Aluno ${nome} processado com sucesso` };
}

async function processarVendaRealizada(dados: Record<string, any>) {
  const { valor, aluno, transacao } = dados;
  
  console.log(`[AUTOMAÇÃO] Processando venda: R$ ${valor}`);
  
  // Notificar owner
  await notificarOwner(
    `Nova venda realizada! R$ ${valor?.toFixed(2)} - Cliente: ${aluno || 'N/A'}`,
    "venda"
  );
  
  // Registrar auditoria
  await registrarAuditoria("automacao_venda", { valor, aluno, transacao });
  
  return { success: true, message: `Venda de R$ ${valor} processada` };
}

async function processarComissaoGerada(dados: Record<string, any>) {
  const { afiliado_id, valor, aluno } = dados;
  
  console.log(`[AUTOMAÇÃO] Processando comissão: R$ ${valor} para afiliado ${afiliado_id}`);
  
  // Buscar dados do afiliado
  const { data: afiliado } = await supabase
    .from("affiliates")
    .select("nome, email")
    .eq("id", afiliado_id)
    .single();
  
  // Notificar owner
  await notificarOwner(
    `Comissão gerada: R$ ${valor?.toFixed(2)} para ${afiliado?.nome || 'Afiliado'} (venda: ${aluno || 'N/A'})`,
    "comissao"
  );
  
  // Registrar auditoria
  await registrarAuditoria("automacao_comissao", { afiliado_id, valor, afiliado_nome: afiliado?.nome });
  
  return { success: true, message: `Comissão de R$ ${valor} processada` };
}

async function gerarRelatorioSemanal() {
  console.log("[AUTOMAÇÃO] Gerando relatório semanal...");
  
  // Buscar métricas da semana
  const umaSemanaAtras = new Date();
  umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
  
  const [entradasResult, alunosResult, afiliadosResult] = await Promise.all([
    supabase.from("entradas").select("valor").gte("created_at", umaSemanaAtras.toISOString()),
    supabase.from("alunos").select("id").gte("created_at", umaSemanaAtras.toISOString()),
    supabase.from("affiliates").select("id").gte("created_at", umaSemanaAtras.toISOString())
  ]);
  
  const receitaSemana = entradasResult.data?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;
  const novosAlunos = alunosResult.data?.length || 0;
  const novosAfiliados = afiliadosResult.data?.length || 0;
  
  const relatorio = `📊 RELATÓRIO SEMANAL

💰 Receita: R$ ${receitaSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
👨‍🎓 Novos alunos: ${novosAlunos}
🤝 Novos afiliados: ${novosAfiliados}

Período: ${umaSemanaAtras.toLocaleDateString('pt-BR')} a ${new Date().toLocaleDateString('pt-BR')}`;

  // Notificar owner com relatório
  await notificarOwner(relatorio, "relatorio");
  
  // Registrar auditoria
  await registrarAuditoria("automacao_relatorio_semanal", {
    receita: receitaSemana,
    novos_alunos: novosAlunos,
    novos_afiliados: novosAfiliados
  });
  
  return { success: true, relatorio, receita: receitaSemana, alunos: novosAlunos, afiliados: novosAfiliados };
}

async function verificarAlertasFinanceiros() {
  console.log("[AUTOMAÇÃO] Verificando alertas financeiros...");
  
  // Buscar dados financeiros do mês
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
  
  const alertas = [];
  
  // Alerta de despesas altas
  if (despesaMes > receitaMes * 0.8) {
    alertas.push(`⚠️ ALERTA: Despesas (R$ ${despesaMes.toLocaleString('pt-BR')}) estão acima de 80% da receita!`);
  }
  
  // Alerta de saldo negativo
  if (saldo < 0) {
    alertas.push(`🚨 CRÍTICO: Saldo negativo no mês: R$ ${saldo.toLocaleString('pt-BR')}`);
  }
  
  // Alerta de receita baixa (menos de R$ 1000 no mês)
  if (receitaMes < 1000) {
    alertas.push(`📉 ATENÇÃO: Receita do mês abaixo de R$ 1.000`);
  }
  
  // Enviar alertas se houver
  for (const alerta of alertas) {
    await notificarOwner(alerta, "alerta");
  }
  
  return { success: true, alertas, receita: receitaMes, despesa: despesaMes, saldo };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AutomationRequest = await req.json();
    const { tipo, dados } = body;

    console.log(`[AUTOMAÇÃO] Recebido: ${tipo}`);

    let resultado;

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
        resultado = await gerarRelatorioSemanal();
        break;
      case "alerta_financeiro":
        resultado = await verificarAlertasFinanceiros();
        break;
      default:
        resultado = { success: false, error: `Tipo de automação desconhecido: ${tipo}` };
    }

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("[AUTOMAÇÃO] Erro:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);