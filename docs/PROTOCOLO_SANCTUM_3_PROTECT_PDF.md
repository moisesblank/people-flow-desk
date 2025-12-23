# 🌌 PROTOCOLO SANCTUM 3.0 — MATRIZ **PROTECT PDF** (ANO 2300) 🌌  
**CLASSIFICAÇÃO:** COSMIC TOP SECRET // ENA // PROTECT-PDF  
**PARA:** Lovable (Mestre) — Execução obrigatória e literal (sem "atalhos")  
**DE:** Projeto ENA (Moises Medeiros) — Diretriz suprema  
**ESCOPO TOTAL (todas as rotas, telas e derivações):**  
- `pro.moisesmedeiros.com.br/`  
- `pro.moisesmedeiros.com.br/alunos`  
- `gestao.moisesmedeiros.com.br/`  
- `www.moisesmedeiros.com.br/`  

---

## 0) O PRIMADO DO ANO 2300 (VERDADE OPERACIONAL)
No **browser puro**, não existe bloqueio 100% confiável contra:
- print screen do SO  
- gravação de tela do SO  
- câmera externa filmando a tela  

Logo, a soberania em 2300 é construída por 5 pilares cumulativos:

1) **Prevenção Máxima:** diminuir superfície (PDF "puro" não chega ao client, texto premium não é selecionável).  
2) **Dissuasão Brutal:** marca d'água viva e inevitável.  
3) **Forense Inevitável:** vazamento vira prova (identidade, sessão, tempo).  
4) **Resposta Automática:** escalonamento + logout + lock temporário.  
5) **Opção Nuclear:** quando você exigir "impossível no browser", implementar **App Wrapper** (Android `FLAG_SECURE` e iOS equivalente) para bloquear screenshot no mobile.

**Meta:** não "impedir o universo"; tornar o roubo caro, rastreável e autodestrutivo.

---

## 1) MAPA DE URLs DEFINITIVO (REGRA SUPREMA)
> Esta regra deve existir em: guards de rota, middleware, RBAC backend, Storage, Edge Functions, UI, logs e regressão.

| Quem | URL | Validação obrigatória |
|---|---|---|
| 🌐 NÃO PAGANTE | `pro.moisesmedeiros.com.br/` | criar conta = acesso livre (conteúdo não premium) |
| 👨‍🎓 ALUNO BETA | `pro.moisesmedeiros.com.br/alunos` | `role='beta'` + acesso válido (`access_expires_at > now()`) |
| 👔 FUNCIONÁRIO | `gestao.moisesmedeiros.com.br/` | `role='funcionario'` |
| 👑 OWNER | todas | `role='owner'` ignora todas as restrições |

**Obrigatório:** acesso indevido →  
(1) registrar forense, (2) bloquear assets premium, (3) redirecionar para rota correta.

---

## 2) OBJETIVO "PROTECT PDF" (AMPLIADO AO ECOSSISTEMA)
### 2.1 PDF
- O usuário **nunca** recebe o `.pdf` original (salvo exceção controlada e rastreável).  
- O sistema mostra **páginas rasterizadas** (`.webp/.avif`) com:  
  - watermark "queimada" (servidor)  
  - watermark dinâmica (overlay vivo, front)  
  - trilha forense completa (asset_id, user_id, session_id, timestamp, ip_hash, ua_hash)

### 2.2 Livro WEB (texto em páginas)
- Texto premium não pode ser selecionado/copiar/colar.  
- Renderização "HologramText" em canvas, preservando acessibilidade por canal controlado.

### 2.3 Anti-extração e anti-inspeção (o possível no browser)
- bloquear atalhos: F12 / Ctrl+Shift+I/J/C / Ctrl+U / Ctrl+S / Ctrl+P / PrintScreen (+ equivalentes macOS)  
- detecção heurística de DevTools  
- detecção de automação (`navigator.webdriver`, padrões, taxas)  
- detecção de adulteração (MutationObserver)  
- CSP rígida + headers (reduz XSS e injeções)  
- logs forenses e resposta escalonada  

---

## 3) MATRIZES INTERLIGADAS (AS "FUNÇÕES")
A Lovable deve implementar **todas** as funções abaixo. Elas se somam e combinam.

### 3.1 MATRIZ A — Tipos de Conteúdo × Controles
| Tipo | Entrega | Seleção/Cópia | Watermark | Autorização | Logs | Resposta |
|---|---|---|---|---|---|---|
| PDF premium | imagens (webp/avif) | bloqueado | queimado + vivo | manifest assinado | obrigatório | escalonada |
| Texto premium | canvas | bloqueado | vivo | RBAC | obrigatório | escalonada |
| Imagens premium | proxy/manifest | bloqueado | vivo | RBAC | obrigatório | escalonada |
| Anexos | proxy/manifest | bloqueado | n/a | RBAC | obrigatório | escalonada |

