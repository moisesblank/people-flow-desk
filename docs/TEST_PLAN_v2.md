# 🧪 PLANO DE TESTES v2.0
## Checkpoint 6/6 — Truth/Proof Test Plan (≥40 tests)

> **CONFORMIDADE:** CONSTITUIÇÃO v2.0.0
> **Data:** 2025-12-27
> **Total de Testes:** 48

---

## 📋 CATEGORIAS DE TESTE

| Categoria | Qtd | Status |
|-----------|-----|--------|
| Redirects Cloudflare | 6 | ✅ |
| Rotas Públicas | 5 | ✅ |
| Bloco ALUNOS | 6 | ✅ |
| Bloco GESTAO | 8 | ✅ |
| Cross-Block Isolation | 6 | ✅ |
| Autenticação | 7 | ✅ |
| Backend RLS | 10 | ✅ |
| **TOTAL** | **48** | ✅ |

---

## 🔄 TESTES DE REDIRECT (CLOUDFLARE)

### TEST-CF-01: Entry Redirect (domínio raiz)
```bash
curl -I https://moisesmedeiros.com.br/
# ESPERADO: 301, Location: https://pro.moisesmedeiros.com.br/
```

### TEST-CF-02: Entry Redirect com path
```bash
curl -I https://moisesmedeiros.com.br/auth?next=/alunos
# ESPERADO: 301, Location: https://pro.moisesmedeiros.com.br/auth?next=/alunos
```

### TEST-CF-03: WWW Redirect
```bash
curl -I https://www.moisesmedeiros.com.br/comunidade
# ESPERADO: 301, Location: https://pro.moisesmedeiros.com.br/comunidade
```

### TEST-CF-04: Legacy gestao (terminado)
```bash
curl -I https://gestao.moisesmedeiros.com.br/
# ESPERADO: 301, Location: https://pro.moisesmedeiros.com.br/
```

### TEST-CF-05: Legacy gestao com path (não preserva)
```bash
curl -I https://gestao.moisesmedeiros.com.br/dashboard
# ESPERADO: 301, Location: https://pro.moisesmedeiros.com.br/ (sem path!)
```

### TEST-CF-06: PRO é destino final
```bash
curl -I https://pro.moisesmedeiros.com.br/
# ESPERADO: 200 OK (sem redirect)
```

---

## 🌐 TESTES DE ROTAS PÚBLICAS

### TEST-PUB-01: Home pública
```
GET /
# ESPERADO: 200 OK, renderiza Home
```

### TEST-PUB-02: Auth pública
```
GET /auth
# ESPERADO: 200 OK, renderiza página de login
```

### TEST-PUB-03: Termos públicos
```
GET /termos
# ESPERADO: 200 OK
```

### TEST-PUB-04: Privacidade pública
```
GET /privacidade
# ESPERADO: 200 OK
```

### TEST-PUB-05: Área gratuita pública
```
GET /area-gratuita
# ESPERADO: 200 OK
```

---

## 👨‍🎓 TESTES BLOCO ALUNOS

### TEST-ALU-01: Aluno beta acessa /alunos
```
USER: role=beta
GET /alunos
# ESPERADO: 200 OK, renderiza dashboard aluno
```

### TEST-ALU-02: Aluno beta acessa /alunos/livro-web
```
USER: role=beta
GET /alunos/livro-web
# ESPERADO: 200 OK
```

### TEST-ALU-03: Viewer tenta acessar /alunos
```
USER: role=viewer
GET /alunos
# ESPERADO: 404 (acesso negado)
```

### TEST-ALU-04: Não autenticado tenta /alunos
```
USER: null
GET /alunos
# ESPERADO: Redirect /auth
```

### TEST-ALU-05: Funcionário tenta /alunos
```
USER: role=funcionario
GET /alunos
# ESPERADO: 404 (isolamento de bloco)
```

### TEST-ALU-06: Owner acessa /alunos (bypass)
```
USER: role=owner
GET /alunos
# ESPERADO: 200 OK (owner tem acesso total)
```

---

