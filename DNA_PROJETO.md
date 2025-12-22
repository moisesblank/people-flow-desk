# 🧬 DNA GENÉTICO DO PROJETO - MOISÉS MEDEIROS
## Documento Sagrado - Fonte da Verdade Absoluta
## Versão 1.0 | Incorporado em: 22/12/2025

---

# 🔒 REGRA MATRIZ SUPREMA

```
╔═══════════════════════════════════════════════════════════════════╗
║  ❌ NÃO PIORA      ❌ NÃO REMOVE     ❌ NÃO QUEBRA                ║
║  ✅ SÓ MELHORA     ✅ SÓ ADAPTA      ✅ SÓ EVOLUI                 ║
║                                                                   ║
║  O QUE EXISTE É SAGRADO. O DNA GUIA. A MATRIZ PROTEGE.           ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

# PARTE 0: O PRIMADO — A DIRETIVA MESTRA

| Conceito | Diretiva |
|----------|----------|
| **Missão** | Construir a plataforma de e-learning mais segura, performática e pedagogicamente avançada do Brasil |
| **Inimigo** | A mediocridade. Lentidão, bugs, falhas de segurança e UX pobre são INACEITÁVEIS |
| **Estado de Vitória** | 5.000 alunos simultâneos em aula ao vivo, com chat, gamificação e IA rodando fluido, mesmo em 3G |
| **Owner** | Moises Medeiros Melo (moisesblank@gmail.com) - Palavra final, acesso absoluto, role = 'owner' |

---

# PARTE 1: OS TRÊS PILARES

## 🛡️ 1. Segurança Paranoica
- Acesso é PRIVILÉGIO, não direito
- O padrão é NEGAR
- Confiança ZERO
- Cada requisição validada em múltiplas camadas

## ⚡ 2. Performance Obsessiva
- Interface INSTANTÂNEA
- Backend RESILIENTE
- Código otimizado para MENOR LATÊNCIA

## 🤖 3. IA Pedagógica
- IA não é gimmick, é FERRAMENTA
- Resumos, flashcards, mapas mentais, simulados
- Tutor TRAMON disponível 24/7

---

# PARTE 2: STACK TECNOLÓGICA

| Camada | Tecnologia | Status | Justificativa |
|--------|------------|--------|---------------|
| **Frontend** | React + TypeScript + Vite | ✅ TEMOS | SPA reativa, tipagem forte, build rápido |
| **UI/Estilo** | TailwindCSS + Shadcn/UI | ✅ TEMOS | Agilidade + customização |
| **Backend** | Supabase (PostgreSQL) | ✅ TEMOS | BaaS com RLS nativo |
| **Serverless** | Edge Functions (Deno) | ✅ TEMOS (55) | Lógica segura na borda |
| **Pagamentos** | Hotmart | ✅ TEMOS | Webhooks integrados |
| **Vídeo** | Panda Video | ✅ TEMOS | URLs assinadas, watermark CPF |
| **IA Dev** | Cursor ULTRA | ✅ ATIVO | O Executor |
| **IA Prod** | OpenAI API | ✅ CONFIGURADO | gpt-4o-mini |

### ⛔ PROIBIDO
- **NEXT.JS** - NÃO USAR

---

# PARTE 3: ESTRUTURA DE USUÁRIOS

## Hierarquia de Roles

```sql
CREATE TYPE public.user_role AS ENUM (
  'owner',           -- Moises - Acesso ABSOLUTO
  'beta',            -- Aluno pagante com acesso ativo
  'aluno_gratuito',  -- Acesso apenas à comunidade/área gratuita
  'funcionario'      -- Equipe categorizada
);
```

## URLs por Role

| Role | URL Principal | Acesso |
|------|---------------|--------|
| **owner** | Todas | 👑 SUPREMO |
| **funcionario** | `gestao.moisesmedeiros.com.br` | 👔 Por categoria |
| **beta** | `pro.moisesmedeiros.com.br/alunos` | 👨‍🎓 Conteúdo pago |
| **aluno_gratuito** | `pro.moisesmedeiros.com.br` | 🌐 Área gratuita |

## Redirecionamentos

```
www.moisesmedeiros.com.br → pro.moisesmedeiros.com.br (HOME)
```

---

# PARTE 4: SCHEMA DO BANCO (DNA)

## Tabela profiles (Core)

```sql
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email character varying NOT NULL,
    name character varying,
    cpf character varying(11) UNIQUE,
    avatar_url text,
    role public.user_role NOT NULL DEFAULT 'aluno_gratuito',
    access_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    -- Gamificação
    level integer DEFAULT 1 NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    -- IA
    churn_risk_score real,
    learning_style text,
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
```

## Tabelas de Conteúdo

```sql
-- Cursos
CREATE TABLE public.courses (id bigserial PRIMARY KEY, title text NOT NULL, description text);
CREATE TABLE public.modules (id bigserial PRIMARY KEY, course_id bigint REFERENCES courses(id), title text NOT NULL, position int NOT NULL);
CREATE TABLE public.lessons (id bigserial PRIMARY KEY, module_id bigint REFERENCES modules(id), title text NOT NULL, video_id_panda text, transcript text, position int NOT NULL);

