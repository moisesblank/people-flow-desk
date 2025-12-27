# 🧠 MEMÓRIA DO PROJETO - GESTÃO MOISÉS MEDEIROS

> **DOCUMENTO SAGRADO** - Atualizado em: 22/12/2025
> **Versão**: OMEGA v3.0 - MELHORADO UM MILHÃO DE VEZES

---

## 🚨 REGRA MANDATÓRIA E OBRIGATÓRIA SOBERANA

> **READAPTAR O QUE TEMOS E SEMPRE MELHORAR... ESSA É A ÚNICA REGRA OBRIGATÓRIA E MANDATÓRIA.**
> 
> - A GENTE NÃO EXCLUI, SÓ EM EXTREMA NECESSIDADE E AUTORIZAÇÃO
> - SÓ SERÁ EXCLUÍDO ALGO DA PLATAFORMA SE O OWNER AUTORIZAR
> - O MÁXIMO AQUI É CRIAR E READAPTAR O QUE JÁ TEM
> - A GENTE SÓ AVANÇA, MELHORA, CRIA E READAPTA
> - ESTAMOS EM 2300: DESIGNER FUTURISTA, FACILIDADE, PRATICIDADE, INTELIGÊNCIA, AUTOMAÇÃO

---

## 📍 MAPA DE URLs DEFINITIVO (REGRA SUPREMA)

### Tabela de Acesso

| Quem | URL Base | Validação | Descrição |
|------|----------|-----------|-----------|
| 🌐 **NÃO PAGANTE** | `pro.moisesmedeiros.com.br/` | `role='viewer'` | Área comum + `/comunidade` |
| 👨‍🎓 **ALUNO BETA** | `pro.moisesmedeiros.com.br/alunos` | `role='beta'` | PAGANTE - Tudo do portal |
| 👔 **FUNCIONÁRIO** | `pro.moisesmedeiros.com.br/gestaofc` | `role='funcionario'` | Área de gestão (ROTA INTERNA) |
| 👑 **OWNER** | **TODAS** | `role='owner'` | MASTER - PODE TUDO |

### Owner Master (IMUTÁVEL)
- **Email**: `moisesblank@gmail.com`
- **Função**: `owner` (MASTER)
- **Acesso**: PODE TUDO EM TEMPO REAL

---

## 🔑 DADOS DO OWNER (IMUTÁVEIS)

| Campo | Valor |
|-------|-------|
| **Email** | moisesblank@gmail.com |
| **Nome** | Professor Moisés Medeiros |
| **Empresa 1** | MMM CURSO DE QUÍMICA LTDA (CNPJ: 53.829.761/0001-17) |
| **Empresa 2** | CURSO QUÍMICA MOISES MEDEIROS (CNPJ: 44.979.308/0001-04) |
| **Domínio Principal** | moisesmedeiros.com.br |

---

## 🔐 MATRIZ DE PERMISSÕES POR ROLE

