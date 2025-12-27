# 🏛️ ARQUITETURA DE DOMÍNIOS E ROTAS — DEFINITIVA E IMUTÁVEL

> **Status:** VIGENTE PARA SEMPRE  
> **Data de Fixação:** 27/12/2025  
> **OWNER:** MOISESBLANK@GMAIL.COM  
> **Regra:** NUNCA ALTERAR ESTA ESTRUTURA SEM AUTORIZAÇÃO EXPLÍCITA DO OWNER

---

## 📡 MAPA DE DOMÍNIOS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ESTRUTURA DE DOMÍNIOS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  www.moisesmedeiros.com.br  ───────► pro.moisesmedeiros.com.br              │
│  (Domínio Principal)                 (Plataforma Central - MONO-DOMÍNIO)    │
│                                                                              │
│  gestao.moisesmedeiros.com.br ──────► DEPRECIADO                            │
│  (Legado - NÃO USAR)                  Migrado para /gestaofc                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ MAPA DE URLs E ROTAS

| Área | URL | Quem Acessa | Descrição |
|------|-----|-------------|-----------|
| 🌐 **PÚBLICA** | `pro.moisesmedeiros.com.br/` | TODOS | Landing page, home |
| 🔐 **AUTH** | `pro.moisesmedeiros.com.br/auth` | TODOS | Login/Cadastro |
| 👥 **COMUNIDADE** | `pro.moisesmedeiros.com.br/comunidade` | FREE + BETA + OWNER | Área gratuita para alunos |
| 👨‍🎓 **ALUNOS** | `pro.moisesmedeiros.com.br/alunos` | BETA + OWNER | Portal do aluno pagante |
| 👔 **GESTÃO** | `pro.moisesmedeiros.com.br/gestaofc` | FUNCIONÁRIOS + OWNER | Backoffice interno |
| 👑 **OWNER** | TODAS | OWNER | Acesso irrestrito |

---

## 🔄 FLUXO DE REDIRECIONAMENTO

```
                    ┌─────────────────────────┐
                    │ www.moisesmedeiros.com.br│
                    └───────────┬─────────────┘
                                │ REDIRECT 301
                                ▼
                    ┌─────────────────────────┐
                    │ pro.moisesmedeiros.com.br│
                    │         (HOME)           │
                    └───────────┬─────────────┘
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
```

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

## 🔐 LÓGICA DE REDIRECT PÓS-LOGIN

```typescript
// Após autenticação bem-sucedida em /auth:
if (email === OWNER_EMAIL) {
  redirect("/gestaofc");  // Owner vai pro backoffice
} else if (isGestaoRole(role)) {
  redirect("/gestaofc");  // Staff vai pro backoffice  
} else if (isBetaRole(role)) {
  redirect("/alunos");    // Aluno pagante vai pro portal
} else {
  redirect("/comunidade"); // Free vai pra comunidade
}
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

---

## ⚠️ REGRAS INVIOLÁVEIS

1. **MONO-DOMÍNIO:** Tudo roda em `pro.moisesmedeiros.com.br`
2. **gestao.moisesmedeiros.com.br:** DEPRECIADO — redireciona para `/gestaofc`
3. **www.moisesmedeiros.com.br:** Redireciona para `pro.moisesmedeiros.com.br`
4. **OWNER:** Acesso total a TODAS as áreas
5. **STAFF:** Só acessa `/gestaofc`, nunca `/alunos`
6. **BETA:** Só acessa `/alunos` e `/comunidade`, nunca `/gestaofc`
7. **FREE:** Só acessa `/comunidade` e páginas públicas

---

## 🔧 ARQUIVOS RELACIONADOS

| Arquivo | Função |
|---------|--------|
| `src/core/urlAccessControl.ts` | Controle de acesso por URL |
| `src/routes/publicRoutes.tsx` | Rotas públicas |
| `src/routes/comunidadeRoutes.tsx` | Rotas da comunidade |
| `src/routes/alunoRoutes.tsx` | Rotas do portal do aluno |
| `src/routes/gestaofcRoutes.tsx` | Rotas do backoffice |
| `src/routes/legacyRoutes.tsx` | Redirects legados |
| `src/hooks/useAuth.tsx` | Lógica de autenticação e redirect |
| `src/pages/Auth.tsx` | Página de login/cadastro |
| `src/lib/cloudflare/legacyRedirects.ts` | Mapeamento de redirects |

---

## 📅 CHANGELOG

| Data | Alteração | Autor |
|------|-----------|-------|
| 27/12/2025 | Documento criado — Estrutura DEFINITIVA | OWNER |

---

**FIM DO DOCUMENTO — IMUTÁVEL**
