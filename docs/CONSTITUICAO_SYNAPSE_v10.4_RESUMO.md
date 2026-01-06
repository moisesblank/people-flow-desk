# CONSTITUIÇÃO SYNAPSE Ω v10.4 — RESUMO EXECUTIVO
> **Cérebro Ativo** | Última atualização: 2026-01-06
> **Referência completa:** `docs/CONSTITUICAO_SYNAPSE_v10.4.md`

---

## 1. DOGMAS INVIOLÁVEIS

| Dogma | Regra | Violação = |
|-------|-------|-----------|
| **SÓ AVANÇA** | Nunca deletar features sem autorização OWNER | Rollback proibido |
| **PATCH-ONLY** | Mudanças via diff incremental, nunca reescrever arquivos inteiros | Rejeição automática |
| **IDENTIDADE** | `owner` é exclusivo para `moisesblank@gmail.com` | Segurança comprometida |
| **VERIFICAÇÃO FINAL** | Nada é "PRONTO" sem prova documental | Declarar "NÃO PRONTO" |

---

## 2. SISTEMA DE ROLES (12 papéis)

```typescript
type UserRole = 
  | 'owner'           // Deus do sistema - moisesblank@gmail.com EXCLUSIVO
  | 'admin'           // Gestão total (exceto permissões)
  | 'coordenacao'     // Pedagógico + alunos
  | 'contabilidade'   // Financeiro read-only
  | 'suporte'         // Atendimento + tickets
  | 'monitoria'       // Dúvidas + comunidade
  | 'marketing'       // Conteúdo + analytics
  | 'afiliado'        // Comissões próprias
  | 'beta'            // Aluno pagante - ACESSO: /alunos/*
  | 'aluno_gratuito'  // Área gratuita apenas
  | 'viewer'          // Público apenas
  | null;             // Sem role = /perfil-incompleto
```

### Verificação SQL Canônica
```sql
SELECT public.is_owner();           -- true se moisesblank@gmail.com
SELECT public.has_role('admin');    -- true se admin ou owner
SELECT public.is_beta_or_above();   -- true se beta, staff ou owner
```

---

## 3. ROTEAMENTO CANÔNICO

### 3.1 Redirecionamento Pós-Login
| Role | Destino |
|------|---------|
| owner | `/gestaofc` |
| admin, coordenacao, contabilidade, suporte, monitoria, marketing, afiliado | `/gestaofc` |
| beta | `/alunos/dashboard` |
| aluno_gratuito | `/comunidade` |
| null (sem role) | `/perfil-incompleto` |
| autenticado sem sessão | `/auth` |

### 3.2 Rotas Críticas
```typescript
// OWNER ONLY - bloqueio absoluto
const OWNER_ONLY = ['/permissoes', '/nuclear', '/system-guard'];

// PÚBLICAS - sem auth
const PUBLIC = ['/', '/auth', '/certificado/*', '/comunidade'];

// PORTAL ALUNO - raiz canônica
const PORTAL_ALUNO = '/alunos';  // NÃO '/aluno'

// GESTÃO - staff only
const GESTAO = '/gestaofc';
```

### 3.3 Redirecionamentos Legados
| Legado | → Canônico |
|--------|-----------|
| `/aluno` | `/alunos` |
| `/ALUNOS` | `/alunos` |
| `/alunos/livros-web` | `/alunos/livro-web` |
| `/dashboard` | `/gestaofc` |

---

## 4. SEGURANÇA — ESTADO ATUAL

### 4.1 Quatro Camadas
| Camada | Nome | Status v10.4 |
|--------|------|-------------|
| 1 | Supabase Auth | ✅ ATIVO |
| 2 | RLS Policies | ✅ ATIVO |
| 3 | Edge Functions Auth | ✅ ATIVO |
| 4 | SessionGuard/DeviceGuard | ⚠️ **BYPASS ATIVO** |

### 4.2 Plano A Nuclear (ATIVO)
```typescript
// Componentes em modo passthrough:
- SessionGuard.tsx      → <>{children}</>
- DeviceLimitGate.tsx   → <>{children}</>
- ActiveSessionGate.tsx → <>{children}</>
- DeviceMFAGuard.tsx    → <>{children}</>
- LeiVIIEnforcer.tsx    → <>{children}</>

// Condição para restaurar:
// 7 dias consecutivos sem tela preta + autorização INTERNAL_SECRET
```

