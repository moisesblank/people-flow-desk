// ============================================
// ☢️ NUCLEAR ANNIHILATE STUDENTS — OWNER ONLY
// Aniquilação total de TODOS os usuários com role ALUNO
// CONSTITUIÇÃO v10.4 — OPERAÇÃO DESTRUTIVA CRÍTICA
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nuclear-auth-key',
};

// ============================================
// TIPOS
// ============================================

interface AnnihilationResult {
  success: boolean;
  totalDeleted: number;
  tablesAffected: string[];
  executionTimestamp: string;
  ownerId: string;
  errors: string[];
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const errors: string[] = [];
  let totalDeleted = 0;
  const tablesAffected: string[] = [];

  try {
    // 1. Validar Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validar Nuclear Auth Key
    const nuclearKey = req.headers.get('x-nuclear-auth-key');
    const body = await req.json();
    const { confirmationPhrase, secretKey } = body;

    // 3. Validar frase de confirmação
    if (confirmationPhrase !== 'DELETE ALL STUDENTS') {
      return new Response(
        JSON.stringify({ error: 'Invalid confirmation phrase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Criar clientes Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 5. Verificar se usuário é OWNER
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isOwnerResult } = await supabaseAdmin.rpc('check_is_owner');
    
    // Também verificar via user_roles para redundância
    const { data: ownerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single();

    if (!isOwnerResult && !ownerRole) {
      // Log tentativa de acesso não autorizado
      await supabaseAdmin.from('audit_logs').insert({
        action: 'NUCLEAR_ANNIHILATE_UNAUTHORIZED_ATTEMPT',
        user_id: user.id,
        metadata: {
          email: user.email,
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL'
        }
      });

      return new Response(
        JSON.stringify({ error: 'OWNER access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Validar secret key (usando env var)
    const nuclearSecretEnv = Deno.env.get('NUCLEAR_ANNIHILATE_SECRET') || 'MATRIX-OMEGA-DESTROY-2026';
    if (secretKey !== nuclearSecretEnv) {
      await supabaseAdmin.from('audit_logs').insert({
        action: 'NUCLEAR_ANNIHILATE_INVALID_SECRET',
        user_id: user.id,
        metadata: {
          email: user.email,
          timestamp: new Date().toISOString(),
          severity: 'CRITICAL'
        }
      });

      return new Response(
        JSON.stringify({ error: 'Invalid authorization key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('☢️ NUCLEAR ANNIHILATION INITIATED BY OWNER:', user.email);

    // 7. Buscar TODOS os user_ids com roles de ALUNO
    // CONSTITUIÇÃO v10.x: beta, aluno_gratuito, aluno_presencial, beta_expira
    const { data: studentRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['beta', 'aluno_gratuito', 'aluno_presencial', 'beta_expira']);

    if (rolesError) {
      throw new Error(`Failed to fetch student roles: ${rolesError.message}`);
    }

    const studentUserIds = [...new Set(studentRoles?.map(r => r.user_id) || [])];
    console.log(`☢️ Found ${studentUserIds.length} student user IDs to annihilate`);

    if (studentUserIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          totalDeleted: 0,
          tablesAffected: [],
          executionTimestamp: new Date().toISOString(),
          ownerId: user.id,
          errors: [],
          message: 'No students found to delete'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // 8. EXECUÇÃO DA ANIQUILAÇÃO — ORDEM CRÍTICA
    // ============================================

    // 8.1. Invalidar TODAS as sessões de alunos
    try {
      const { error } = await supabaseAdmin
        .from('active_sessions')
        .delete()
        .in('user_id', studentUserIds);
      if (!error) {
        tablesAffected.push('active_sessions');
        console.log('☢️ Deleted active_sessions');
      } else {
        errors.push(`active_sessions: ${error.message}`);
      }
    } catch (e) {
      errors.push(`active_sessions: ${e.message}`);
    }

    // 8.2. Deletar dispositivos registrados
    try {
      const { error } = await supabaseAdmin
        .from('user_devices')
        .delete()
        .in('user_id', studentUserIds);
      if (!error) {
        tablesAffected.push('user_devices');
        console.log('☢️ Deleted user_devices');
      } else {
        errors.push(`user_devices: ${error.message}`);
      }
    } catch (e) {
      errors.push(`user_devices: ${e.message}`);
    }

    // 8.3. Deletar verificações MFA
    try {
      const { error } = await supabaseAdmin
        .from('user_mfa_verifications')
        .delete()
        .in('user_id', studentUserIds);
      if (!error) {
        tablesAffected.push('user_mfa_verifications');
        console.log('☢️ Deleted user_mfa_verifications');
      } else {
        errors.push(`user_mfa_verifications: ${error.message}`);
      }
    } catch (e) {
      errors.push(`user_mfa_verifications: ${e.message}`);
    }

    // 8.4. Deletar gamificação
    try {
      const { error } = await supabaseAdmin
        .from('user_gamification')
        .delete()
        .in('user_id', studentUserIds);
      if (!error) {
        tablesAffected.push('user_gamification');
        console.log('☢️ Deleted user_gamification');
      } else {
        errors.push(`user_gamification: ${error.message}`);
      }
    } catch (e) {
      errors.push(`user_gamification: ${e.message}`);
    }

    // 8.5. Deletar XP history
    try {
      const { error } = await supabaseAdmin
        .from('xp_history')
        .delete()
        .in('user_id', studentUserIds);
      if (!error) {
        tablesAffected.push('xp_history');
        console.log('☢️ Deleted xp_history');
      } else {
        errors.push(`xp_history: ${error.message}`);
      }
    } catch (e) {
      errors.push(`xp_history: ${e.message}`);
    }

    // 8.6. Deletar badges de usuários
    try {
      const { error } = await supabaseAdmin
        .from('user_badges')
        .delete()
        .in('user_id', studentUserIds);
      if (!error) {
        tablesAffected.push('user_badges');
        console.log('☢️ Deleted user_badges');
      } else {
        errors.push(`user_badges: ${error.message}`);
      }
    } catch (e) {
      errors.push(`user_badges: ${e.message}`);
    }

    // 8.7. Deletar progresso de aulas
    try {
      const { error } = await supabaseAdmin
        .from('lesson_progress')
        .delete()
        .in('user_id', studentUserIds);
      if (!error) {
        tablesAffected.push('lesson_progress');
        console.log('☢️ Deleted lesson_progress');
      } else {
        errors.push(`lesson_progress: ${error.message}`);
      }
    } catch (e) {
      errors.push(`lesson_progress: ${e.message}`);
    }

    // 8.8. Deletar progresso de livros
    try {
      const { error } = await supabaseAdmin
        .from('book_reading_progress')
        .delete()
        .in('user_id', studentUserIds);
      if (!error) {
        tablesAffected.push('book_reading_progress');
        console.log('☢️ Deleted book_reading_progress');
      } else {
        errors.push(`book_reading_progress: ${error.message}`);
      }
    } catch (e) {
      errors.push(`book_reading_progress: ${e.message}`);
    }

    // 8.9. Deletar logs de acesso a livros
    try {
      const { error } = await supabaseAdmin
        .from('book_access_logs')
        .delete()
        .in('user_id', studentUserIds);
      if (!error) {
        tablesAffected.push('book_access_logs');
        console.log('☢️ Deleted book_access_logs');
      } else {
        errors.push(`book_access_logs: ${error.message}`);
      }
    } catch (e) {
      errors.push(`book_access_logs: ${e.message}`);
    }

    // 8.10. Deletar logs do AI tutor
    try {
      const { error } = await supabaseAdmin
        .from('ai_tutor_logs')
        .delete()
        .in('user_id', studentUserIds);
      if (!error) {
        tablesAffected.push('ai_tutor_logs');
        console.log('☢️ Deleted ai_tutor_logs');
      } else {
        errors.push(`ai_tutor_logs: ${error.message}`);
      }
    } catch (e) {
      errors.push(`ai_tutor_logs: ${e.message}`);
    }

    // 8.11. Deletar user_roles de alunos
    try {
      const { data: deleted, error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .in('role', ['beta', 'aluno_gratuito', 'aluno_presencial', 'beta_expira'])
        .select('id');
      if (!error) {
        tablesAffected.push('user_roles');
        totalDeleted += deleted?.length || 0;
        console.log(`☢️ Deleted ${deleted?.length || 0} user_roles`);
      } else {
        errors.push(`user_roles: ${error.message}`);
      }
    } catch (e) {
      errors.push(`user_roles: ${e.message}`);
    }

    // 8.12. Buscar emails dos alunos para deletar da tabela alunos
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .in('id', studentUserIds);
    
    const studentEmails = profiles?.map(p => p.email?.toLowerCase()).filter(Boolean) || [];

    // 8.13. Deletar da tabela alunos (por email)
    if (studentEmails.length > 0) {
      try {
        const { data: deleted, error } = await supabaseAdmin
          .from('alunos')
          .delete()
          .in('email', studentEmails)
          .select('id');
        if (!error) {
          tablesAffected.push('alunos');
          console.log(`☢️ Deleted ${deleted?.length || 0} from alunos table`);
        } else {
          errors.push(`alunos: ${error.message}`);
        }
      } catch (e) {
        errors.push(`alunos: ${e.message}`);
      }
    }

    // 8.14. Deletar profiles
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .delete()
        .in('id', studentUserIds);
      if (!error) {
        tablesAffected.push('profiles');
        console.log('☢️ Deleted profiles');
      } else {
        errors.push(`profiles: ${error.message}`);
      }
    } catch (e) {
      errors.push(`profiles: ${e.message}`);
    }

    // 8.15. Deletar usuários do auth.users (NUCLEAR)
    let authDeletedCount = 0;
    for (const userId of studentUserIds) {
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (!error) {
          authDeletedCount++;
        } else {
          errors.push(`auth.users[${userId}]: ${error.message}`);
        }
      } catch (e) {
        errors.push(`auth.users[${userId}]: ${e.message}`);
      }
    }
    
    if (authDeletedCount > 0) {
      tablesAffected.push('auth.users');
      totalDeleted = authDeletedCount;
      console.log(`☢️ Deleted ${authDeletedCount} from auth.users`);
    }

    // 9. Log da operação nuclear
    await supabaseAdmin.from('audit_logs').insert({
      action: 'NUCLEAR_ANNIHILATE_STUDENTS_COMPLETE',
      user_id: user.id,
      metadata: {
        email: user.email,
        timestamp: new Date().toISOString(),
        totalDeleted,
        tablesAffected,
        executionTimeMs: Date.now() - startTime,
        errors: errors.length > 0 ? errors : null,
        severity: 'CRITICAL'
      }
    });

    console.log(`☢️ NUCLEAR ANNIHILATION COMPLETE: ${totalDeleted} users deleted in ${Date.now() - startTime}ms`);

    // 10. Retornar resultado
    const result: AnnihilationResult = {
      success: true,
      totalDeleted,
      tablesAffected,
      executionTimestamp: new Date().toISOString(),
      ownerId: user.id,
      errors
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('☢️ NUCLEAR ANNIHILATION FAILED:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        totalDeleted,
        tablesAffected,
        executionTimestamp: new Date().toISOString(),
        errors: [...errors, error.message]
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