## 👔 TESTES BLOCO GESTAO

### TEST-GES-01: Funcionário acessa /gestaofc
```
USER: role=funcionario
GET /gestaofc
# ESPERADO: 200 OK
```

### TEST-GES-02: Admin acessa /gestaofc/dashboard
```
USER: role=admin
GET /gestaofc/dashboard
# ESPERADO: 200 OK
```

### TEST-GES-03: Beta tenta /gestaofc
```
USER: role=beta
GET /gestaofc
# ESPERADO: 404 GENÉRICO (não expor existência)
```

### TEST-GES-04: Viewer tenta /gestaofc
```
USER: role=viewer
GET /gestaofc
# ESPERADO: 404 GENÉRICO
```

### TEST-GES-05: Não autenticado tenta /gestaofc
```
USER: null
GET /gestaofc
# ESPERADO: Redirect /auth
```

### TEST-GES-06: Owner acessa /gestaofc/central-monitoramento
```
USER: role=owner
GET /gestaofc/central-monitoramento
# ESPERADO: 200 OK (área owner-only)
```

### TEST-GES-07: Admin tenta /gestaofc/central-monitoramento
```
USER: role=admin
GET /gestaofc/central-monitoramento
# ESPERADO: 404 ou acesso negado (owner-only)
```

### TEST-GES-08: Contabilidade acessa /gestaofc/contabilidade
```
USER: role=contabilidade
GET /gestaofc/contabilidade
# ESPERADO: 200 OK
```

---

## 🚧 TESTES DE ISOLAMENTO CROSS-BLOCK

### TEST-ISO-01: Beta após /alunos tenta /gestaofc
```
USER: role=beta
1. GET /alunos → 200 OK
2. GET /gestaofc → 404 GENÉRICO
# ESPERADO: Isolamento mantido
```

### TEST-ISO-02: Funcionário após /gestaofc tenta /alunos
```
USER: role=funcionario
1. GET /gestaofc → 200 OK
2. GET /alunos → 404
# ESPERADO: Isolamento mantido
```

### TEST-ISO-03: Refresh em /gestaofc sem role staff
```
USER: role=viewer
1. Navegar manualmente para /gestaofc via URL
2. F5 (refresh)
# ESPERADO: 404 GENÉRICO (sem vazamento)
```

### TEST-ISO-04: Deep link /gestaofc/financas sem auth
```
USER: null
GET /gestaofc/financas-empresa
# ESPERADO: Redirect /auth (não 404)
```

### TEST-ISO-05: Deep link /alunos/simulados sem auth
```
USER: null
GET /alunos/simulados
# ESPERADO: Redirect /auth
```

### TEST-ISO-06: Aba anônima /gestaofc
```
BROWSER: Aba anônima (sem session)
GET /gestaofc
# ESPERADO: Redirect /auth
```

---

## 🔐 TESTES DE AUTENTICAÇÃO

### TEST-AUTH-01: Login com email válido
```
POST /auth (email: valid@example.com, password: valid)
# ESPERADO: 200 OK, session criada, redirect role-based
```

### TEST-AUTH-02: Pós-login owner → /gestaofc
```
USER: email=moisesblank@gmail.com
LOGIN SUCCESS
# ESPERADO: Redirect /gestaofc
```

### TEST-AUTH-03: Pós-login funcionario → /gestaofc
```
USER: role=funcionario
LOGIN SUCCESS
# ESPERADO: Redirect /gestaofc
```

### TEST-AUTH-04: Pós-login beta → /alunos
```
USER: role=beta
LOGIN SUCCESS
# ESPERADO: Redirect /alunos
```

### TEST-AUTH-05: Pós-login viewer → /comunidade
```
USER: role=viewer
LOGIN SUCCESS
# ESPERADO: Redirect /comunidade
```

### TEST-AUTH-06: Logout limpa sessão
```
USER: any role
LOGOUT
# ESPERADO: Session invalidada, redirect /
```

### TEST-AUTH-07: Token expirado
```
USER: session_expired=true
GET /alunos
# ESPERADO: Redirect /auth (re-login necessário)
```

