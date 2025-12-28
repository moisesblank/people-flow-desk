// ============================================
// SERVICE: alunosService
// Centraliza queries e transformações de dados de alunos
// Separado da UI para testabilidade e manutenção
// ============================================

import { supabase } from "@/integrations/supabase/client";

// ============================================
// TIPOS
// ============================================
export interface WordPressUser {
  id: string;
  wp_user_id: number;
  email: string;
  nome: string;
  grupos: string[];
  status_acesso: string;
  tem_pagamento_confirmado: boolean;
  data_cadastro_wp: string | null;
  ultimo_login: string | null;
  updated_at: string | null;
  role: string | null;
}

export interface WordPressStats {
  total: number;
  ativos: number;
  comPagamento: number;
  semPagamento: number;
}

// ============================================
// FUNÇÕES DE QUERY
// ============================================

/**
 * Busca usuários WordPress com paginação
 */
export async function fetchWordPressUsers(limit: number = 100): Promise<WordPressUser[]> {
  const { data, error } = await supabase
    .from("usuarios_wordpress_sync")
    .select("id, wp_user_id, email, nome, status_acesso, grupos, tem_pagamento_confirmado, data_cadastro_wp, ultimo_login, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("[alunosService] Erro ao buscar usuários WP:", error);
    return [];
  }
  
  return (data || []).map(u => ({
    id: u.id,
    wp_user_id: u.wp_user_id,
    email: u.email,
    nome: u.nome || '',
    grupos: Array.isArray(u.grupos) ? (u.grupos as unknown as string[]) : [],
    status_acesso: u.status_acesso || 'aguardando_pagamento',
    tem_pagamento_confirmado: u.tem_pagamento_confirmado || false,
    data_cadastro_wp: u.data_cadastro_wp,
    ultimo_login: u.ultimo_login,
    updated_at: u.updated_at,
    role: null,
  }));
}

/**
 * Busca estatísticas de usuários WordPress via count queries
 */
export async function fetchWordPressStats(): Promise<WordPressStats> {
  const [totalRes, ativosRes, comPagRes] = await Promise.all([
    supabase.from("usuarios_wordpress_sync").select('*', { count: 'exact', head: true }),
    supabase.from("usuarios_wordpress_sync").select('*', { count: 'exact', head: true }).eq('status_acesso', 'ativo'),
    supabase.from("usuarios_wordpress_sync").select('*', { count: 'exact', head: true }).eq('tem_pagamento_confirmado', true),
  ]);
  
  const total = totalRes.count || 0;
  const comPagamento = comPagRes.count || 0;
  
  return {
    total,
    ativos: ativosRes.count || 0,
    comPagamento,
    semPagamento: total - comPagamento,
  };
}

/**
 * Busca dados completos de WordPress (usuários + stats)
 */
export async function fetchWordPressData(limit: number = 100): Promise<{
  users: WordPressUser[];
  stats: WordPressStats;
}> {
  const [users, stats] = await Promise.all([
    fetchWordPressUsers(limit),
    fetchWordPressStats(),
  ]);
  
  return { users, stats };
}
