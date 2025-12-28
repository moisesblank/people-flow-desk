// ============================================
// CORREIOS API - EDGE FUNCTION
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// Integração Oficial com API dos Correios
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URLs da API dos Correios
const CORREIOS_API_BASE = 'https://api.correios.com.br';
const CORREIOS_AUTH_URL = `${CORREIOS_API_BASE}/token/v1/autentica/cartaopostagem`;
const CORREIOS_CEP_URL = `${CORREIOS_API_BASE}/cep/v2/enderecos`;
const CORREIOS_RASTRO_URL = `${CORREIOS_API_BASE}/srorastro/v1/objetos`;
const CORREIOS_PRECO_URL = `${CORREIOS_API_BASE}/preco/v1/nacional`;

interface CorreiosToken {
  token: string;
  expiraEm: string;
}

let cachedToken: CorreiosToken | null = null;

// Autenticar na API dos Correios
async function getCorreiosToken(): Promise<string> {
  // Verificar cache
  if (cachedToken && new Date(cachedToken.expiraEm) > new Date()) {
    return cachedToken.token;
  }

  const usuario = Deno.env.get('CORREIOS_USUARIO');
  const senha = Deno.env.get('CORREIOS_SENHA');
  const cartaoPostagem = Deno.env.get('CORREIOS_CARTAO_POSTAGEM');

  if (!usuario || !senha || !cartaoPostagem) {
    throw new Error('Credenciais dos Correios não configuradas');
  }

  const credentials = btoa(`${usuario}:${senha}`);
  
  const response = await fetch(CORREIOS_AUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      numero: cartaoPostagem
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[CORREIOS] Erro na autenticação:', response.status, errorText);
    throw new Error(`Falha na autenticação Correios: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.token,
    expiraEm: data.expiraEm,
  };

  console.log('[CORREIOS] Token obtido com sucesso');
  return cachedToken.token;
}

// Validar CEP via API oficial
async function validarCep(cep: string): Promise<any> {
  const cepLimpo = cep.replace(/\D/g, '');
  
  if (cepLimpo.length !== 8) {
    throw new Error('CEP inválido: deve ter 8 dígitos');
  }

  const token = await getCorreiosToken();

  const response = await fetch(`${CORREIOS_CEP_URL}/${cepLimpo}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('CEP não encontrado');
    }
    const errorText = await response.text();
    console.error('[CORREIOS] Erro ao validar CEP:', response.status, errorText);
    throw new Error(`Erro ao validar CEP: ${response.status}`);
  }

  const data = await response.json();
  console.log('[CORREIOS] CEP validado:', cepLimpo);
  
  return {
    cep: data.cep,
    logradouro: data.logradouro,
    complemento: data.complemento || '',
    bairro: data.bairro,
    cidade: data.localidade,
    estado: data.uf,
    validado: true,
    validado_at: new Date().toISOString(),
  };
}