| Role | Áreas Permitidas | Criar | Editar | Deletar | Exportar | Importar |
|------|------------------|-------|--------|---------|----------|----------|
| `owner` | **TODAS** | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin` | gestao, comunidade | ✅ | ✅ | ✅ | ✅ | ✅ |
| `funcionario` | gestao | ✅ | ✅ | ❌ | ✅ | ❌ |
| `suporte` | gestao | ❌ | ✅ | ❌ | ✅ | ❌ |
| `coordenacao` | gestao | ✅ | ✅ | ❌ | ✅ | ❌ |
| `monitoria` | gestao | ❌ | ✅ | ❌ | ❌ | ❌ |
| `marketing` | gestao | ✅ | ✅ | ❌ | ✅ | ✅ |
| `contabilidade` | gestao | ❌ | ✅ | ❌ | ✅ | ✅ |
| `professor` | gestao | ✅ | ✅ | ❌ | ✅ | ✅ |
| `beta` | alunos, comunidade | ❌ | ❌ | ❌ | ❌ | ❌ |
| `aluno` | alunos, comunidade | ❌ | ❌ | ❌ | ❌ | ❌ |
| `viewer` | comunidade | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 📁 ARQUIVOS DE CONTROLE DE ACESSO

| Arquivo | Função |
|---------|--------|
| `src/core/urlAccessControl.ts` | Controle de acesso por URL e role |
| `src/core/routes.ts` | Definição de 150+ rotas |
| `src/core/nav/navRouteMap.ts` | Mapeamento de 100+ itens de navegação |
| `src/hooks/useRolePermissions.tsx` | Hook de permissões (implementação) |
| `src/config/matriz-urls.ts` | Matriz sagrada de URLs |

---

## 📍 ROTAS POR ÁREA

### 🌐 Área Pública (Qualquer um)
```
/, /site, /auth, /termos, /privacidade, /area-gratuita, /cadastro, /login, /recuperar-senha
```

### 🌐 Comunidade (Não pagante + Beta)
```
/comunidade, /comunidade/forum, /comunidade/posts, /comunidade/membros, /comunidade/eventos, /comunidade/chat
```

### 👨‍🎓 Portal do Aluno Beta (Pagante)
```
/alunos, /alunos/dashboard, /alunos/cronograma, /alunos/videoaulas, /alunos/materiais,
/alunos/resumos, /alunos/mapas-mentais, /alunos/questoes, /alunos/simulados, /alunos/redacao,
/alunos/desempenho, /alunos/ranking, /alunos/conquistas, /alunos/tutoria, /alunos/forum,
/alunos/lives, /alunos/duvidas, /alunos/revisao, /alunos/laboratorio, /alunos/calculadora,
/alunos/tabela-periodica, /alunos/flashcards, /alunos/metas, /alunos/agenda, /alunos/certificados,
/alunos/perfil, /alunos/cursos, /alunos/aulas, /alunos/progresso, /alunos/historico
```

### 👔 Gestão (Funcionários)
```
/gestao, /gestao/dashboard, /gestao/dashboard-executivo, /gestao/tarefas, /gestao/integracoes,
/gestao/calendario, /gestao/funcionarios, /gestao/documentos, /gestao/perfil, /gestao/guia,
/gestao/marketing, /gestao/lancamento, /gestao/metricas, /gestao/arquivos, /gestao/area-professor,
/gestao/planejamento-aula, /gestao/laboratorio, /gestao/turmas-online, /gestao/turmas-presenciais,
/gestao/cursos, /gestao/simulados, /gestao/lives, /gestao/entradas, /gestao/financas-empresa,
/gestao/financas-pessoais, /gestao/pagamentos, /gestao/contabilidade, /gestao/transacoes-hotmart,
/gestao/gestao-alunos, /gestao/portal-aluno, /gestao/relatorios, /gestao/afiliados,
/gestao/permissoes, /gestao/configuracoes, /gestao/gestao-equipe, /gestao/gestao-site,
/gestao/gestao-dispositivos, /gestao/auditoria-acessos, /gestao/empresas/*
```

### 👑 Owner Only
```
/gestao/central-monitoramento, /gestao/diagnostico-whatsapp, /gestao/diagnostico-webhooks,
/gestao/site-programador, /gestao/central-diagnostico, /gestao/vida-pessoal, /gestao/pessoal,
/gestao/master, /gestao/owner, /central-diagnostico
```

---

## 🌐 ESTRUTURA DE DOMÍNIOS (MONO-DOMÍNIO v2.0 - Atualizado 27/12/2025)

| Subdomínio | Destino | Status |
|------------|---------|--------|
| `moisesmedeiros.com.br` | Redireciona para pro | ✅ REDIRECT 301 |
| `www.moisesmedeiros.com.br` | Redireciona para pro | ✅ REDIRECT 301 |
| `pro.moisesmedeiros.com.br` | **DOMÍNIO ÚNICO** - Tudo aqui | ✅ ATIVO |
| ~~`gestao.moisesmedeiros.com.br`~~ | ❌ REMOVIDO | 🚫 DELETADO 27/12/2025 |

---

## 🛠️ STACK TECNOLÓGICA

### Frontend
- React 19 + Vite
- Tailwind CSS 4
- shadcn/ui
- Framer Motion
- Zustand + React Query

### Backend (Lovable Cloud)
- PostgreSQL (Supabase)
- Edge Functions (Deno)
- Realtime
- Storage

### Infraestrutura
- **Servidor**: ci_xlarge (4 vCPU, 8GB RAM)
- **CDN**: Integrada ao Lovable Cloud
- **SSL**: Automático
- **DNS**: Cloudflare

---

## 📊 MÉTRICAS DO SISTEMA

| Métrica | Valor |
|---------|-------|
| **Rotas totais** | 150+ |
| **Itens de navegação** | 100+ |
| **Roles definidas** | 13 |
| **Áreas de acesso** | 5 (público, comunidade, aluno, gestão, owner) |
| **Edge Functions** | 30+ |
| **Tabelas** | 186 |

---

## 🚨 REGRAS INVIOLÁVEIS

1. **NUNCA** remover funcionalidades sem autorização do Owner
2. **NUNCA** expor dados sensíveis (salários, CPFs, etc.)
3. **NUNCA** desativar RLS nas tabelas
4. **SEMPRE** manter backup antes de mudanças críticas
5. **SEMPRE** testar em ambiente de preview antes de publicar
6. **SEMPRE** verificar email do Owner para acesso MASTER

---

## 📝 HISTÓRICO DE DECISÕES

| Data | Decisão | Responsável |
|------|---------|-------------|
| 22/12/2025 | Mapa de URLs OMEGA v3.0 definitivo | Owner |
| 22/12/2025 | Criação de `src/core/` para controle centralizado | Sistema |
| 20/12/2025 | Domínio principal será Lovable Cloud | Owner |

---

**✅ STATUS: PRONTO — MELHORADO UM MILHÃO DE VEZES!**

**ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS!**

---

*Documento mantido pelo sistema SYNAPSE OMEGA v5.0*
