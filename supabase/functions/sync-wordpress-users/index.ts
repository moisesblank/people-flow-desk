// 🧠 TRAMON v8 - SYNC WORDPRESS USERS (O Espelho do WordPress)
// Propósito: Sincronizar usuários do WordPress para o banco de dados da gestão
// NÃO CRIA usuários, apenas ESPELHA os dados existentes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Configurações do WordPress
    const WP_API_URL = Deno.env.get('WP_API_URL') || 'https://app.moisesmedeiros.com.br/wp-json';
    const WP_API_TOKEN = Deno.env.get('WP_API_TOKEN') || '';

    console.log('[SYNC-WP] 🔄 Iniciando sincronização de usuários...');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (WP_API_TOKEN) {
      // WordPress Application Passwords usa Basic Auth
      headers['Authorization'] = `Basic ${WP_API_TOKEN}`;
    }

    let page = 1;
    let totalSynced = 0;
    let totalErrors = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    let hasMore = true;
    const syncedEmails: string[] = [];

    while (hasMore) {
      try {
        console.log(`[SYNC-WP] Buscando página ${page}...`);
        
        const response = await fetch(
          `${WP_API_URL}/wp/v2/users?per_page=100&page=${page}&context=edit`,
          { headers }
        );

        // Verificar se chegou ao fim da paginação
        if (!response.ok) {
          if (response.status === 400 || response.status === 404) {
            console.log('[SYNC-WP] Fim da paginação');
            hasMore = false;
            continue;
          }
          throw new Error(`Erro HTTP ${response.status}: ${await response.text()}`);
        }

        const users = await response.json();

        if (!Array.isArray(users) || users.length === 0) {
          console.log('[SYNC-WP] Nenhum usuário encontrado na página');
          hasMore = false;
          continue;
        }

        console.log(`[SYNC-WP] Processando ${users.length} usuários da página ${page}`);

        for (const user of users) {
          try {
            const email = user.email || `wp_user_${user.id}@placeholder.local`;
            const nome = user.name || user.display_name || user.slug || 'Usuário WP';
            const grupos = user.groups || user.roles || [];
            const wpUserId = user.id;

            // Verificar se usuário já existe
            const { data: existing } = await supabase
              .from('usuarios_wordpress_sync')
              .select('id')
              .eq('wp_user_id', wpUserId)
              .single();

            // Verificar se tem transação aprovada na Hotmart
            const { data: transacao } = await supabase
              .from('transacoes_hotmart_completo')
              .select('id, transaction_id, status')
              .eq('buyer_email', email)
              .eq('status', 'approved')
              .limit(1)
              .single();

            const temPagamentoConfirmado = !!transacao;
            const statusAcesso = grupos.length > 0 ? 'ativo' : 'aguardando_pagamento';

            // Verificar discrepância: tem acesso beta mas não tem pagamento
            const temGrupoBeta = grupos.some((g: string) => 
              g.toLowerCase().includes('beta') || 
              g.toLowerCase().includes('aluno') ||
              g.toLowerCase().includes('subscriber')
            );

            const userData = {
              wp_user_id: wpUserId,
              email: email,
              nome: nome,
              username: user.slug,
              grupos: grupos,
              roles: user.roles || [],
              data_cadastro_wp: user.registered_date || null,
              ultimo_login: user.last_login || null,
              status_acesso: statusAcesso,
              tem_pagamento_confirmado: temPagamentoConfirmado,
              transaction_id_vinculado: transacao?.transaction_id || null,
              sync_status: 'sincronizado',
              updated_at: new Date().toISOString(),
              metadata: {
                avatar: user.avatar_urls,
                link: user.link,
                slug: user.slug,
                description: user.description
              }
            };

            const { error: upsertError } = await supabase
              .from('usuarios_wordpress_sync')
              .upsert(userData, { onConflict: 'wp_user_id' });

            if (upsertError) {
              console.error(`[SYNC-WP] Erro ao sincronizar ${email}:`, upsertError);
              totalErrors++;
              continue;
            }

            syncedEmails.push(email);
            totalSynced++;

            if (existing) {
              totalUpdated++;
            } else {
              totalNew++;
            }

            // Registrar auditoria se tem acesso sem pagamento
            if (temGrupoBeta && !temPagamentoConfirmado) {
              await supabase
                .from('auditoria_grupo_beta')
                .upsert({
                  email: email,
                  nome: nome,
                  wp_user_id: wpUserId,
                  tipo_discrepancia: 'acesso_sem_pagamento',
                  antes_grupos: grupos,
                  executado_por: 'sync-wordpress-users',
                  data_deteccao: new Date().toISOString()
                }, { onConflict: 'email' });
              
              console.log(`[SYNC-WP] ⚠️ Discrepância detectada: ${email} tem acesso mas sem pagamento`);
            }

          } catch (userError) {
            console.error(`[SYNC-WP] Erro no usuário ${user.id}:`, userError);
            totalErrors++;
          }
        }

        page++;
        
        // Se retornou menos que 100, não há mais páginas
        if (users.length < 100) {
          hasMore = false;
        }

        // Segurança: máximo 50 páginas (5000 usuários)
        if (page > 50) {
          console.log('[SYNC-WP] Limite de páginas atingido');
          hasMore = false;
        }

      } catch (pageError) {
        console.error(`[SYNC-WP] Erro na página ${page}:`, pageError);
        hasMore = false;
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`[SYNC-WP] ✅ Concluído em ${processingTime}ms: ${totalSynced} sincronizados (${totalNew} novos, ${totalUpdated} atualizados), ${totalErrors} erros`);

    // Criar alerta de resultado
    const alertaTipo = totalErrors > 0 ? 'importante' : 'sucesso';
    await supabase.from('alertas_sistema').insert({
      tipo: alertaTipo,
      titulo: '✅ Sincronização WordPress Concluída',
      mensagem: `${totalSynced} usuários sincronizados (${totalNew} novos, ${totalUpdated} atualizados)${totalErrors > 0 ? `, ${totalErrors} erros` : ''}. Tempo: ${(processingTime / 1000).toFixed(1)}s`,
      origem: 'sync-wordpress-users',
      destinatarios: ['admin'],
      dados: {
        total_synced: totalSynced,
        total_new: totalNew,
        total_updated: totalUpdated,
        total_errors: totalErrors,
        processing_time_ms: processingTime
      }
    });

    // Atualizar métricas diárias com total de alunos
    const hoje = new Date().toISOString().split('T')[0];
    const { count: totalAlunos } = await supabase
      .from('usuarios_wordpress_sync')
      .select('*', { count: 'exact', head: true })
      .eq('status_acesso', 'ativo');

    try {
      await supabase.rpc('increment_metrica_diaria', {
        p_data: hoje,
        p_campo: 'alunos_ativos',
        p_valor: totalAlunos || 0
      });
    } catch {
      console.log('[SYNC-WP] RPC increment_metrica_diaria não disponível');
    }

    return new Response(JSON.stringify({
      status: 'success',
      message: 'Sincronização concluída',
      total_synced: totalSynced,
      total_new: totalNew,
      total_updated: totalUpdated,
      total_errors: totalErrors,
      processing_time_ms: processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[SYNC-WP] ❌ Erro geral:', error);
    
    // Criar alerta de erro
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('alertas_sistema').insert({
      tipo: 'urgente',
      titulo: '❌ Erro na Sincronização WordPress',
      mensagem: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique as configurações e tente novamente.`,
      origem: 'sync-wordpress-users',
      destinatarios: ['admin']
    });

    return new Response(JSON.stringify({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
