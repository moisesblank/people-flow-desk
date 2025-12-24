import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// Fallback CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordPressUser {
  id: number;
  email: string;
  username: string;
  display_name: string;
  roles: string[];
  registered_date: string;
}

interface WordPressAction {
  action: 'sync_users' | 'add_to_group' | 'remove_from_group' | 'get_user' | 'update_user' | 'audit_discrepancies';
  user_id?: number;
  email?: string;
  group_id?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  // CORS seguro via allowlist
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }
  
  const secureHeaders = getCorsHeaders(req);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const wpApiUrl = Deno.env.get('WORDPRESS_API_URL');
  const wpApiKey = Deno.env.get('WORDPRESS_API_KEY');
  const wpUsername = Deno.env.get('WORDPRESS_USERNAME');
  const wpPassword = Deno.env.get('WORDPRESS_APP_PASSWORD');

  try {
    const body: WordPressAction = await req.json();
    const { action, user_id, email, group_id, data } = body;

    console.log(`🔄 WordPress API - Ação: ${action}`, { user_id, email, group_id });

    // Log da integração
    await supabase.from('logs_integracao_detalhado').insert({
      sistema_origem: 'supabase',
      sistema_destino: 'wordpress',
      tipo_operacao: action,
      dados_entrada: body,
      status: 'processing'
    });

    let result: Record<string, unknown> = {};
    let wpResponse: Response | null = null;

    const wpAuth = btoa(`${wpUsername}:${wpPassword}`);
    const wpHeaders = {
      'Authorization': `Basic ${wpAuth}`,
      'Content-Type': 'application/json',
    };

    switch (action) {
      case 'sync_users': {
        // Buscar todos os usuários do WordPress
        console.log('📥 Sincronizando usuários do WordPress...');
        
        wpResponse = await fetch(`${wpApiUrl}/wp-json/wp/v2/users?per_page=100`, {
          headers: wpHeaders
        });

        if (!wpResponse.ok) {
          throw new Error(`WordPress API error: ${wpResponse.status}`);
        }

        const wpUsers: WordPressUser[] = await wpResponse.json();
        console.log(`✅ ${wpUsers.length} usuários encontrados no WordPress`);

        // Sincronizar com tabela local
        for (const wpUser of wpUsers) {
          await supabase.from('usuarios_wordpress_sync').upsert({
            wp_user_id: wpUser.id,
            email: wpUser.email,
            nome: wpUser.display_name,
            username: wpUser.username,
            roles: wpUser.roles,
            data_registro_wp: wpUser.registered_date,
            sync_status: 'synced',
            last_sync_at: new Date().toISOString()
          }, {
            onConflict: 'wp_user_id'
          });
        }

        result = { 
          success: true, 
          users_synced: wpUsers.length,
          message: `${wpUsers.length} usuários sincronizados com sucesso`
        };
        break;
      }

      case 'add_to_group': {
        if (!user_id && !email) {
          throw new Error('user_id ou email é obrigatório');
        }

        console.log(`➕ Adicionando usuário ao grupo ${group_id}...`);

        // Buscar usuário se apenas email foi fornecido
        let targetUserId = user_id;
        if (!targetUserId && email) {
          wpResponse = await fetch(`${wpApiUrl}/wp-json/wp/v2/users?search=${encodeURIComponent(email)}`, {
            headers: wpHeaders
          });
          const users = await wpResponse.json();
          if (users.length > 0) {
            targetUserId = users[0].id;
          }
        }

        if (!targetUserId) {
          throw new Error('Usuário não encontrado no WordPress');
        }

        // Adicionar ao grupo via Groups plugin endpoint
        wpResponse = await fetch(`${wpApiUrl}/wp-json/groups/v1/groups/${group_id}/users/${targetUserId}`, {
          method: 'POST',
          headers: wpHeaders
        });

        // Registrar auditoria
        await supabase.from('auditoria_grupo_beta').insert({
          email: email || '',
          wp_user_id: targetUserId,
          tipo_discrepancia: 'manual_add',
          acao_tomada: 'added_to_group',
          depois_grupos: [group_id],
          sucesso: wpResponse.ok
        });

        result = { 
          success: wpResponse.ok, 
          user_id: targetUserId,
          group_id,
          message: wpResponse.ok ? 'Usuário adicionado ao grupo' : 'Falha ao adicionar usuário'
        };
        break;
      }

      case 'remove_from_group': {
        if (!user_id) {
          throw new Error('user_id é obrigatório');
        }

        console.log(`➖ Removendo usuário ${user_id} do grupo ${group_id}...`);

        wpResponse = await fetch(`${wpApiUrl}/wp-json/groups/v1/groups/${group_id}/users/${user_id}`, {
          method: 'DELETE',
          headers: wpHeaders
        });

        // Registrar auditoria
        await supabase.from('auditoria_grupo_beta').insert({
          wp_user_id: user_id,
          email: email || '',
          tipo_discrepancia: 'manual_remove',
          acao_tomada: 'removed_from_group',
          antes_grupos: [group_id],
          sucesso: wpResponse.ok
        });

        result = { 
          success: wpResponse.ok,
          user_id,
          group_id,
          message: wpResponse.ok ? 'Usuário removido do grupo' : 'Falha ao remover usuário'
        };
        break;
      }

      case 'get_user': {
        if (!user_id && !email) {
          throw new Error('user_id ou email é obrigatório');
        }

        console.log(`🔍 Buscando usuário...`);

        if (user_id) {
          wpResponse = await fetch(`${wpApiUrl}/wp-json/wp/v2/users/${user_id}`, {
            headers: wpHeaders
          });
        } else {
          wpResponse = await fetch(`${wpApiUrl}/wp-json/wp/v2/users?search=${encodeURIComponent(email!)}`, {
            headers: wpHeaders
          });
        }

        const userData = await wpResponse.json();
        result = { 
          success: true, 
          user: Array.isArray(userData) ? userData[0] : userData 
        };
        break;
      }

      case 'update_user': {
        if (!user_id) {
          throw new Error('user_id é obrigatório');
        }

        console.log(`✏️ Atualizando usuário ${user_id}...`);

        wpResponse = await fetch(`${wpApiUrl}/wp-json/wp/v2/users/${user_id}`, {
          method: 'POST',
          headers: wpHeaders,
          body: JSON.stringify(data)
        });

        result = { 
          success: wpResponse.ok,
          user_id,
          message: wpResponse.ok ? 'Usuário atualizado' : 'Falha ao atualizar'
        };
        break;
      }

      case 'audit_discrepancies': {
        console.log('🔍 Auditando discrepâncias de grupos...');

        // Buscar alunos ativos do Supabase
        const { data: alunos } = await supabase
          .from('alunos')
          .select('*')
          .eq('status', 'ativo');

        // Buscar usuários do WordPress
        wpResponse = await fetch(`${wpApiUrl}/wp-json/wp/v2/users?per_page=100`, {
          headers: wpHeaders
        });
        const wpUsers: WordPressUser[] = await wpResponse.json();

        const discrepancies: Array<{email: string; tipo: string; detalhes: string}> = [];

        // Verificar alunos que deveriam ter acesso mas não têm
        for (const aluno of alunos || []) {
          const wpUser = wpUsers.find(u => u.email.toLowerCase() === aluno.email.toLowerCase());
          
          if (!wpUser) {
            discrepancies.push({
              email: aluno.email,
              tipo: 'aluno_sem_wp',
              detalhes: 'Aluno ativo sem conta WordPress'
            });

            await supabase.from('auditoria_grupo_beta').insert({
              email: aluno.email,
              nome: aluno.nome,
              tipo_discrepancia: 'aluno_sem_conta_wp',
              status_anterior: 'ativo_supabase',
              status_novo: 'sem_conta_wp'
            });
          } else if (!wpUser.roles.includes('subscriber') && !wpUser.roles.includes('student')) {
            discrepancies.push({
              email: aluno.email,
              tipo: 'sem_grupo_aluno',
              detalhes: 'Usuário WP sem role de aluno'
            });

            await supabase.from('auditoria_grupo_beta').insert({
              email: aluno.email,
              nome: aluno.nome,
              wp_user_id: wpUser.id,
              tipo_discrepancia: 'sem_role_aluno',
              antes_grupos: wpUser.roles
            });
          }
        }

        result = {
          success: true,
          total_alunos: alunos?.length || 0,
          total_wp_users: wpUsers.length,
          discrepancies_found: discrepancies.length,
          discrepancies
        };
        break;
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    // Atualizar log com sucesso
    await supabase.from('logs_integracao_detalhado').insert({
      sistema_origem: 'supabase',
      sistema_destino: 'wordpress',
      tipo_operacao: action,
      dados_entrada: body,
      dados_saida: result,
      status: 'success',
      http_status: wpResponse?.status || 200
    });

    console.log(`✅ WordPress API - Sucesso:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ WordPress API Error:', error);

    // Log do erro
    await supabase.from('logs_integracao_detalhado').insert({
      sistema_origem: 'supabase',
      sistema_destino: 'wordpress',
      tipo_operacao: 'error',
      erro_detalhado: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    });

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
