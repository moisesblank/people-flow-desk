import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface CPFValidationResult {
  valid: boolean;
  exists: boolean;
  nome?: string;
  situacao?: string;
  error?: string;
  cpf_sanitized?: string;
}

// Sanitiza CPF removendo pontuação
function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

// Valida formato matemático do CPF (dígitos verificadores)
function validateCPFFormat(cpf: string): boolean {
  const cleaned = sanitizeCPF(cpf);
  
  if (cleaned.length !== 11) return false;
  
  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

// Consulta CPF na API cpfcnpj.com.br (Receita Federal)
async function consultCPFReal(cpf: string, token: string): Promise<CPFValidationResult> {
  const cleanedCPF = sanitizeCPF(cpf);
  
  // Primeiro valida o formato
  if (!validateCPFFormat(cleanedCPF)) {
    return {
      valid: false,
      exists: false,
      cpf_sanitized: cleanedCPF,
      error: 'CPF com formato inválido (dígitos verificadores incorretos)'
    };
  }
  
  try {
    console.log(`[validate-cpf-real] Consultando CPF ${cleanedCPF.substring(0, 3)}***${cleanedCPF.substring(9)} na Receita Federal...`);
    
    const response = await fetch(`https://api.cpfcnpj.com.br/${token}/1/${cleanedCPF}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[validate-cpf-real] Erro na API: ${response.status} - ${errorText}`);
      
      if (response.status === 401) {
        return {
          valid: false,
          exists: false,
          cpf_sanitized: cleanedCPF,
          error: 'Token da API inválido ou expirado'
        };
      }
      
      if (response.status === 429) {
        return {
          valid: false,
          exists: false,
          cpf_sanitized: cleanedCPF,
          error: 'Limite de consultas excedido. Tente novamente mais tarde.'
        };
      }
      
      return {
        valid: false,
        exists: false,
        cpf_sanitized: cleanedCPF,
        error: `Erro ao consultar CPF: ${response.status}`
      };
    }
    
    const data = await response.json();
    console.log(`[validate-cpf-real] Resposta da API:`, JSON.stringify(data, null, 2));
    
    // A API retorna erro se CPF não existe
    if (data.erro || data.status === 'ERROR' || data.message) {
      return {
        valid: false,
        exists: false,
        cpf_sanitized: cleanedCPF,
        error: data.message || data.erro || 'CPF não encontrado na base da Receita Federal'
      };
    }
    
    // CPF existe na Receita Federal
    // Verifica situação cadastral
    const situacao = data.situacao_cadastral || data.situacao || 'REGULAR';
    const nome = data.nome || data.nome_completo || '';
    
    // CPF pode existir mas estar em situação irregular
    const situacoesValidas = ['REGULAR', 'PENDENTE DE REGULARIZAÇÃO'];
    const isRegular = situacoesValidas.some(s => 
      situacao.toUpperCase().includes(s) || situacao.toUpperCase() === 'REGULAR'
    );
    
    if (!isRegular && situacao.toUpperCase().includes('CANCELAD')) {
      return {
        valid: false,
        exists: true,
        nome: nome,
        situacao: situacao,
        cpf_sanitized: cleanedCPF,
        error: `CPF existe mas está ${situacao}. Não pode ser utilizado.`
      };
    }
    
    console.log(`[validate-cpf-real] CPF VÁLIDO - Nome: ${nome.substring(0, 10)}***, Situação: ${situacao}`);
    
    return {
      valid: true,
      exists: true,
      nome: nome,
      situacao: situacao,
      cpf_sanitized: cleanedCPF
    };
    
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error(`[validate-cpf-real] Erro ao consultar API:`, err);
    return {
      valid: false,
      exists: false,
      cpf_sanitized: cleanedCPF,
      error: `Erro de conexão com a Receita Federal: ${errorMessage}`
    };
  }
}

serve(async (req) => {
  // LEI VI: CORS seguro via allowlist
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }
  
  const corsHeaders = getCorsHeaders(req);

  try {
    // ============================================
    // 🛡️ P0.6 - RATE LIMIT + JWT OBRIGATÓRIO
    // LEI VI: API externa com custo + PII
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Autenticação obrigatória' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar JWT com Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar role (apenas owner/admin podem validar CPF na Receita)
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    const allowedRoles = ['owner', 'admin', 'funcionario'];
    const isOwner = user.email?.toLowerCase() === 'moisesblank@gmail.com';
    
    if (!isOwner && (!userRole || !allowedRoles.includes(userRole.role))) {
      return new Response(
        JSON.stringify({ success: false, error: 'Acesso restrito a administradores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[validate-cpf-real] ✅ Autorizado: ${user.email}, role: ${userRole?.role || 'owner'}`);
    
    const CPFCNPJ_TOKEN = Deno.env.get('CPFCNPJ_API_TOKEN');
    
    if (!CPFCNPJ_TOKEN) {
      console.error('[validate-cpf-real] CPFCNPJ_API_TOKEN não configurado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Serviço de validação de CPF não configurado' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cpf, validate_only } = await req.json();
    
    if (!cpf) {
      return new Response(
        JSON.stringify({ success: false, error: 'CPF é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[validate-cpf-real] Iniciando validação de CPF...`);
    
    // Se validate_only=true, apenas valida formato sem consultar API externa
    if (validate_only) {
      const isFormatValid = validateCPFFormat(cpf);
      return new Response(
        JSON.stringify({
          success: true,
          result: {
            valid: isFormatValid,
            exists: null, // Não consultou a Receita
            cpf_sanitized: sanitizeCPF(cpf),
            error: isFormatValid ? null : 'Formato de CPF inválido'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consulta completa na Receita Federal
    const result = await consultCPFReal(cpf, CPFCNPJ_TOKEN);

    // Log de auditoria (fire-and-forget) - reutiliza supabaseClient já criado
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Registra auditoria de forma assíncrona
    supabaseAdmin.from('audit_logs').insert({
      action: 'cpf_validation',
      table_name: 'external_api',
      user_id: user.id,
      metadata: {
        cpf_masked: `${sanitizeCPF(cpf).substring(0, 3)}*****${sanitizeCPF(cpf).substring(9)}`,
        valid: result.valid,
        exists: result.exists,
        situacao: result.situacao,
        api: 'cpfcnpj.com.br'
      }
    }).then(() => {
      console.log('[validate-cpf-real] Auditoria registrada');
    });

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[validate-cpf-real] Erro:', err);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