-- Progresso
CREATE TABLE public.lesson_progress (user_id uuid REFERENCES profiles(id), lesson_id bigint REFERENCES lessons(id), completed_at timestamptz, PRIMARY KEY (user_id, lesson_id));

-- Questões
CREATE TABLE public.questions (id bigserial PRIMARY KEY, lesson_id bigint REFERENCES lessons(id), text text NOT NULL, options jsonb NOT NULL, correct_answer_id text NOT NULL, explanation text);
CREATE TABLE public.question_attempts (id bigserial PRIMARY KEY, user_id uuid REFERENCES profiles(id), question_id bigint REFERENCES questions(id), is_correct boolean NOT NULL, attempted_at timestamptz DEFAULT now());

-- Flashcards (FSRS)
CREATE TABLE public.flashcards (id bigserial PRIMARY KEY, user_id uuid REFERENCES profiles(id), question_id bigint REFERENCES questions(id), front text NOT NULL, back text NOT NULL, state flashcard_state DEFAULT 'new', due date NOT NULL, stability real, difficulty real, reps int, lapses int);

-- Cache IA
CREATE TABLE public.ai_content_cache (lesson_id bigint, content_type text, content jsonb, PRIMARY KEY (lesson_id, content_type));
```

---

# PARTE 5: POLÍTICAS DE RLS (Muralha Tripla)

## Princípio
- NADA é público por padrão
- Acesso concedido EXPLICITAMENTE
- `auth.uid()` é a âncora

## Função Crítica: is_beta_or_owner()

```sql
CREATE OR REPLACE FUNCTION public.is_beta_or_owner()
RETURNS boolean AS $$
  SELECT (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner' OR
    (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'beta' AND
      (SELECT access_expires_at FROM public.profiles WHERE id = auth.uid()) > now()
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

## Políticas Padrão

```sql
-- profiles: Ver/editar próprio OU owner vê/edita todos
-- lessons: Apenas owner OU beta ativo
-- questions: Apenas owner OU beta ativo
-- courses: Apenas owner OU beta ativo
-- modules: Apenas owner OU beta ativo
```

---

# PARTE 6: EDGE FUNCTIONS CRÍTICAS

## 1. webhook-hotmart

**Lógica Inviolável:**
1. Recebe POST da Hotmart
2. Valida `hottok`
3. SE approved → role = 'beta', access_expires_at = +365 dias
4. SE refunded/chargeback → role = 'aluno_gratuito'
5. Retorna 200 OK

## 2. generate-ai-content

**Lógica:**
1. Recebe lessonId + contentType
2. Valida autenticação
3. Verifica is_beta_or_owner()
4. Checa cache → retorna se existe
5. Busca transcrição → chama OpenAI
6. Salva cache → retorna

---

# PARTE 7: FRONTEND - GUARDAS

## ProtectedRoute.tsx

```typescript
// Lógica:
// 1. Se carregando → Skeleton
// 2. Se !hasAccess:
//    - Se aluno_gratuito → /comunidade
//    - Senão → /login
// 3. Se hasAccess → renderiza children
```

## AuthContext.tsx

```typescript
// hasAccess = 
//   role === 'owner' || 
//   (role === 'beta' && access_expires_at > now())
```

---

# PARTE 8: OS 10 MANDAMENTOS DA IA (MESTRE)

| # | Mandamento |
|---|------------|
| 1 | **SERVIR A ESTE DNA** - Fonte única de verdade |
| 2 | **NÃO EXPOR CHAVES** - Nunca no cliente |
| 3 | **RLS EM TUDO** - Toda tabela nasce protegida |
| 4 | **VALIDAR NO SERVIDOR** - Ações críticas em Edge Functions |
| 5 | **OTIMIZAR CADA BYTE** - React.lazy, memo, useCallback, virtualização |
| 6 | **SER TIPADO** - TypeScript é LEI |
| 7 | **NÃO CONFIAR NO USUÁRIO** - Sanitizar toda entrada |
| 8 | **COMPONENTES ATÔMICOS** - Reutilizáveis, testáveis, independentes |
| 9 | **PENSAR EM ESTADOS** - Loading, error, success, empty |
| 10 | **SEM ACHISMOS** - Dúvida? Está no DNA. Se não, PERGUNTAR |

---

# PARTE 9: PROTOCOLO DE DESENVOLVIMENTO

```
┌─────────────────────────────────────────────────────────────────┐
│                    A TRINDADE SAGRADA                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   👑 ARQUITETO (Moises)                                         │
│   └── Define visão, estratégia, diretivas                       │
│       └── Gera o DNA                                            │
│                                                                 │
│   🤖 EXECUTOR (MESTRE/Cursor)                                   │
│   └── Recebe diretiva + DNA                                     │
│       └── Gera código com precisão cirúrgica                    │
│           └── Audita segurança e performance                    │
│                                                                 │
│   🌐 PLATAFORMA (Lovable)                                       │
│   └── Recebe código validado                                    │
│       └── Compila, deploy, serve                                │
│                                                                 │
│   FLUXO: Arquiteto → Executor → Plataforma                      │
│   (UNIDIRECIONAL - SEM DESVIOS)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# PARTE 10: CRUZAMENTO DNA × MATRIZ SAGRADA

## ✅ JÁ EXISTE E ESTÁ ALINHADO

| Item | Status |
|------|--------|
| React + TypeScript + Vite | ✅ |
| TailwindCSS + Shadcn/UI | ✅ |
| Supabase + Edge Functions | ✅ |
| Sistema de roles | ✅ |
| Gamificação (XP, Level) | ✅ |
| Flashcards | ✅ |
| IA TRAMON | ✅ |
| Hotmart webhook | ✅ |
| RLS ativo | ✅ |
| Performance otimizada | ✅ |

## 🔄 PRECISA ADAPTAR

| Item | Ação |
|------|------|
| Roles ENUM | Verificar se tem owner/beta/aluno_gratuito/funcionario |
| is_beta_or_owner() | Verificar se função existe |
| ProtectedRoute | Verificar lógica de hasAccess |
| webhook-hotmart | Verificar lógica de upgrade/downgrade |
| Cache de IA | Verificar tabela ai_content_cache |

## 🆕 PRECISA CRIAR/MELHORAR

| Item | Prioridade |
|------|------------|
| Validação completa de acesso por role | 🔴 ALTA |
| Testes de todos os botões | 🔴 ALTA |
| Correção de funcionalidades quebradas | 🔴 ALTA |

---

*DNA INCORPORADO AO SISTEMA*
*MESTRE está alinhado com a Fonte da Verdade*
*22/12/2025*
