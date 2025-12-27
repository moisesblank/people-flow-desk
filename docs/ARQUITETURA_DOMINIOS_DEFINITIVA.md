# 🏛️ MATRIZ SUPREMA DE DOMÍNIOS, BLOCOS ASSOCIATIVOS E REDIRECIONAMENTO

> **Status:** VIGENTE PARA SEMPRE — FONTE ÚNICA DA VERDADE  
> **Data de Fixação:** 27/12/2025  
> **OWNER:** MOISESBLANK@GMAIL.COM  
> **Regra:** NUNCA ALTERAR ESTA ESTRUTURA SEM AUTORIZAÇÃO EXPLÍCITA DO OWNER

---

## 📡 1) MATRIZ DE DOMÍNIOS (HIERARQUIA FIXA)

| Prioridade | Domínio | Estado | Regra |
|:----------:|---------|--------|-------|
| N0 | http://www.moisesmedeiros.com.br | Entrada | Redirecionar 100% |
| N0 | https://moisesmedeiros.com.br | Entrada | Redirecionar 100% |
| N1 | https://pro.moisesmedeiros.com.br | **NÚCLEO** | Domínio oficial único |
| N2 | https://gestao.moisesmedeiros.com.br | **LEGADO** | PROIBIDO/BLOQUEADO |

**Destino único de redirecionamento N0 →** `https://pro.moisesmedeiros.com.br`

---

## 🧱 2) MATRIZ DE BLOCOS ASSOCIATIVOS (INSEPARÁVEIS)

| Bloco | Rotas incluídas (todas obrigatórias) | Papel |
|-------|--------------------------------------|-------|
| **PUBLICO** | `/`, `/comunidade`, `/auth` | TODOS |
| **GESTAO** | `/gestaofc`, `/gestaofc/*` | FUNCIONARIO |
| **ALUNOS** | `/alunos`, `/alunos/*` | BETA |
| **OWNER** | TODOS OS BLOCOS | OWNER |

**Regra:** Usuários pertencem a **BLOCOS**, não a páginas individuais. Blocos são **INDIVISÍVEIS**.

---

## 🔐 3) MATRIZ DE AUTENTICAÇÃO (PONTO ÚNICO)

| Regra | Valor |
|-------|-------|
| URL de login | `https://pro.moisesmedeiros.com.br/auth` |
| Outros logins | **PROIBIDOS** |
| Página final | **NUNCA** é `/auth` (sempre redireciona) |

---

## 🔄 4) MATRIZ DE REDIRECIONAMENTO PÓS-LOGIN (ABSOLUTA)

| Role | Bloco concedido | Redirecionamento obrigatório |
|------|-----------------|------------------------------|
| **OWNER** | PUBLICO + GESTAO + ALUNOS | `/gestaofc` |
| **FUNCIONARIO** | GESTAO | `/gestaofc` |
| **BETA** | ALUNOS | `/alunos` |
| **FREE** | PUBLICO | `/comunidade` |

```typescript
// Implementação em src/core/urlAccessControl.ts → getPostLoginRedirect()
if (email === OWNER_EMAIL || role === "owner") {
  redirect("/gestaofc");  // Owner vai pro backoffice
} else if (isGestaoRole(role)) {
  redirect("/gestaofc");  // Staff vai pro backoffice  
} else if (isAlunoRole(role)) {
  redirect("/alunos");    // Aluno pagante vai pro portal
} else {
  redirect("/comunidade"); // Free vai pra comunidade
}
```

---

## 🚫 5) MATRIZ DE NEGATIVA (ANTI-EXCEÇÃO)

| Condição | Ação |
|----------|------|
| Rota fora do bloco | **NEGAR** ou **REDIRECIONAR** |
| Tentativa de exceção | **BLOQUEAR** |
| Conteúdo parcial | **PROIBIDO** |

---

## ⛔ 6) MATRIZ DO DOMÍNIO LEGADO

| URL | Tratamento |
|-----|------------|
| `https://gestao.moisesmedeiros.com.br` | **BLOQUEADO** |
| Destino para staff/owner | `https://pro.moisesmedeiros.com.br/gestaofc` |
| Destino para outros | `https://pro.moisesmedeiros.com.br/` |

**Implementação:** `src/components/routing/LegacyDomainBlocker.tsx`

---

## ⚖️ 7) REGRA FINAL (NÃO INTERPRETAR)

1. Usuários pertencem a **BLOCOS**, não a páginas.
2. Blocos são **INDIVISÍVEIS**.
3. Toda decisão é feita por **ROLE**.
4. Nenhuma rota existe fora desta matriz.
5. **Qualquer divergência é ERRO.**

---

## 👥 ROLES E PERMISSÕES

### Hierarquia de Roles

```
OWNER (👑)
  │
  ├── admin
  │     ├── coordenacao
  │     ├── professor
  │     └── monitoria
  │
  ├── funcionario / employee
  │     ├── suporte
  │     ├── marketing
  │     └── contabilidade
  │
  └── beta (aluno pagante)
        └── viewer (aluno free)
```

### Matriz de Acesso por Role