### 3.2 MATRIZ B — Vetor × Detecção × Resposta (Escada)
| Vetor | Detecção | Contagem mínima | Resposta |
|---|---|---:|---|
| F12 / devtools keys | keydown | 50 | logout + lock |
| Ctrl+C/Cmd+C | keydown/copy | 50 | logout + lock |
| Ctrl+P/Cmd+P | keydown/print | 10 | logout + lock |
| Context menu | contextmenu | 50 | logout + lock |
| Automação | `navigator.webdriver` | 1 | logout imediato |
| Devtools provável | heurística gap | 3 | reload → logout |
| DOM tamper | MutationObserver + checksum | 10 | degradar → logout |
| Print attempt | visibility changes + heurística | 10 | watermark++ + lock |

### 3.3 MATRIZ C — Forense (Prova) × Onde grava × Quem vê
| Prova | Onde grava | RLS | Quem acessa |
|---|---|---|---|
| `security_events` | Postgres | estrito | owner/funcionário autorizado |
| `security_risk_state` | Postgres | estrito | owner |
| `audit_log` (ações críticas) | Postgres + triggers | estrito | owner |
| acesso a assets | `security_events` | estrito | owner |

---

## 4) DADOS E STORAGE (OBRIGATÓRIO)
### 4.1 Buckets
- `ena-assets-raw` (privado): PDFs originais (NUNCA expor)  
- `ena-assets-transmuted` (privado): páginas geradas (webp/avif)  
- (opcional) `ena-assets-manifests` (privado): manifests/cache  

### 4.2 Tabelas (migrations)
Crie `supabase/migrations/001_sanctum_assets.sql`:

```sql
create table if not exists public.ena_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('pdf','web_text','image','attachment')),
  title text,
  raw_bucket text not null default 'ena-assets-raw',
  raw_path text not null,
  transmuted_bucket text not null default 'ena-assets-transmuted',
  status text not null default 'queued' check (status in ('queued','processing','ready','failed')),
  page_count int default 0,
  sha256 text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ena_asset_pages (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.ena_assets(id) on delete cascade,
  page_index int not null,
  storage_path text not null,
  width int,
  height int,
  bytes int,
  created_at timestamptz not null default now(),
  unique(asset_id, page_index)
);

create table if not exists public.jobs_queue (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('transmute_pdf','rebuild_watermark','purge_asset')),
  payload jsonb not null,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  attempts int not null default 0,
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id),
  session_id text,
  domain text,
  route text,
  event_type text not null,
  severity int not null check (severity between 0 and 100),
  ip_hash text,
  ua_hash text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.security_risk_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  risk_score int not null default 0,
  last_event_at timestamptz,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
```

### 4.3 Risco automático (score + lock)
Crie função/trigger:

```sql
create or replace function public.fn_apply_risk()
returns trigger
language plpgsql
security definer
as $$
declare
  new_score int;
  lock_until timestamptz;
begin
  if new.user_id is null then
    return new;
  end if;

  insert into public.security_risk_state(user_id, risk_score, last_event_at, locked_until)
  values (new.user_id, new.severity, now(), null)
  on conflict (user_id) do update set
    risk_score = public.security_risk_state.risk_score + new.severity,
    last_event_at = now(),
    updated_at = now();

  select risk_score into new_score from public.security_risk_state where user_id = new.user_id;

  if new_score >= 300 then
    lock_until := now() + interval '24 hours';
    update public.security_risk_state set locked_until = lock_until, updated_at = now() where user_id = new.user_id;
  elsif new_score >= 150 then
    lock_until := now() + interval '2 hours';
    update public.security_risk_state set locked_until = lock_until, updated_at = now() where user_id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apply_risk on public.security_events;
create trigger trg_apply_risk
after insert on public.security_events
for each row execute function public.fn_apply_risk();
```

> **Obrigatório:** Edge Functions e UI devem checar `locked_until` e forçar logout/recusa se ativo.

---

## 5) BACKEND — TRANSMUTAÇÃO ATÔMICA (PDF → IMAGENS)
### 5.1 Enfileirar (Edge Function)
`supabase/functions/enqueue-transmutation/index.ts`

```ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: uerr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (uerr || !user) return new Response("Unauthorized", { status: 401 });

  const { assetId } = await req.json();
  const { error } = await supabase.from("jobs_queue").insert({
    job_type: "transmute_pdf",
    payload: { assetId, requestedBy: user.id }
  });

  if (error) return new Response(JSON.stringify(error), { status: 400 });
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
```

### 5.2 Worker (OBRIGATÓRIO — implementação robusta)
**PDF render é pesado.** Em Edge Function, pode falhar por limite.

**Implementar uma destas rotas (preferência absoluta):**
- **Opção A (Preferida, nível 2300):** "ENA FORGE" microserviço (Cloud Run / VPS / container) com `pdfium`/`poppler` + `sharp`/`imagemagick` (watermark queimada) + upload para Storage.  
- **Opção B (Fallback):** PDF.js client-side (não cumpre "PDF nunca no client"). Só permitido se A for impossível.