### 4.3 Nuclear Lockdown
```sql
-- Kill Switch Global
UPDATE system_guard SET auth_enabled = false;  -- Bloqueia TUDO

-- Invalidar Todas Sessões
UPDATE system_guard SET auth_epoch = auth_epoch + 1;
```

### 4.4 Política de Sessão
```
LOGOUT = DELETE físico da active_sessions
NOVO LOGIN = DELETE todas sessões anteriores do user + INSERT nova
```

---

## 5. QUESTION DOMAIN

### 5.1 Taxonomia Soberana (5 Macros)
```typescript
const MACROS_QUIMICA = [
  'Química Geral',
  'Físico-Química', 
  'Química Orgânica',
  'Química Ambiental',
  'Bioquímica'
] as const;  // EXATAMENTE 5 - qualquer implementação com menos é INVÁLIDA
```

### 5.2 Modos de Questão
| Modo | XP | Onde Aparece |
|------|-----|-------------|
| `MODO_TREINO` | 0 | `/alunos/questoes` |
| `SIMULADO` | 10 | `/alunos/simulados` |

### 5.3 Notação Química (LEI v2.4)
- **SOBRESCRITO**: Configurações (1s², 2p⁶), cargas (Mg²⁺, F⁻)
- **SUBSCRITO**: Índices moleculares (H₂O), estados físicos

---

## 6. GAMIFICAÇÃO

### 6.1 XP por Ação
| Ação | XP |
|------|-----|
| Resposta correta (simulado) | +10 |
| Resposta correta (treino) | 0 |
| Streak 7 dias | +50 |
| Primeiro login dia | +5 |

### 6.2 Níveis
| Nível | XP Necessário |
|-------|--------------|
| 1-10 | 100 × nível |
| 11-20 | 150 × nível |
| 21-50 | 200 × nível |
| 51+ | 300 × nível |

### 6.3 Ranking Semanal
- Tabela: `weekly_xp` (PK composta: user_id + week_start)
- Reset: Segunda-feira 00:00 UTC-3
- Top 3: Badges especiais

---

## 7. ÁREAS DO SISTEMA

```typescript
const SYSTEM_AREAS = [
  'owner_area',      // /permissoes, /nuclear
  'gestao',          // /gestaofc/*
  'financeiro',      // /financeiro/*
  'alunos_gestao',   // /alunos-gestao/*
  'cursos',          // /cursos/*
  'portal_aluno',    // /alunos/*
  'comunidade',      // /comunidade
  'public'           // /, /auth
] as const;
```

---

## 8. LEIS DE EXECUÇÃO

| Lei | Regra |
|-----|-------|
| I | Não criar tabelas sem RLS |
| II | Não expor secrets em código |
| III | Não hardcodar roles - usar `user_roles` |
| IV | Invalidar cache após mudanças estruturais |
| V | Ordenação alfabética pt-BR em seletores |
| VI | Owner bypass em conflitos de sessão |
| VII | Verificação final obrigatória |
| VIII | Password change required antes de redirecionar |

---

## 9. ARQUIVOS CRÍTICOS (NUNCA DELETAR)

```
src/hooks/useRolePermissions.tsx    # Sistema de permissões
src/hooks/useAuth.tsx               # Autenticação central
src/core/areas/index.ts             # Áreas e permissões
src/pages/Auth.tsx                  # Login/Register
src/pages/alunos/AlunosRouteSwitcher.tsx  # Router do portal
```

---

## 10. CHECKLIST VERIFICAÇÃO FINAL

- [ ] Zero erros no console
- [ ] Preview funcionando
- [ ] Dados persistindo no banco
- [ ] RLS policies verificadas
- [ ] Sem regressões em outras áreas

> **SE FALHAR**: Declarar "NÃO PRONTO" + causa raiz + plano de correção

---

## REFERÊNCIAS

- **Documento Completo**: `docs/CONSTITUICAO_SYNAPSE_v10.4.md`
- **Memórias Ativas**: Ver `<useful-context>` no prompt
- **Edge Functions**: 94 funções - consultar `/supabase/functions/`
- **Tabelas**: 186 tabelas - consultar tipos gerados
