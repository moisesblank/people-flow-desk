// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// SISTEMA NERVOSO DIVINO - Criador de Usuário BETA
// Processa payment.succeeded e cria usuário com acesso BETA
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface EventPayload {
  event: {
    id: number;
    name: string;
    payload: {
      source: string;
      customer: {
        email: string;
        name: string;
        phone?: string;
        cpf?: string;
      };
      transaction?: {
        id: string;
        status: string;
        amount: number;
        currency: string;
      };
      product?: {
        id: string;
        name: string;
      };
    };
  };
}

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ========================================
    // 🛡️ P0.7 - PROTEÇÃO INTERNA COM INTERNAL_SECRET DEDICADO
    // LEI VI: Nunca usar User-Agent como validação (falsificável)
    // ========================================
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_SECRET');
    
    // SEGURANÇA BANCÁRIA: Apenas validar INTERNAL_SECRET dedicado
    // Removido: User-Agent fallback (falsificável)
    // Removido: SUPABASE_SERVICE_ROLE_KEY como senha (anti-pattern)
    const isInternalCall = expectedSecret && internalSecret === expectedSecret;

    if (!isInternalCall) {
      console.log('[C-CREATE-BETA-USER] ❌ BLOQUEADO: Chamada externa não autorizada');
      
      await supabaseAdmin.from('security_events').insert({
        event_type: 'CREATE_BETA_USER_EXTERNAL_CALL',
        severity: 'critical',
        description: 'Tentativa de criação de usuário BETA via chamada externa bloqueada - POSSÍVEL FRAUDE',
        payload: {
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
          user_agent: (req.headers.get('user-agent') || '').substring(0, 255)
        }
      });
      
      return new Response(JSON.stringify({ 
        error: 'Acesso restrito a chamadas internas do sistema' 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log('[C-CREATE-BETA-USER] ✅ Chamada interna autorizada');

    const { event }: EventPayload = await req.json();
    const { customer, transaction, product } = event.payload;

    console.log(`🎯 Criando usuário BETA para: ${customer.email}`);

    // 1. Verificar se usuário já existe no auth (OTIMIZADO: busca direta por email, não listUsers)
    // P1 FIX: listUsers() não escala com +10k usuários, usar busca filtrada
    const { data: existingUserData } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    
    // Buscar diretamente pelo email usando getUserByEmail (mais eficiente)
    let existingUser = null;
    try {
      // Tentar buscar usuário por email via profiles (mais rápido que auth.admin)
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .ilike('email', customer.email.trim())
        .limit(1)
        .single();
      
      if (profileData?.id) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profileData.id);
        existingUser = userData?.user;
      }
    } catch {
      // Se não encontrou no profiles, tenta criar novo
      existingUser = null;
    }

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`👤 Usuário já existe: ${userId}`);
    } else {
      // ============================================
      // 🛡️ P1.5b - MAGIC LINK EM VEZ DE SENHA
      // LEI VI: Nunca enviar senhas em plain-text por email
      // Usuário define própria senha no primeiro acesso
      // ============================================
      
      // Criar usuário SEM senha (forçar primeiro acesso via magic link)
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: customer.email.toLowerCase().trim(),
        email_confirm: true,
        user_metadata: {
          name: customer.name,
          phone: customer.phone,
          source: event.payload.source,
        },
      });

      if (authError) {
        console.error("❌ Erro ao criar usuário auth:", authError);
        throw authError;
      }

      userId = authUser.user.id;
      console.log(`✅ Usuário auth criado (sem senha): ${userId}`);

      // 🎯 P0 FIX v2: Gerar magic link para /primeiro-acesso (não /alunos)
      // A definição de senha acontece DENTRO do onboarding
      const siteUrl = Deno.env.get('SITE_URL') || 'https://pro.moisesmedeiros.com.br';
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink', // 🎯 Magic link (não recovery)
        email: customer.email.toLowerCase().trim(),
        options: {
          redirectTo: `${siteUrl}/primeiro-acesso`, // 🎯 Vai direto para onboarding
        },
      });

      if (linkError) {
        console.warn("⚠️ Erro ao gerar magic link:", linkError);
      }

      // Enviar email com link de acesso (SEM senha plain-text)
      try {
        const accessLink = linkData?.properties?.action_link || `${siteUrl}/auth`;
        
        await supabaseAdmin.functions.invoke("send-email", {
          body: {
            to: customer.email,
            subject: "🎉 Bem-vindo! Acesse a plataforma",
            template: "welcome_beta_magic",
            data: {
              name: customer.name,
              email: customer.email,
              access_link: accessLink,
              product_name: product?.name || "Curso de Química",
            },
          },
        });
        console.log(`📧 Email com magic link enviado para: ${customer.email}`);
      } catch (emailError) {
        console.warn("⚠️ Email de boas-vindas não enviado:", emailError);
      }
    }

    // 3. Calcular data de expiração (365 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    // 4. Atualizar/criar profile
    // 🎯 CONSTITUIÇÃO v10.4: SEMPRE marcar password_change_required = true para PRIMEIRO ACESSO
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: customer.email.toLowerCase().trim(),
      nome: customer.name,
      telefone: customer.phone || null,
      cpf: customer.cpf || null,
      password_change_required: true,  // 🔐 OBRIGATÓRIO: Força primeiro acesso
      onboarding_completed: false,     // 🔐 OBRIGATÓRIO: Força onboarding
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    if (profileError) {
      console.error("❌ Erro ao criar profile:", profileError);
      throw profileError;
    }

    // 5. Atribuir role BETA usando a função RPC existente
    const { error: roleError } = await supabaseAdmin.rpc("grant_beta_access", {
      p_user_id: userId,
      p_days: 365,
    });

    if (roleError) {
      console.error("❌ Erro ao atribuir role BETA:", roleError);
      
      // Fallback: inserir diretamente na tabela de roles
      await supabaseAdmin.from("user_roles").upsert({
        user_id: userId,
        role: "beta",
      }, { onConflict: "user_id" });

      await supabaseAdmin.from("user_access_expiration").upsert({
        user_id: userId,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        granted_by: "system",
        reason: `Pagamento aprovado - ${transaction?.id || "webhook"}`,
      }, { onConflict: "user_id" });
    }

    // 6. Registrar na tabela de alunos
    await supabaseAdmin.from("alunos").upsert({
      email: customer.email.toLowerCase().trim(),
      nome: customer.name,
      telefone: customer.phone || null,
      cpf: customer.cpf || null,
      status: "ativo",
      fonte: event.payload.source === "hotmart" ? "Hotmart" : "Stripe",
      hotmart_transaction_id: transaction?.id || null,
      valor_pago: transaction?.amount || null,
      data_matricula: new Date().toISOString(),
    }, { onConflict: "email" });

    // 7. Criar entrada financeira
    if (transaction?.amount) {
      await supabaseAdmin.from("entradas").insert({
        descricao: `Venda ${event.payload.source} - ${customer.name}`,
        valor: transaction.amount,
        categoria: "Vendas",
        fonte: event.payload.source === "hotmart" ? "Hotmart" : "Stripe",
        data: new Date().toISOString(),
        transaction_id: transaction.id,
      });
    }

    // 8. Publicar evento de acesso concedido
    await supabaseAdmin.rpc("publish_event", {
      p_name: "access.granted",
      p_payload: JSON.parse(JSON.stringify({
        user_id: userId,
        email: customer.email,
        role: "beta",
        expires_at: expiresAt.toISOString(),
        source: event.payload.source,
      })),
      p_entity_type: "user",
      p_entity_id: userId,
    });

    console.log(`🎉 Usuário BETA criado com sucesso: ${customer.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email: customer.email,
        role: "beta",
        expires_at: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro em c-create-beta-user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Gerar senha segura temporária
function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  let password = "";
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  for (let i = 0; i < 12; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}
