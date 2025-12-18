// 🧠 TRAMON v8 - ORCHESTRATOR (O Maestro das IAs)
// Propósito: Coordenar ações entre as 4 IAs e sistemas externos
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrchestratorRequest {
  queue_id: string;
  source: string;
  event: string;
  data: Record<string, unknown>;
  log_id?: string;
}

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

    const { queue_id, source, event, data, log_id }: OrchestratorRequest = await req.json();
    
    console.log(`🎼 Orchestrating: ${source}:${event}`);

    const actions: string[] = [];
    const iasAcionadas: string[] = [];
    let resultado: Record<string, unknown> = {};

    // Atualizar log
    const updateLog = async (etapa: string, acoes?: string[]) => {
      if (log_id) {
        await supabase
          .from('logs_integracao_detalhado')
          .update({
            etapa_atual: etapa,
            acoes_executadas: acoes || actions,
            ias_acionadas: iasAcionadas
          })
          .eq('id', log_id);
      }
    };

    // ========================================
    // HOTMART EVENTS
    // ========================================
    if (source === 'hotmart') {
      const hotmartData = data as {
        event?: string;
        data?: {
          buyer?: { email?: string; name?: string; phone?: string; document?: string };
          purchase?: { 
            transaction?: string; 
            order_date?: number;
            approved_date?: number;
            status?: string;
            payment?: { type?: string; installments_number?: number };
            price?: { value?: number };
            offer?: { code?: string };
          };
          product?: { id?: string; name?: string };
          producer?: { name?: string };
          affiliate?: { affiliate_code?: string; name?: string };
          subscription?: { status?: string };
          commission?: { value?: number };
        };
      };

      const buyer = hotmartData.data?.buyer;
      const purchase = hotmartData.data?.purchase;
      const product = hotmartData.data?.product;
      const affiliate = hotmartData.data?.affiliate;

      // Salvar transação completa
      if (buyer?.email && purchase?.transaction) {
        await updateLog('salvando_transacao_hotmart');
        
        const transactionData = {
          transaction_id: purchase.transaction,
          product_id: product?.id,
          product_name: product?.name,
          buyer_email: buyer.email,
          buyer_name: buyer.name,
          buyer_phone: buyer.phone,
          buyer_cpf: buyer.document,
          status: purchase.status || event,
          valor_bruto: purchase.price?.value,
          metodo_pagamento: purchase.payment?.type,
          parcelas: purchase.payment?.installments_number || 1,
          affiliate_id: affiliate?.affiliate_code,
          affiliate_name: affiliate?.name,
          data_compra: purchase.order_date ? new Date(purchase.order_date).toISOString() : null,
          data_confirmacao: purchase.approved_date ? new Date(purchase.approved_date).toISOString() : null,
          webhook_raw: data
        };

        const { error: transError } = await supabase
          .from('transacoes_hotmart_completo')
          .upsert(transactionData, { onConflict: 'transaction_id' });

        if (!transError) {
          actions.push('transacao_salva');
        }
      }

      // Processar eventos específicos
      switch (event) {
        case 'PURCHASE_APPROVED':
        case 'PURCHASE_COMPLETE':
          await updateLog('processando_compra_aprovada');
          
          // 1. Criar/atualizar aluno
          if (buyer?.email) {
            const { error: alunoError } = await supabase
              .from('alunos')
              .upsert({
                email: buyer.email,
                nome: buyer.name || buyer.email.split('@')[0],
                telefone: buyer.phone,
                status: 'ativo',
                fonte: 'Hotmart',
                hotmart_transaction_id: purchase?.transaction,
                valor_pago: purchase?.price?.value || 0
              }, { onConflict: 'email' });

            if (!alunoError) {
              actions.push('aluno_criado_atualizado');
            }
          }

          // 2. Registrar comissão de afiliado
          if (affiliate?.affiliate_code && hotmartData.data?.commission?.value) {
            await supabase
              .from('comissoes')
              .insert({
                transaction_id: purchase?.transaction,
                valor: hotmartData.data.commission.value,
                descricao: `Comissão venda ${product?.name}`,
                status: 'pendente'
              });
            actions.push('comissao_registrada');
          }

          // 3. Criar entrada financeira
          if (purchase?.price?.value) {
            await supabase
              .from('entradas')
              .insert({
                descricao: `Venda Hotmart: ${product?.name || 'Curso'}`,
                valor: purchase.price.value,
                categoria: 'vendas',
                fonte: 'Hotmart',
                transaction_id: purchase.transaction
              });
            actions.push('entrada_financeira_criada');
          }

          // 4. Comandar IAs
          iasAcionadas.push('tramon');
          await supabase
            .from('comandos_ia_central')
            .insert({
              ia_destino: 'tramon',
              ia_origem: 'orchestrator',
              acao: 'notificar_nova_venda',
              parametros: {
                aluno: buyer?.name,
                email: buyer?.email,
                produto: product?.name,
                valor: purchase?.price?.value
              },
              webhook_trigger_id: queue_id,
              prioridade: 1
            });
          actions.push('ia_tramon_notificada');

          // 5. Atualizar métricas diárias
          const hoje = new Date().toISOString().split('T')[0];
          try {
            await supabase.rpc('increment_metricas_vendas', {
              p_data: hoje,
              p_vendas: 1,
              p_receita: purchase?.price?.value || 0
            });
          } catch {
            // Se a função RPC não existir, criar entrada manual
            await supabase
              .from('metricas_diarias')
              .upsert({
                data: hoje,
                total_vendas: 1,
                receita_bruta: purchase?.price?.value || 0
              }, { onConflict: 'data' });
          }
          actions.push('metricas_atualizadas');

          resultado = {
            aluno: buyer?.email,
            transacao: purchase?.transaction,
            valor: purchase?.price?.value,
            actions_taken: actions.length
          };
          break;

        case 'PURCHASE_CANCELED':
        case 'PURCHASE_REFUNDED':
        case 'PURCHASE_CHARGEBACK':
          await updateLog('processando_cancelamento');
          
          // Atualizar status da transação
          if (purchase?.transaction) {
            await supabase
              .from('transacoes_hotmart_completo')
              .update({
                status: event.toLowerCase(),
                data_cancelamento: new Date().toISOString(),
                motivo_cancelamento: event
              })
              .eq('transaction_id', purchase.transaction);
            actions.push('transacao_cancelada');
          }

          // Atualizar aluno
          if (buyer?.email) {
            await supabase
              .from('alunos')
              .update({ status: 'cancelado' })
              .eq('email', buyer.email);
            actions.push('aluno_status_atualizado');
          }

          // Notificar admin
          iasAcionadas.push('tramon');
          await supabase
            .from('comandos_ia_central')
            .insert({
              ia_destino: 'tramon',
              ia_origem: 'orchestrator',
              acao: 'notificar_cancelamento',
              parametros: {
                aluno: buyer?.name,
                email: buyer?.email,
                motivo: event,
                valor: purchase?.price?.value
              },
              webhook_trigger_id: queue_id,
              prioridade: 2
            });
          actions.push('admin_notificado');

          resultado = {
            status: 'cancelamento_processado',
            email: buyer?.email,
            evento: event
          };
          break;
      }
    }

    // ========================================
    // WORDPRESS EVENTS
    // ========================================
    else if (source === 'wordpress') {
      const wpData = data as {
        user_id?: number;
        user_email?: string;
        user_login?: string;
        display_name?: string;
        groups?: string[];
        roles?: string[];
        action?: string;
      };

      switch (event) {
        case 'user_created':
        case 'user_registered':
          await updateLog('sincronizando_usuario_wordpress');
          
          if (wpData.user_id && wpData.user_email) {
            // Verificar se tem pagamento confirmado
            const { data: transacao } = await supabase
              .from('transacoes_hotmart_completo')
              .select('id, status')
              .eq('buyer_email', wpData.user_email)
              .eq('status', 'approved')
              .limit(1)
              .single();

            await supabase
              .from('usuarios_wordpress_sync')
              .upsert({
                wp_user_id: wpData.user_id,
                email: wpData.user_email,
                nome: wpData.display_name,
                username: wpData.user_login,
                grupos: wpData.groups || [],
                roles: wpData.roles || [],
                data_cadastro_wp: new Date().toISOString(),
                tem_pagamento_confirmado: !!transacao,
                transaction_id_vinculado: transacao?.id
              }, { onConflict: 'wp_user_id' });
            
            actions.push('usuario_wp_sincronizado');

            // Se não tem pagamento, registrar para auditoria
            if (!transacao && wpData.groups?.includes('beta')) {
              await supabase
                .from('auditoria_grupo_beta')
                .insert({
                  email: wpData.user_email,
                  nome: wpData.display_name,
                  wp_user_id: wpData.user_id,
                  tipo_discrepancia: 'acesso_indevido',
                  antes_grupos: wpData.groups,
                  executado_por: 'sistema'
                });
              actions.push('discrepancia_registrada');
            }
          }
          
          resultado = {
            wp_user_id: wpData.user_id,
            email: wpData.user_email,
            synced: true
          };
          break;

        case 'user_updated':
          await updateLog('atualizando_usuario_wordpress');
          
          if (wpData.user_id) {
            await supabase
              .from('usuarios_wordpress_sync')
              .update({
                grupos: wpData.groups,
                roles: wpData.roles,
                sync_status: 'synced',
                updated_at: new Date().toISOString()
              })
              .eq('wp_user_id', wpData.user_id);
            
            actions.push('usuario_wp_atualizado');
          }
          
          resultado = { updated: true };
          break;
      }
    }

    // ========================================
    // WHATSAPP EVENTS
    // ========================================
    else if (source === 'whatsapp') {
      await updateLog('processando_whatsapp');
      
      // Processar mensagens recebidas
      const entries = data.entry as Array<Record<string, unknown>> | undefined;
      if (entries && Array.isArray(entries)) {
        for (const entry of entries) {
          const changes = (entry.changes || []) as Array<Record<string, unknown>>;
          for (const change of changes) {
            const changeValue = change.value as Record<string, unknown> | undefined;
            const messages = (changeValue?.messages || []) as Array<Record<string, unknown>>;
            for (const message of messages) {
              const msgFrom = message.from as string | undefined;
              const msgText = message.text as { body?: string } | undefined;
              if (msgFrom && msgText?.body) {
                // Salvar lead/atualizar
                const { data: lead } = await supabase.rpc('upsert_whatsapp_lead', {
                  p_phone: msgFrom,
                  p_name: null,
                  p_message: msgText.body,
                  p_source: 'whatsapp_api'
                });

                actions.push('lead_whatsapp_salvo');

                // Acionar IA para resposta se necessário
                if (msgText.body.toLowerCase().includes('curso') || 
                    msgText.body.toLowerCase().includes('ajuda')) {
                  iasAcionadas.push('tramon');
                  await supabase
                    .from('comandos_ia_central')
                    .insert({
                      ia_destino: 'tramon',
                      ia_origem: 'orchestrator',
                      acao: 'responder_whatsapp',
                      parametros: {
                        phone: msgFrom,
                        message: msgText.body,
                        lead_id: lead
                      },
                      webhook_trigger_id: queue_id,
                      prioridade: 1
                    });
                  actions.push('ia_resposta_solicitada');
                }
              }
            }
          }
        }
      }

      resultado = { messages_processed: actions.length };
    }

    // ========================================
    // RD STATION EVENTS
    // ========================================
    else if (source === 'rdstation') {
      await updateLog('processando_rdstation');
      
      const rdData = data as {
        leads?: Array<{ email?: string; name?: string; tags?: string[] }>;
        event_type?: string;
      };

      if (rdData.leads) {
        for (const lead of rdData.leads) {
          if (lead.email) {
            await supabase
              .from('whatsapp_leads')
              .upsert({
                email: lead.email,
                name: lead.name,
                source: 'rdstation',
                tags: lead.tags
              }, { onConflict: 'email' });
            actions.push('lead_rd_sincronizado');
          }
        }
      }

      resultado = { leads_synced: rdData.leads?.length || 0 };
    }

    // Finalizar log
    await updateLog('concluido', actions);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Orchestration complete: ${source}:${event} - ${actions.length} actions in ${processingTime}ms`);

    return new Response(JSON.stringify({
      status: 'success',
      source,
      event,
      actions_taken: actions,
      ias_acionadas: iasAcionadas,
      resultado,
      processing_time_ms: processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Orchestrator error:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