---

## 🛡️ TESTES DE BACKEND (RLS)

### TEST-RLS-01: user_roles - viewer não pode se promover
```sql
-- Como viewer autenticado:
INSERT INTO user_roles (user_id, role) VALUES (auth.uid(), 'owner');
# ESPERADO: ERROR (RLS deny)
```

### TEST-RLS-02: user_roles - apenas owner pode INSERT
```sql
-- Como owner:
INSERT INTO user_roles (user_id, role) VALUES ('uuid', 'employee');
# ESPERADO: SUCCESS
```

### TEST-RLS-03: alunos - viewer não pode SELECT
```sql
-- Como viewer:
SELECT * FROM alunos;
# ESPERADO: 0 rows (RLS filter)
```

### TEST-RLS-04: alunos - admin pode SELECT
```sql
-- Como admin:
SELECT * FROM alunos LIMIT 5;
# ESPERADO: rows retornados
```

### TEST-RLS-05: profiles - usuário vê apenas próprio perfil
```sql
-- Como usuário X:
SELECT * FROM profiles WHERE id != auth.uid();
# ESPERADO: 0 rows
```

### TEST-RLS-06: transacoes_hotmart - viewer não pode SELECT
```sql
-- Como viewer:
SELECT * FROM transacoes_hotmart_completo;
# ESPERADO: 0 rows
```

### TEST-RLS-07: admin_audit_log - apenas owner
```sql
-- Como admin:
SELECT * FROM admin_audit_log;
# ESPERADO: 0 rows (apenas owner vê)
```

### TEST-RLS-08: calendar_tasks - scoped por user_id
```sql
-- Como usuário X:
SELECT * FROM calendar_tasks;
# ESPERADO: apenas tasks onde user_id = auth.uid()
```

### TEST-RLS-09: get_user_role_v2 - sem auth retorna viewer
```sql
-- Sem autenticação (service_role):
SELECT get_user_role_v2(NULL);
# ESPERADO: 'viewer'
```

### TEST-RLS-10: is_owner - user normal retorna FALSE
```sql
-- Como usuário sem role owner:
SELECT is_owner(auth.uid());
# ESPERADO: FALSE
```

---

## ✅ CHECKLIST DE EXECUÇÃO

### Pré-requisitos:
- [ ] Ambiente de teste configurado
- [ ] Usuários de teste criados (owner, admin, funcionario, beta, viewer)
- [ ] Cloudflare proxied (se aplicável)
- [ ] SSL ativo

### Execução:
- [ ] Testes CF (6/6)
- [ ] Testes PUB (5/5)
- [ ] Testes ALU (6/6)
- [ ] Testes GES (8/8)
- [ ] Testes ISO (6/6)
- [ ] Testes AUTH (7/7)
- [ ] Testes RLS (10/10)

### Critério de Sucesso:
- **PASS:** 48/48 testes passando
- **FAIL:** Qualquer teste falhando bloqueia GO-LIVE

---

## 📊 TEMPLATE DE RESULTADO

```
╔══════════════════════════════════════════════════════════════════╗
║                    RESULTADO DOS TESTES                          ║
╠══════════════════════════════════════════════════════════════════╣
║ Cloudflare Redirects     [__/6]   [PASS/FAIL]                   ║
║ Rotas Públicas           [__/5]   [PASS/FAIL]                   ║
║ Bloco ALUNOS             [__/6]   [PASS/FAIL]                   ║
║ Bloco GESTAO             [__/8]   [PASS/FAIL]                   ║
║ Isolamento Cross-Block   [__/6]   [PASS/FAIL]                   ║
║ Autenticação             [__/7]   [PASS/FAIL]                   ║
║ Backend RLS              [__/10]  [PASS/FAIL]                   ║
╠══════════════════════════════════════════════════════════════════╣
║ TOTAL                    [__/48]                                 ║
║ STATUS FINAL: [GO-LIVE APROVADO / GO-LIVE BLOQUEADO]            ║
╚══════════════════════════════════════════════════════════════════╝
```
