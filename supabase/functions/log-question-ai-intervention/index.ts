import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ═══════════════════════════════════════════════════════════════════════════════
// EDGE FUNCTION: log-question-ai-intervention
// Registra logs de intervenção de IA em questões
// POLÍTICA: Global AI Question Intervention Visibility Policy v1.0
// ═══════════════════════════════════════════════════════════════════════════════

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos de intervenção de IA válidos
type AIInterventionType = 
  | 'AI_AUTOFILL'
  | 'AI_ADDITION'
  | 'AI_CORRECTION'
  | 'AI_SUGGESTION_APPLIED'
  | 'AI_CLASSIFICATION_INFERENCE';

interface InterventionLog {
  question_id: string;
  source_file?: string;
  source_type: 'import' | 'edit' | 'batch_inference' | 'manual_trigger';
  intervention_type: AIInterventionType;
  field_affected: string;
  value_before: string | null;
  value_after: string;
  action_description: string;
  ai_confidence_score?: number;
  ai_model_used?: string;
  metadata?: Record<string, unknown>;
}

interface RequestBody {
  logs: InterventionLog[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as RequestBody;
    const { logs } = body;

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      console.log('⚠️ Nenhum log para registrar');
      return new Response(
        JSON.stringify({ success: true, inserted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📝 Registrando ${logs.length} logs de intervenção de IA...`);

    // Criar cliente Supabase com service_role para bypass de RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Validar e preparar logs para inserção
    // FIX: value_after pode ser string vazia (campo vazio que foi inferido como vazio = sem dado no Excel)
    // Apenas question_id, field_affected e intervention_type são obrigatórios
    const validLogs = logs.filter(log => {
      if (!log.question_id || !log.field_affected || !log.intervention_type) {
        console.warn('⚠️ Log inválido ignorado (question_id/field_affected/intervention_type faltando):', log);
        return false;
      }
      // value_after pode ser "" (string vazia) - indica que foi marcado para inferência
      // O importante é que a ação foi registrada
      return true;
    });

    if (validLogs.length === 0) {
      console.log('⚠️ Nenhum log válido para inserir');
      return new Response(
        JSON.stringify({ success: true, inserted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar registros para inserção
    const records = validLogs.map(log => ({
      question_id: log.question_id,
      source_file: log.source_file || null,
      source_type: log.source_type || 'import',
      intervention_type: log.intervention_type,
      field_affected: log.field_affected,
      value_before: log.value_before,
      value_after: log.value_after,
      action_description: log.action_description,
      ai_confidence_score: log.ai_confidence_score ?? null,
      ai_model_used: log.ai_model_used || 'infer-question-taxonomy',
      metadata: log.metadata || {},
    }));

    // Inserir logs (imutáveis após inserção)
    const { data, error } = await supabase
      .from('question_ai_intervention_logs')
      .insert(records)
      .select('id');

    if (error) {
      console.error('❌ Erro ao inserir logs:', error);
      throw error;
    }

    const insertedCount = data?.length || 0;
    console.log(`✅ ${insertedCount} logs de intervenção registrados com sucesso`);

    // Log detalhado para auditoria
    records.forEach((log, idx) => {
      console.log(`   📋 [${idx + 1}] [${log.intervention_type}] ${log.field_affected}: "${log.value_before || '(null)'}" → "${log.value_after}"`);
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: insertedCount,
        log_ids: data?.map(d => d.id) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
