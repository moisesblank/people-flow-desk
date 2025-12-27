# CONSTITUIÇÃO ROLES v1.0.0 — Nomenclatura Definitiva

**Data:** 2025-12-27  
**Status:** VIGENTE  
**Regra-mãe:** "employee" e "funcionario" são CATEGORIAS, não roles

---

## BLOCOS DO SISTEMA

### GESTÃO (Funcionários)
| Role | Label | Nível | Acesso |
|------|-------|-------|--------|
| `owner` | Proprietário | 0 | TOTAL + god_mode |
| `admin` | Administrador | 1 | Quase total (sem god_mode) |
| `coordenacao` | Coordenação | 2 | Alunos, cursos, relatórios |
| `contabilidade` | Contabilidade | 2 | Financeiro completo |
| `suporte` | Suporte | 3 | Atendimento a alunos |
| `monitoria` | Monitoria | 3 | Acompanhamento pedagógico |
| `marketing` | Marketing | 3 | Campanhas e analytics |
| `afiliado` | Afiliados | 3 | Gestão de afiliações |

### ALUNOS
| Role | Label | Nível | Acesso |
|------|-------|-------|--------|
| `beta` | Aluno Beta | 1 | Portal completo + comunidade premium |
| `aluno_gratuito` | Aluno Gratuito | 2 | Apenas área gratuita |

---

## REGRAS OBRIGATÓRIAS

1. **NUNCA** usar "employee" ou "funcionario" como role — são CATEGORIAS
2. Um usuário do staff TEM uma role específica (suporte, monitoria, etc.)
3. Verificar acesso à gestão: `ANY OF ['owner','admin','coordenacao','contabilidade','suporte','monitoria','marketing','afiliado']`
4. Verificar acesso de aluno: `ANY OF ['beta', 'aluno_gratuito']`
5. OWNER bypass tudo exceto segurança server-side

---

## GLOSSÁRIO

| Termo | Significado |
|-------|-------------|
| **ROLE** | Nível de permissão (ex: `suporte`) — define o que pode acessar |
| **CARGO** | Descrição humana (ex: "Desenvolvedor Sênior") — apenas exibição |
| **SETOR** | Área da empresa (ex: "Marketing") — agrupamento organizacional |

---

## FUNÇÃO is_gestao_staff()

```sql
-- Verifica se usuário é staff de gestão (qualquer role de funcionário)
CREATE OR REPLACE FUNCTION public.is_gestao_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('owner', 'admin', 'coordenacao', 'contabilidade', 'suporte', 'monitoria', 'marketing', 'afiliado')
  )
$$;
```
