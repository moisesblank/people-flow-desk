// ============================================
// DIRETRIZ MATRIZ - LEI II: INTEGRIDADE DE DADOS
// ANOMALIA #3: Cron Job para atualização de status
// Executa diariamente às 03:00 (baixa carga)
// ============================================
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface StatusUpdateResult {
  alunos_atualizados: number;
  funcionarios_atualizados: number;
  afiliados_atualizados: number;
  erros: string[];
  tempo_execucao_ms: number;
}

// ============================================
// ATUALIZAR STATUS DE ALUNOS
// - Inativar alunos sem acesso há 90 dias
// - Reativar alunos com nova compra
// ============================================
async function atualizarStatusAlunos(): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    // 1. Buscar alunos que deveriam ser inativados (90 dias sem acesso)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 90);
    
    const { data: alunosInativos, error: fetchError } = await supabase
      .from("alunos")
      .select("id, nome, email, status, updated_at")
      .eq("status", "ativo")
      .lt("updated_at", dataLimite.toISOString());
    
    if (fetchError) {
      errors.push(`Erro ao buscar alunos: ${fetchError.message}`);
      return { count, errors };
    }

    // 2. Verificar se têm compras recentes antes de inativar
    for (const aluno of alunosInativos || []) {
      const { data: compraRecente } = await supabase
        .from("entradas")
        .select("id")
        .eq("aluno_id", aluno.id)
        .gte("created_at", dataLimite.toISOString())
        .limit(1);
      
      if (!compraRecente || compraRecente.length === 0) {
        // Sem compra recente - inativar
        const { error: updateError } = await supabase
          .from("alunos")
          .update({ 
            status: "inativo",
            observacoes: `Inativado automaticamente em ${new Date().toISOString()} - 90 dias sem atividade`
          })
          .eq("id", aluno.id);
        
        if (updateError) {
          errors.push(`Erro ao inativar aluno ${aluno.email}: ${updateError.message}`);
        } else {
          count++;
          console.log(`[MATRIZ] Aluno inativado: ${aluno.email}`);
        }
      }
    }

    // 3. Reativar alunos que fizeram nova compra mas estão inativos
    const { data: comprasRecentes } = await supabase
      .from("entradas")
      .select("aluno_id")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // últimas 24h
      .not("aluno_id", "is", null);
    
    const alunoIds = [...new Set((comprasRecentes || []).map(c => c.aluno_id))];
    
    if (alunoIds.length > 0) {
      const { data: alunosReativar } = await supabase
        .from("alunos")
        .select("id, email")
        .in("id", alunoIds)
        .eq("status", "inativo");
      
      for (const aluno of alunosReativar || []) {
        const { error: reativarError } = await supabase
          .from("alunos")
          .update({ 
            status: "ativo",
            observacoes: `Reativado automaticamente em ${new Date().toISOString()} - Nova compra detectada`
          })
          .eq("id", aluno.id);
        
        if (!reativarError) {
          count++;
          console.log(`[MATRIZ] Aluno reativado: ${aluno.email}`);
        }
      }
    }

  } catch (err: any) {
    errors.push(`Exceção: ${err.message}`);
  }

  return { count, errors };
}

// ============================================
// ATUALIZAR STATUS DE FUNCIONÁRIOS
// - Verificar contratos vencidos
// - Atualizar status de férias
// ============================================
async function atualizarStatusFuncionarios(): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    const hoje = new Date().toISOString().split('T')[0];
    
    // Funcionários com contrato vencido
    const { data: contratosVencidos, error } = await supabase
      .from("employees")
      .select("id, nome, status, data_fim_contrato")
      .eq("status", "ativo")
      .lt("data_fim_contrato", hoje)
      .not("data_fim_contrato", "is", null);
    
    if (error) {
      errors.push(`Erro funcionários: ${error.message}`);
      return { count, errors };
    }

    for (const func of contratosVencidos || []) {
      const { error: updateError } = await supabase
        .from("employees")
        .update({ 
          status: "contrato_encerrado",
          observacoes: `Contrato encerrado automaticamente em ${hoje}`
        })
        .eq("id", func.id);
      
      if (!updateError) {
        count++;
        console.log(`[MATRIZ] Contrato encerrado: ${func.nome}`);
      }
    }

  } catch (err: any) {
    errors.push(`Exceção funcionários: ${err.message}`);
  }

  return { count, errors };
}

// ============================================
// ATUALIZAR STATUS DE AFILIADOS
// - Inativar afiliados sem vendas há 60 dias
// ============================================
async function atualizarStatusAfiliados(): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 60);

    // Buscar afiliados ativos
    const { data: afiliados, error } = await supabase
      .from("affiliates")
      .select("id, nome, status")
      .eq("status", "ativo");
    
    if (error) {
      errors.push(`Erro afiliados: ${error.message}`);
      return { count, errors };
    }

    for (const afiliado of afiliados || []) {
      // Verificar se tem vendas recentes
      const { data: vendasRecentes } = await supabase
        .from("comissoes")
        .select("id")
        .eq("afiliado_id", afiliado.id)
        .gte("created_at", dataLimite.toISOString())
        .limit(1);
      
      if (!vendasRecentes || vendasRecentes.length === 0) {
        const { error: updateError } = await supabase
          .from("affiliates")
          .update({ 
            status: "inativo"
          })
          .eq("id", afiliado.id);
        
        if (!updateError) {
          count++;
          console.log(`[MATRIZ] Afiliado inativado: ${afiliado.nome}`);
        }
      }
    }

  } catch (err: any) {
    errors.push(`Exceção afiliados: ${err.message}`);
  }

  return { count, errors };
}

// ============================================
// LOGAR RESULTADO DA EXECUÇÃO
// ============================================
async function logExecution(result: StatusUpdateResult) {
  try {
    await supabase.from("integration_events").insert({
      event_type: "cron_status_update",
      source: "atualizar-status-alunos",
      source_id: `cron_${Date.now()}`,
      payload: {
        ...result,
        executed_at: new Date().toISOString(),
      },
      processed: true,
    });
  } catch (err) {
    console.error("[MATRIZ] Erro ao logar execução:", err);
  }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  console.log("[MATRIZ] Iniciando atualização de status...");

  try {
    // Executar todas as atualizações em paralelo
    const [alunosResult, funcionariosResult, afiliadosResult] = await Promise.all([
      atualizarStatusAlunos(),
      atualizarStatusFuncionarios(),
      atualizarStatusAfiliados(),
    ]);

    const endTime = performance.now();
    
    const result: StatusUpdateResult = {
      alunos_atualizados: alunosResult.count,
      funcionarios_atualizados: funcionariosResult.count,
      afiliados_atualizados: afiliadosResult.count,
      erros: [
        ...alunosResult.errors,
        ...funcionariosResult.errors,
        ...afiliadosResult.errors,
      ],
      tempo_execucao_ms: Math.round(endTime - startTime),
    };

    console.log(`[MATRIZ] Atualização concluída em ${result.tempo_execucao_ms}ms:`, result);
    
    // Logar resultado
    await logExecution(result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...result,
        message: `Atualização concluída: ${result.alunos_atualizados} alunos, ${result.funcionarios_atualizados} funcionários, ${result.afiliados_atualizados} afiliados`
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("[MATRIZ] Erro crítico:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
