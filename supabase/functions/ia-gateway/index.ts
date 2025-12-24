// 🧠 TRAMON v8 - IA GATEWAY (O Tradutor Universal das IAs)
// Propósito: Ponto único de entrada para comunicação com as 4 IAs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IARequest {
  ia: 'manus' | 'lovable' | 'chatgpt' | 'tramon';
  action: string;
  params: Record<string, unknown>;
  context_id?: string;
  priority?: number;
}

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ========================================
    // 🛡️ LEI VI - AUTENTICAÇÃO JWT OBRIGATÓRIA
    // Protege contra uso não autorizado de IAs (custo infinito)
    // ========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[IA-GATEWAY] ❌ BLOQUEADO: Sem token JWT');
      
      await supabase.from('security_events').insert({
        event_type: 'IA_GATEWAY_UNAUTHORIZED',
        severity: 'critical',
        description: 'Tentativa de acesso ao IA Gateway sem autenticação',
        payload: {
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
          user_agent: req.headers.get('user-agent')?.substring(0, 255)
        }
      });
      
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('[IA-GATEWAY] ❌ BLOQUEADO: Token JWT inválido');
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[IA-GATEWAY] ✅ Autenticado: ${user.email}`);

    const { ia, action, params, context_id, priority = 5 }: IARequest = await req.json();

    console.log(`🤖 IA Gateway: ${ia} -> ${action} (user: ${user.email})`);

    // Registrar comando
    const { data: comando } = await supabase
      .from('comandos_ia_central')
      .insert({
        ia_destino: ia,
        ia_origem: 'gateway',
        acao: action,
        parametros: params,
        contexto_id: context_id,
        prioridade: priority,
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    let resultado: Record<string, unknown> = {};
    let erro: string | null = null;

    try {
      switch (ia) {
        // ========================================
        // MANUS AI - Estratégia e Análise
        // ========================================
        case 'manus':
          // Manus é usado para análises estratégicas de alto nível
          // Usa Gemini Pro para raciocínio complexo
          const manusPrompt = buildManusPrompt(action, params);
          
          // Usando ChatGPT Pro (GPT-5) para análises estratégicas
          const manusResponse = await fetch(LOVABLE_AI_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'openai/gpt-5',
              messages: [
                {
                  role: 'system',
                  content: `Você é o Dr. Manus, PhD em Ciência da Computação e Estratégia de Negócios. 
                  Você é o estrategista-chefe do ecossistema TRAMON.
                  Suas respostas devem ser analíticas, precisas e orientadas a dados.
                  Sempre forneça insights acionáveis e recomendações claras.`
                },
                { role: 'user', content: manusPrompt }
              ]
            })
          });

          const manusData = await manusResponse.json();
          resultado = {
            response: manusData.choices?.[0]?.message?.content,
            model: 'openai/gpt-5',
            action
          };
          break;

        // ========================================
        // LOVABLE AI - Construção e Automação
        // ========================================
        case 'lovable':
          // Lovable é usado para tarefas de construção e integração
          switch (action) {
            case 'liberar_acesso_wp':
              // Chamar API do WordPress para adicionar usuário a grupo
              const wpResult = await callWordPressAPI('add_user_to_group', {
                email: params.email,
                group: params.group || 'beta'
              });
              resultado = { wordpress_result: wpResult };
              break;

            case 'remover_acesso_wp':
              const removeResult = await callWordPressAPI('remove_user_from_group', {
                email: params.email,
                group: params.group || 'beta'
              });
              resultado = { wordpress_result: removeResult };
              break;

            case 'sincronizar_usuarios_wp':
              const syncResult = await callWordPressAPI('sync_users', {});
              resultado = { sync_result: syncResult };
              break;

            default:
              resultado = { status: 'action_not_implemented', action };
          }
          break;

        // ========================================
        // CHATGPT - Linguagem e Comunicação
        // ========================================
        case 'chatgpt':
          const chatgptPrompt = buildChatGPTPrompt(action, params);
          
          // Usando ChatGPT Pro (GPT-5-mini) para comunicação
          const chatgptResponse = await fetch(LOVABLE_AI_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'openai/gpt-5-mini',
              messages: [
                {
                  role: 'system',
                  content: `Você é um assistente de comunicação especializado em educação e cursos online.
                  Sua tarefa é gerar textos claros, empáticos e profissionais.
                  O tom deve ser acolhedor mas profissional, adequado para comunicação com alunos.`
                },
                { role: 'user', content: chatgptPrompt }
              ]
            })
          });

          const chatgptData = await chatgptResponse.json();
          const emailContent = chatgptData.choices?.[0]?.message?.content;
          
          // Salvar email gerado na tabela emails_rd_station
          if (action === 'gerar_email_boas_vindas' && params.email_aluno) {
            await supabase.from('emails_rd_station').insert({
              destinatario: String(params.email_aluno),
              assunto: `Bem-vindo ao curso, ${params.nome_aluno || params.nome}! 🎉`,
              corpo_html: emailContent,
              template_id: 'boas_vindas_ia',
              tags: ['novo_aluno', 'boas_vindas', 'ia_generated'],
              status: 'pendente',
              data_envio: new Date().toISOString()
            });
          }
          
          resultado = {
            content: emailContent,
            action,
            generated_for: params.nome_aluno || params.nome || params.email_aluno,
            saved_to_queue: action === 'gerar_email_boas_vindas'
          };
          break;

        // ========================================
        // TRAMON - Ação Rápida e Notificações
        // ========================================
        case 'tramon':
          switch (action) {
            case 'notificar_nova_venda':
              // Criar notificação no sistema
              await supabase.from('notifications').insert({
                title: '💰 Nova Venda!',
                message: `${params.aluno} comprou ${params.produto} por R$ ${params.valor}`,
                type: 'success',
                is_read: false
              });
              
              // Enviar email se configurado
              if (Deno.env.get('RESEND_API_KEY')) {
                await supabase.functions.invoke('send-email', {
                  body: {
                    to: 'moisesblank@gmail.com',
                    subject: `💰 Nova Venda: ${params.produto}`,
                    html: `
                      <h2>Nova venda realizada!</h2>
                      <p><strong>Aluno:</strong> ${params.aluno}</p>
                      <p><strong>Email:</strong> ${params.email}</p>
                      <p><strong>Produto:</strong> ${params.produto}</p>
                      <p><strong>Valor:</strong> R$ ${params.valor}</p>
                    `
                  }
                });
              }
              
              resultado = { notificacao_enviada: true, tipo: 'nova_venda' };
              break;

            case 'notificar_cancelamento':
              await supabase.from('notifications').insert({
                title: '⚠️ Cancelamento',
                message: `${params.aluno} cancelou/reembolsou. Motivo: ${params.motivo}`,
                type: 'warning',
                is_read: false
              });
              resultado = { notificacao_enviada: true, tipo: 'cancelamento' };
              break;

            case 'notificar_admin':
              await supabase.from('notifications').insert({
                title: params.title || '📢 Notificação',
                message: params.message,
                type: params.type || 'info',
                is_read: false
              });
              resultado = { notificacao_enviada: true };
              break;

            case 'responder_whatsapp':
              // Gerar resposta com IA
              // Usando ChatGPT Pro (GPT-5-nano) para respostas rápidas
              const waResponse = await fetch(LOVABLE_AI_URL, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: 'openai/gpt-5-nano',
                  messages: [
                    {
                      role: 'system',
                      content: `Você é o TRAMON, assistente virtual do Prof. Moisés Medeiros.
                      Responda de forma amigável e objetiva sobre o curso de Química.
                      Se não souber a resposta, direcione para o WhatsApp oficial.
                      Mantenha respostas curtas (máximo 300 caracteres).`
                    },
                    { role: 'user', content: String(params.message) }
                  ]
                })
              });

              const waData = await waResponse.json();
              const resposta = waData.choices?.[0]?.message?.content;

              // Enviar resposta via WhatsApp API (se configurado)
              if (resposta && Deno.env.get('WHATSAPP_ACCESS_TOKEN')) {
                await sendWhatsAppMessage(String(params.phone), resposta);
              }

              // Salvar no histórico
              await supabase.from('whatsapp_conversation_history').insert({
                lead_id: params.lead_id,
                user_message: params.message,
                ai_response: resposta
              });

              resultado = { resposta_gerada: resposta, enviada: !!Deno.env.get('WHATSAPP_ACCESS_TOKEN') };
              break;

            case 'executar_auditoria':
              // Executar auditoria de acessos
              const auditResult = await executarAuditoriaBeta(supabase);
              resultado = auditResult;
              break;

            default:
              resultado = { status: 'action_not_implemented', action };
          }
          break;

        default:
          erro = `IA desconhecida: ${ia}`;
      }

    } catch (iaError) {
      erro = iaError instanceof Error ? iaError.message : 'Erro desconhecido na IA';
      console.error(`❌ IA Error (${ia}):`, erro);
    }

    // Atualizar comando com resultado
    const processingTime = Date.now() - startTime;
    
    if (comando?.id) {
      await supabase
        .from('comandos_ia_central')
        .update({
          status: erro ? 'failed' : 'completed',
          resultado,
          erro,
          tempo_execucao_ms: processingTime,
          completed_at: new Date().toISOString()
        })
        .eq('id', comando.id);
    }

    console.log(`✅ IA Gateway complete: ${ia} -> ${action} in ${processingTime}ms`);

    return new Response(JSON.stringify({
      status: erro ? 'error' : 'success',
      ia,
      action,
      resultado,
      erro,
      processing_time_ms: processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('IA Gateway error:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function buildManusPrompt(action: string, params: Record<string, unknown>): string {
  switch (action) {
    case 'analisar_ltv':
      return `Analise o LTV (Lifetime Value) dos alunos do curso de Química.
      Dados: ${JSON.stringify(params)}
      Forneça: 1) LTV médio 2) Segmentação por fonte 3) Recomendações de retenção`;
    
    case 'gerar_relatorio_semanal':
      return `Gere um relatório executivo semanal com os seguintes dados:
      ${JSON.stringify(params)}
      Inclua: KPIs principais, tendências, alertas e recomendações.`;
    
    case 'analisar_churn':
      return `Analise os padrões de churn (cancelamento) dos alunos.
      Dados: ${JSON.stringify(params)}
      Identifique: 1) Taxa de churn 2) Principais motivos 3) Perfil de risco 4) Ações preventivas`;
    
    default:
      return `Execute a análise: ${action}\nDados: ${JSON.stringify(params)}`;
  }
}

function buildChatGPTPrompt(action: string, params: Record<string, unknown>): string {
  switch (action) {
    case 'gerar_email_boas_vindas':
      return `Gere um email HTML de boas-vindas para o aluno ${params.nome_aluno || params.nome} que acabou de comprar o curso "${params.curso || 'de Química'}".
      
      O email deve:
      1. Ser acolhedor, motivador e inspirador
      2. Agradecer sinceramente pela confiança
      3. Explicar como acessar o curso (login em moisesmedeiros.com.br com o e-mail cadastrado)
      4. Mencionar que o acesso já foi liberado automaticamente
      5. Informar o WhatsApp de suporte: (83) 98920-0105
      6. Assinar como "Prof. Moisés Medeiros"
      
      Formato: HTML simples com estilo inline, pronto para envio.`;
    
    case 'gerar_email_recuperacao':
      return `Gere um email de recuperação para o aluno ${params.nome} que está inativo há ${params.dias_inativo} dias.
      Seja empático e ofereça ajuda para retomar os estudos.`;
    
    case 'gerar_resposta_suporte':
      return `Gere uma resposta de suporte para a seguinte dúvida do aluno:
      "${params.pergunta}"
      Seja claro e objetivo.`;
    
    default:
      return `Gere o seguinte conteúdo: ${action}\nContexto: ${JSON.stringify(params)}`;
  }
}

async function callWordPressAPI(action: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const wpApiUrl = Deno.env.get('WORDPRESS_API_URL') || 'https://app.moisesmedeiros.com.br/wp-json/tramon/v1';
  const wpApiKey = Deno.env.get('WORDPRESS_API_KEY');

  if (!wpApiKey) {
    return { error: 'WordPress API key not configured' };
  }

  try {
    const response = await fetch(`${wpApiUrl}/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wpApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    return await response.json();
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'WordPress API error' };
  }
}