// Rastrear objeto
async function rastrearObjeto(codigo: string): Promise<any> {
  const codigoLimpo = codigo.replace(/\s/g, '').toUpperCase();
  
  // Validar formato do código (13 caracteres: 2 letras + 9 números + 2 letras)
  const regexRastreio = /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/;
  if (!regexRastreio.test(codigoLimpo)) {
    throw new Error('Código de rastreio inválido');
  }

  const token = await getCorreiosToken();

  const response = await fetch(`${CORREIOS_RASTRO_URL}/${codigoLimpo}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Objeto não encontrado');
    }
    const errorText = await response.text();
    console.error('[CORREIOS] Erro ao rastrear:', response.status, errorText);
    throw new Error(`Erro ao rastrear objeto: ${response.status}`);
  }

  const data = await response.json();
  console.log('[CORREIOS] Objeto rastreado:', codigoLimpo);
  
  // Mapear eventos
  const eventos = data.objetos?.[0]?.eventos?.map((ev: any) => ({
    data: ev.dtHrCriado,
    local: `${ev.unidade?.endereco?.cidade || ''} - ${ev.unidade?.endereco?.uf || ''}`,
    descricao: ev.descricao,
    tipo: ev.codigo,
  })) || [];

  const ultimoEvento = eventos[0];
  const entregue = ultimoEvento?.tipo === 'BDE' || ultimoEvento?.tipo === 'BDI';

  return {
    codigo: codigoLimpo,
    validado: true,
    validado_at: new Date().toISOString(),
    eventos,
    ultimo_evento: ultimoEvento,
    entregue,
    data_entrega: entregue ? ultimoEvento.data : null,
  };
}

// Calcular preço e prazo
async function calcularPreco(params: {
  cepOrigem: string;
  cepDestino: string;
  peso: number; // em gramas
  altura: number; // em cm
  largura: number; // em cm
  comprimento: number; // em cm
  servico: string; // '04510' = SEDEX, '04014' = PAC
}): Promise<any> {
  const token = await getCorreiosToken();

  const response = await fetch(CORREIOS_PRECO_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cepOrigem: params.cepOrigem.replace(/\D/g, ''),
      cepDestino: params.cepDestino.replace(/\D/g, ''),
      peso: params.peso.toString(),
      altura: params.altura.toString(),
      largura: params.largura.toString(),
      comprimento: params.comprimento.toString(),
      codigoProduto: params.servico,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[CORREIOS] Erro ao calcular preço:', response.status, errorText);
    throw new Error(`Erro ao calcular preço: ${response.status}`);
  }

  const data = await response.json();
  console.log('[CORREIOS] Preço calculado');
  
  return {
    valor: parseFloat(data.valorTotalFinal || data.valorProduto || '0'),
    prazo_dias: parseInt(data.prazoEntrega || '0', 10),
    servico: params.servico,
    servico_nome: params.servico === '04510' ? 'SEDEX' : params.servico === '04014' ? 'PAC' : 'Outro',
  };
}

// Verificar se usuário tem permissão (owner/admin) - usa service role para bypass RLS
async function verificarPermissao(serviceSupabase: any, userId: string): Promise<boolean> {
  const { data: roles, error } = await serviceSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['owner', 'admin']);

  if (error) {
    console.error('[CORREIOS] Erro ao verificar permissão:', error);
    return false;
  }

  return roles && roles.length > 0;
}

// Handler principal
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Service role client para operações internas (bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    console.log('[CORREIOS] Auth header presente:', !!authHeader);
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair token (remover "Bearer " se presente)
    const token = authHeader.replace(/^Bearer\s+/i, '');
    console.log('[CORREIOS] Token length:', token?.length);

    // Extrair user do token para pegar o ID
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: `Bearer ${token}` } 
        } 
      }
    );
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    console.log('[CORREIOS] getUser result:', { userId: user?.id, error: userError?.message });
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permissão usando service role (bypass RLS)
    const temPermissao = await verificarPermissao(supabase, user.id);
    if (!temPermissao) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado: apenas owner/admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar credenciais Correios
    const usuario = Deno.env.get('CORREIOS_USUARIO');
    if (!usuario) {
      return new Response(
        JSON.stringify({ 
          error: 'Correios oficial não integrado',
          message: 'As credenciais da API dos Correios não estão configuradas. Envio bloqueado.',
          correios_configurado: false 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = await req.json();
    console.log(`[CORREIOS] Action: ${action}`);

    let result;

    switch (action) {
      case 'validar_cep':
        if (!params.cep) throw new Error('CEP obrigatório');
        result = await validarCep(params.cep);
        break;

      case 'rastrear':
        if (!params.codigo) throw new Error('Código de rastreio obrigatório');
        result = await rastrearObjeto(params.codigo);
        break;

      case 'calcular_frete':
        if (!params.cepOrigem || !params.cepDestino) {
          throw new Error('CEP de origem e destino obrigatórios');
        }
        result = await calcularPreco({
          cepOrigem: params.cepOrigem,
          cepDestino: params.cepDestino,
          peso: params.peso || 500,
          altura: params.altura || 10,
          largura: params.largura || 15,
          comprimento: params.comprimento || 20,
          servico: params.servico || '04014', // PAC por padrão
        });
        break;

      case 'status':
        // Verificar se API está configurada e funcionando
        try {
          await getCorreiosToken();
          result = { 
            correios_configurado: true, 
            api_disponivel: true,
            message: 'API Correios configurada e funcionando'
          };
        } catch (e: any) {
          result = { 
            correios_configurado: true, 
            api_disponivel: false,
            message: 'API Correios configurada mas indisponível',
            error: e?.message || 'Erro desconhecido'
          };
        }
        break;

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CORREIOS] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Erro interno',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});