| Role | `/` | `/comunidade` | `/alunos` | `/gestaofc` |
|------|-----|---------------|-----------|-------------|
| owner | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| funcionario | ✅ | ❌ | ❌ | ✅ |
| employee | ✅ | ❌ | ❌ | ✅ |
| suporte | ✅ | ❌ | ❌ | ✅ |
| marketing | ✅ | ❌ | ❌ | ✅ |
| contabilidade | ✅ | ❌ | ❌ | ✅ |
| coordenacao | ✅ | ❌ | ❌ | ✅ |
| professor | ✅ | ❌ | ❌ | ✅ |
| monitoria | ✅ | ❌ | ❌ | ✅ |
| beta | ✅ | ✅ | ✅ | ❌ |
| aluno | ✅ | ✅ | ✅ | ❌ |
| viewer | ✅ | ✅ | ❌ | ❌ |
| null (anônimo) | ✅ | ❌ | ❌ | ❌ |

---

## 🔄 FLUXO DE REDIRECIONAMENTO

```
                    ┌─────────────────────────────┐
                    │ www.moisesmedeiros.com.br   │
                    │ moisesmedeiros.com.br       │
                    └───────────┬─────────────────┘
                                │ REDIRECT 301
                                ▼
                    ┌─────────────────────────────┐
                    │ pro.moisesmedeiros.com.br   │
                    │         (HOME /)             │
                    └───────────┬─────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │  /comunidade  │   │    /auth      │   │   (público)   │
    │  (FREE AREA)  │   │   (LOGIN)     │   │   /termos     │
    └───────────────┘   └───────┬───────┘   │   /privacidade│
                                │           └───────────────┘
                                │ APÓS LOGIN
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌───────────────┐       ┌───────────────┐
            │  /gestaofc    │       │   /alunos     │
            │ (STAFF/OWNER) │       │ (BETA/OWNER)  │
            └───────────────┘       └───────────────┘

        gestao.moisesmedeiros.com.br ──BLOQUEADO──► pro.../gestaofc (staff)
                                                    pro.../        (outros)
```

---

## 📁 ESTRUTURA DE ÁREAS

### 1. ÁREA PÚBLICA (`/`)
- Home/Landing
- Termos de Uso
- Política de Privacidade
- Área Gratuita (preview)

### 2. COMUNIDADE (`/comunidade`)
- Fórum
- Conteúdos gratuitos
- Networking
- **Acesso:** viewer, beta, owner

### 3. PORTAL DO ALUNO (`/alunos`)
- Cursos
- Aulas
- Materiais
- Certificados
- Progresso
- **Acesso:** beta, owner

### 4. BACKOFFICE (`/gestaofc`)
- Dashboard Executivo
- Tarefas
- Funcionários
- Marketing
- Finanças
- Cursos (CRUD)
- Alunos (CRUD)
- Afiliados
- Integrações
- **Acesso:** funcionários, owner
- **ROTA SECRETA:** Não expor aliases

---

## ⚠️ REGRAS INVIOLÁVEIS

1. **MONO-DOMÍNIO:** Tudo roda em `pro.moisesmedeiros.com.br`
2. **gestao.moisesmedeiros.com.br:** BLOQUEADO — redireciona automaticamente
3. **www.moisesmedeiros.com.br:** Redireciona para `pro.moisesmedeiros.com.br`
4. **OWNER:** Acesso total a TODAS as áreas
5. **STAFF:** Só acessa `/gestaofc`, nunca `/alunos`
6. **BETA:** Só acessa `/alunos` e `/comunidade`, nunca `/gestaofc`
7. **FREE:** Só acessa `/comunidade` e páginas públicas
8. **gestaofc É SECRETO:** Rotas legadas (/gestao, /admin, /dashboard) vão para `/`

---

## 🔧 ARQUIVOS RELACIONADOS

| Arquivo | Função |
|---------|--------|
| `src/core/urlAccessControl.ts` | Controle de acesso por URL + getPostLoginRedirect |
| `src/components/routing/LegacyDomainBlocker.tsx` | Bloqueia gestao.* |
| `src/components/routing/LegacyRedirectHandler.tsx` | Redirects de rotas legadas |
| `src/lib/cloudflare/legacyRedirects.ts` | Mapeamento de redirects |
| `src/routes/publicRoutes.tsx` | Rotas públicas |
| `src/routes/comunidadeRoutes.tsx` | Rotas da comunidade |
| `src/routes/alunoRoutes.tsx` | Rotas do portal do aluno |
| `src/routes/gestaofcRoutes.tsx` | Rotas do backoffice |
| `src/routes/legacyRoutes.tsx` | Redirects legados |
| `src/hooks/useAuth.tsx` | Lógica de autenticação e redirect |
| `src/pages/Auth.tsx` | Página de login/cadastro |
| `src/components/layout/RoleProtectedRoute.tsx` | Proteção de rotas por role |

---

## 📅 CHANGELOG

| Data | Alteração | Autor |
|------|-----------|-------|
| 27/12/2025 | Documento criado — Estrutura DEFINITIVA | OWNER |
| 27/12/2025 | MATRIZ SUPREMA incorporada (7 matrizes) | OWNER |
| 27/12/2025 | LegacyDomainBlocker criado | SISTEMA |

---

**FIM DO DOCUMENTO — IMUTÁVEL**