async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!accessToken || !phoneNumberId) {
    console.error('WhatsApp credentials not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message }
        })
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}

// deno-lint-ignore no-explicit-any
async function executarAuditoriaBeta(supabaseClient: any): Promise<Record<string, unknown>> {
  // Buscar usuários no grupo beta sem pagamento confirmado
  const { data: discrepancias, error } = await supabaseClient
    .from('usuarios_wordpress_sync')
    .select('*')
    .eq('tem_pagamento_confirmado', false);

  if (error) {
    return { error: error.message };
  }

  // deno-lint-ignore no-explicit-any
  const usuariosComBeta = (discrepancias || []).filter((u: any) => {
    const grupos = u.grupos as string[] | null;
    return grupos && grupos.includes('beta');
  });

  const resultados = {
    total_discrepancias: usuariosComBeta.length,
    valor_estimado_perda: usuariosComBeta.length * 199,
    usuarios_auditados: [] as string[]
  };

  for (const user of usuariosComBeta) {
    await supabaseClient.from('auditoria_grupo_beta').insert({
      email: user.email,
      nome: user.nome,
      wp_user_id: user.wp_user_id,
      tipo_discrepancia: 'acesso_indevido',
      antes_grupos: user.grupos,
      executado_por: 'sistema_auditoria'
    });
    resultados.usuarios_auditados.push(user.email);
  }

  return resultados;
}