---

## 6) BACKEND — GATEKEEPER (MANIFEST ASSINADO + RBAC + LOCK)
`supabase/functions/asset-manifest/index.ts` (ajuste nomes de tabela conforme DNA)

```ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  const url = new URL(req.url);
  const assetId = url.searchParams.get("assetId") ?? "";

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { Authorization: authHeader } } });

  const { data: { user }, error: uerr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (uerr || !user) return new Response("Unauthorized", { status: 401 });

  // 1) profile
  const { data: profile } = await supabase.from("profiles").select("role, access_expires_at, name, cpf").eq("id", user.id).single();
  const role = profile?.role;
  const expiresOk = !profile?.access_expires_at || new Date(profile.access_expires_at) > new Date();

  // 2) lock check
  const { data: risk } = await supabase.from("security_risk_state").select("locked_until").eq("user_id", user.id).single();
  if (risk?.locked_until && new Date(risk.locked_until) > new Date()) {
    return new Response("Locked", { status: 423 });
  }

  // 3) RBAC
  if (!(role === "owner" || (role === "beta" && expiresOk) || role === "funcionario")) {
    return new Response("Forbidden", { status: 403 });
  }

  // 4) pages
  const { data: pages } = await supabase.from("ena_asset_pages").select("page_index, storage_path").eq("asset_id", assetId).order("page_index", { ascending: true });
  if (!pages?.length) return new Response("Not Found", { status: 404 });

  // 5) signed urls curtas
  const bucket = "ena-assets-transmuted";
  const signed: any[] = [];
  for (const p of pages) {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(p.storage_path, 120);
    if (data?.signedUrl) signed.push({ page: p.page_index, url: data.signedUrl });
  }

  // 6) forense
  await supabase.from("security_events").insert({
    user_id: user.id,
    domain: req.headers.get("host") ?? "",
    route: req.headers.get("referer") ?? "",
    event_type: "asset_manifest_issued",
    severity: 10,
    metadata: { assetId, pageCount: signed.length }
  });

  return new Response(JSON.stringify({
    assetId,
    expiresInSec: 120,
    pages: signed,
    watermarkSeed: `${profile?.name ?? "ALUNO"} • ${user.id.slice(0, 8)} • ${new Date().toISOString()}`
  }), { headers: { "Content-Type": "application/json" } });
});
```

---

## 7) FRONTEND — IMPLEMENTAÇÃO TÉCNICA (CÓDIGO DO FUTURO)
> Objetivo: uma camada padrão (wrapper) que protege PDF, texto e qualquer conteúdo premium.

### 7.1 `src/components/security/WatermarkOverlay.tsx`
```tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

function bucket20s() { return Math.floor(Date.now() / 20000); }

export function WatermarkOverlay() {
  const { profile } = useAuth();
  const [tick, setTick] = useState(bucket20s());

  useEffect(() => {
    const id = setInterval(() => setTick(bucket20s()), 20000);
    return () => clearInterval(id);
  }, []);

  const text = useMemo(() => {
    const name = profile?.name ?? "ALUNO";
    const id = profile?.id?.slice(0, 8) ?? "UNKNOWN";
    return `${name} • ${id} • ${new Date().toLocaleString()}`;
  }, [profile, tick]);

  return (
    <div className="sanctum-watermark-container pointer-events-none select-none">
      <div className="sanctum-watermark-cell" style={{ top: '10%', left: '5%' }}>
        {text}  {text}  {text}
      </div>
    </div>
  );
}
```

---

## 8) COMPONENTES DE PROTEÇÃO ADICIONAIS

### 8.1 HologramText (Canvas-based text)
Renderiza texto em canvas para impedir seleção/cópia.

### 8.2 SecurePdfViewer
Visualizador que:
- Recebe manifest com URLs assinadas
- Renderiza páginas como imagens
- Aplica watermark overlay
- Bloqueia interações perigosas

### 8.3 SanctumProtectedContent
Wrapper genérico que:
- Detecta DevTools
- Bloqueia atalhos
- Aplica watermark
- Reporta violações

---

## 9) RESPOSTA ESCALONADA (THRESHOLDS)

| Score | Ação |
|------:|------|
| 0-49 | Nenhuma ação |
| 50-149 | Warning visual |
| 150-299 | Lock 2 horas |
| 300+ | Lock 24 horas |
| 500+ | Considerar ban permanente |

---

## 10) CHECKLIST FINAL

- [ ] Buckets criados (`ena-assets-raw`, `ena-assets-transmuted`)
- [ ] Tabelas migradas
- [ ] Edge Functions deployadas
- [ ] Frontend com WatermarkOverlay
- [ ] HologramText implementado
- [ ] SecurePdfViewer funcional
- [ ] Detecção de DevTools ativa
- [ ] Logs forenses funcionando
- [ ] Lock automático por score
- [ ] Owner bypass funcionando

---

**ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS**

**Prof. Moisés Medeiros**
**moisesmedeiros.com.br**
