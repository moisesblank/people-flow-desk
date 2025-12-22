# 🌌 PROTOCOLO SANCTUM 3.0 — MATRIZ **PROTECT PDF & LIVRO WEB** (ANO 2300) 🌌

> **CLASSIFICAÇÃO:** COSMIC TOP SECRET // ENA // PROTECT-PDF
> **PARA:** Lovable (Mestre) — Execução obrigatória e literal
> **DE:** Projeto ENA (Moisés Medeiros) — Diretriz suprema
> **ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS**

---

## 🔥 ESCOPO TOTAL (REGRA MANDATÓRIA)

### 📍 MAPA DE URLs DEFINITIVO (REGRA SUPREMA)

| Quem | URL | Validação | Descrição |
|------|-----|-----------|-----------|
| 🌐 **NÃO PAGANTE** | `pro.moisesmedeiros.com.br/` | Cadastro gratuito | Área comum + `/comunidade` |
| 👨‍🎓 **ALUNO BETA** | `pro.moisesmedeiros.com.br/alunos` | `role='beta'` + acesso válido | **PAGANTE** - Conteúdo premium |
| 👔 **FUNCIONÁRIO** | `gestao.moisesmedeiros.com.br/gestao` | `role='funcionario'` | Área de gestão |
| 👑 **OWNER** | **TODAS** | `role='owner'` | **MASTER** = `moisesblank@gmail.com` = **IGNORA RESTRIÇÕES** |

**OBRIGATÓRIO:** Acesso indevido → (1) registrar forense, (2) bloquear assets premium, (3) redirecionar.

---

## 0) O PRIMADO DO ANO 2300 (VERDADE OPERACIONAL)

No **browser puro**, não existe bloqueio 100% confiável contra:
- Print screen do SO
- Gravação de tela do SO
- Câmera externa filmando a tela

**Logo, a soberania é construída por 5 pilares cumulativos:**

1. **Prevenção Máxima:** PDF "puro" NUNCA chega ao client, texto premium não é selecionável
2. **Dissuasão Brutal:** Marca d'água viva e inevitável
3. **Forense Inevitável:** Vazamento vira prova (identidade, sessão, tempo)
4. **Resposta Automática:** Escalonamento + logout + lock temporário
5. **Opção Nuclear:** App Wrapper (Android `FLAG_SECURE`, iOS equivalente) para bloquear screenshot mobile

**Meta:** Tornar o roubo caro, rastreável e autodestrutivo.

---

## 1) O QUE JÁ TEMOS (NÃO CRIAR DUPLICADO)

### 1.1 Tabelas de Segurança Existentes
- ✅ `security_audit_log` — Log de auditoria imutável
- ✅ `security_events` — Eventos de segurança (já criada em migração anterior)
- ✅ `user_sessions` — Sessões de usuário
- ✅ `video_violations` — Violações de vídeo
- ✅ `video_user_risk_scores` — Scores de risco

### 1.2 Componentes Frontend Existentes
- ✅ `src/components/security/ProtectedPDFViewer.tsx` — Viewer de PDF protegido
- ✅ `src/components/security/SessionGuard.tsx` — Guarda de sessão
- ✅ `src/components/security/DeviceGuard.tsx` — Guarda de dispositivo
- ✅ `src/components/security/BetaAccessGuard.tsx` — Guarda de acesso beta

### 1.3 Core de Acesso Existente
- ✅ `src/core/urlAccessControl.ts` — Controle de acesso por URL/role
- ✅ `src/core/routes.ts` — Rotas centralizadas (150+)
- ✅ `src/core/storage.ts` — Buckets centralizados (18)

---

## 2) OBJETIVO "PROTECT PDF & LIVRO WEB" (AMPLIADO)

### 2.1 PDF Premium
- O usuário **NUNCA** recebe o `.pdf` original
- O sistema mostra **páginas rasterizadas** (`.webp/.avif`) com:
  - Watermark "queimada" no servidor
  - Watermark dinâmica (overlay vivo, frontend)
  - Trilha forense completa (asset_id, user_id, session_id, timestamp, ip_hash, ua_hash)

### 2.2 Livro WEB (Texto Premium)
- Texto premium NÃO pode ser selecionado/copiar/colar
- Renderização "HologramText" em canvas
- Preserva acessibilidade por canal controlado

### 2.3 Anti-extração e Anti-inspeção
- Bloquear atalhos: F12 / Ctrl+Shift+I/J/C / Ctrl+U / Ctrl+S / Ctrl+P / PrintScreen (+ macOS)
- Detecção heurística de DevTools
- Detecção de automação (`navigator.webdriver`, padrões, taxas)
- Detecção de adulteração (MutationObserver)
- CSP rígida + headers (reduz XSS e injeções)
- Logs forenses e resposta escalonada

---

## 3) MATRIZES INTERLIGADAS (AS "FUNÇÕES")

### 3.1 MATRIZ A — Tipos de Conteúdo × Controles

| Tipo | Entrega | Seleção/Cópia | Watermark | Autorização | Logs | Resposta |
|------|---------|---------------|-----------|-------------|------|----------|
| PDF premium | imagens (webp/avif) | bloqueado | queimado + vivo | manifest assinado | obrigatório | escalonada |
| Texto premium | canvas | bloqueado | vivo | RBAC | obrigatório | escalonada |
| Imagens premium | proxy/manifest | bloqueado | vivo | RBAC | obrigatório | escalonada |
| Anexos | proxy/manifest | bloqueado | n/a | RBAC | obrigatório | escalonada |

### 3.2 MATRIZ B — Vetor × Detecção × Resposta (Escada)

| Vetor | Detecção | Contagem mínima | Resposta |
|-------|----------|----------------:|----------|
| F12 / devtools keys | keydown | 50 | logout + lock |
| Ctrl+C/Cmd+C | keydown/copy | 50 | logout + lock |
| Ctrl+P/Cmd+P | keydown/print | 10 | logout + lock |
| Context menu | contextmenu | 50 | logout + lock |
| Automação | `navigator.webdriver` | 1 | logout imediato |
| Devtools provável | heurística gap | 3 | reload → logout |
| DOM tamper | MutationObserver + checksum | 10 | degradar → logout |
| Print attempt | visibility changes + heurística | 10 | watermark++ + lock |

### 3.3 MATRIZ C — Forense × Onde Grava × Quem Vê

| Prova | Onde grava | RLS | Quem acessa |
|-------|------------|-----|-------------|
| `security_events` | Postgres | estrito | owner/funcionário autorizado |
| `security_risk_state` | Postgres | estrito | owner |
| `security_audit_log` | Postgres + triggers | estrito | owner |
| Acesso a assets | `security_events` | estrito | owner |

---

## 4) DADOS E STORAGE

### 4.1 Buckets (ADICIONAR aos existentes em `src/core/storage.ts`)

```typescript
// Adicionar ao BUCKETS:
ENA_ASSETS_RAW: "ena-assets-raw",           // PDFs originais (NUNCA expor)
ENA_ASSETS_TRANSMUTED: "ena-assets-transmuted", // Páginas geradas (webp/avif)

// Adicionar às BUCKET_DEFINITIONS:
ENA_ASSETS_RAW: {
  public: false,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: ["application/pdf"],
  pathPattern: "{asset_id}/original.pdf",
},
ENA_ASSETS_TRANSMUTED: {
  public: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB por página
  allowedMimeTypes: ["image/webp", "image/avif", "image/png"],
  pathPattern: "{asset_id}/pages/{page_index}.webp",
},
```

### 4.2 SQL Migration — `supabase/migrations/20251222800000_sanctum_pdf_omega.sql`

```sql
-- ============================================
-- 🌌 SANCTUM 3.0 — PROTECT PDF OMEGA
-- PROTEÇÃO TOTAL DE CONTEÚDO DIGITAL
-- ESTE É O PROJETO DA VIDA DO MESTRE
-- ============================================

-- ============================================
-- PARTE 1: TABELAS DE ASSETS
-- ============================================

-- 1.1 Assets (PDFs, livros, imagens premium)
CREATE TABLE IF NOT EXISTS public.ena_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('pdf', 'web_text', 'image', 'attachment')),
  title TEXT,
  description TEXT,
  
  -- Storage
  raw_bucket TEXT NOT NULL DEFAULT 'ena-assets-raw',
  raw_path TEXT NOT NULL,
  transmuted_bucket TEXT NOT NULL DEFAULT 'ena-assets-transmuted',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
  page_count INT DEFAULT 0,
  sha256 TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  -- Controle de acesso
  required_role TEXT DEFAULT 'beta',
  is_premium BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Páginas de assets (PDFs transmutados)
CREATE TABLE IF NOT EXISTS public.ena_asset_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.ena_assets(id) ON DELETE CASCADE,
  page_index INT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Dimensões
  width INT,
  height INT,
  bytes INT,
  
  -- Watermark queimada
  watermark_burned BOOLEAN DEFAULT false,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(asset_id, page_index)
);

-- 1.3 Fila de jobs (transmutação)
CREATE TABLE IF NOT EXISTS public.sanctum_jobs_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('transmute_pdf', 'rebuild_watermark', 'purge_asset', 'generate_text_pages')),
  payload JSONB NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'dead')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  last_error TEXT,
  
  -- Lock
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 1.4 Estado de risco de segurança (por usuário)
CREATE TABLE IF NOT EXISTS public.sanctum_risk_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_score INT NOT NULL DEFAULT 0,
  last_event_at TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  lock_reason TEXT,
  total_violations INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 Acesso a assets (forense)
CREATE TABLE IF NOT EXISTS public.sanctum_asset_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Usuário
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_role TEXT,
  session_id TEXT,
  
  -- Asset
  asset_id UUID REFERENCES public.ena_assets(id),
  asset_kind TEXT,
  
  -- Ação
  action TEXT NOT NULL, -- 'manifest_issued', 'page_viewed', 'violation_detected'
  
  -- Contexto
  ip_hash TEXT,
  ua_hash TEXT,
  domain TEXT,
  route TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- PARTE 2: ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ena_assets_status ON public.ena_assets(status);
CREATE INDEX IF NOT EXISTS idx_ena_assets_kind ON public.ena_assets(kind);
CREATE INDEX IF NOT EXISTS idx_ena_assets_created_by ON public.ena_assets(created_by);
CREATE INDEX IF NOT EXISTS idx_ena_asset_pages_asset ON public.ena_asset_pages(asset_id);
CREATE INDEX IF NOT EXISTS idx_sanctum_jobs_status ON public.sanctum_jobs_queue(status, run_after);
CREATE INDEX IF NOT EXISTS idx_sanctum_risk_user ON public.sanctum_risk_state(user_id);
CREATE INDEX IF NOT EXISTS idx_sanctum_risk_locked ON public.sanctum_risk_state(locked_until) WHERE locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sanctum_access_user ON public.sanctum_asset_access(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sanctum_access_asset ON public.sanctum_asset_access(asset_id, created_at DESC);

-- ============================================
-- PARTE 3: FUNÇÕES
-- ============================================

-- 3.1 Aplicar risco após evento de segurança
CREATE OR REPLACE FUNCTION public.fn_apply_sanctum_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_score INT;
  lock_until TIMESTAMPTZ;
  severity_value INT;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calcular severidade baseado no metadata
  severity_value := COALESCE((NEW.metadata->>'severity')::INT, 10);
  
  -- Inserir ou atualizar estado de risco
  INSERT INTO public.sanctum_risk_state(user_id, risk_score, last_event_at, total_violations)
  VALUES (NEW.user_id, severity_value, now(), 1)
  ON CONFLICT (user_id) DO UPDATE SET
    risk_score = public.sanctum_risk_state.risk_score + severity_value,
    last_event_at = now(),
    total_violations = public.sanctum_risk_state.total_violations + 1,
    updated_at = now();
  
  -- Buscar score atualizado
  SELECT risk_score INTO new_score 
  FROM public.sanctum_risk_state 
  WHERE user_id = NEW.user_id;
  
  -- Aplicar lock baseado no score
  IF new_score >= 300 THEN
    lock_until := now() + INTERVAL '24 hours';
    UPDATE public.sanctum_risk_state 
    SET locked_until = lock_until, lock_reason = 'HIGH_RISK_SCORE_300+', updated_at = now() 
    WHERE user_id = NEW.user_id;
  ELSIF new_score >= 150 THEN
    lock_until := now() + INTERVAL '2 hours';
    UPDATE public.sanctum_risk_state 
    SET locked_until = lock_until, lock_reason = 'MEDIUM_RISK_SCORE_150+', updated_at = now() 
    WHERE user_id = NEW.user_id;
  ELSIF new_score >= 100 THEN
    lock_until := now() + INTERVAL '30 minutes';
    UPDATE public.sanctum_risk_state 
    SET locked_until = lock_until, lock_reason = 'LOW_RISK_SCORE_100+', updated_at = now() 
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para aplicar risco
DROP TRIGGER IF EXISTS trg_apply_sanctum_risk ON public.sanctum_asset_access;
CREATE TRIGGER trg_apply_sanctum_risk
AFTER INSERT ON public.sanctum_asset_access
FOR EACH ROW
WHEN (NEW.action = 'violation_detected')
EXECUTE FUNCTION public.fn_apply_sanctum_risk();

-- 3.2 Verificar se usuário está bloqueado
CREATE OR REPLACE FUNCTION public.fn_check_sanctum_lock(p_user_id UUID)
RETURNS TABLE(is_locked BOOLEAN, locked_until TIMESTAMPTZ, lock_reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN sr.locked_until > now() THEN true ELSE false END,
    sr.locked_until,
    sr.lock_reason
  FROM public.sanctum_risk_state sr
  WHERE sr.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, NULL::TEXT;
  END IF;
END;
$$;

-- 3.3 Decay de score (executar via cron diário)
CREATE OR REPLACE FUNCTION public.fn_decay_sanctum_scores()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected INT;
BEGIN
  UPDATE public.sanctum_risk_state
  SET 
    risk_score = GREATEST(0, risk_score - 10),
    updated_at = now()
  WHERE 
    risk_score > 0
    AND (last_event_at IS NULL OR last_event_at < now() - INTERVAL '24 hours');
  
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- 3.4 Obter manifest de asset (verificando permissões)
CREATE OR REPLACE FUNCTION public.fn_get_asset_manifest(
  p_asset_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_asset RECORD;
  v_profile RECORD;
  v_lock RECORD;
  v_pages JSONB;
BEGIN
  -- Verificar lock
  SELECT * INTO v_lock FROM public.fn_check_sanctum_lock(p_user_id);
  IF v_lock.is_locked THEN
    RETURN jsonb_build_object('error', 'USER_LOCKED', 'locked_until', v_lock.locked_until);
  END IF;
  
  -- Buscar perfil
  SELECT role, access_expires_at, name, cpf INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Owner ignora tudo
  IF v_profile.role = 'owner' THEN
    -- Continua
  ELSIF v_profile.role = 'beta' THEN
    -- Verificar expiração
    IF v_profile.access_expires_at IS NOT NULL AND v_profile.access_expires_at < now() THEN
      RETURN jsonb_build_object('error', 'ACCESS_EXPIRED');
    END IF;
  ELSIF v_profile.role IN ('funcionario', 'admin') THEN
    -- Continua
  ELSE
    RETURN jsonb_build_object('error', 'FORBIDDEN');
  END IF;
  
  -- Buscar asset
  SELECT * INTO v_asset FROM public.ena_assets WHERE id = p_asset_id;
  IF NOT FOUND OR v_asset.status != 'ready' THEN
    RETURN jsonb_build_object('error', 'NOT_FOUND');
  END IF;
  
  -- Buscar páginas
  SELECT jsonb_agg(jsonb_build_object(
    'page', page_index,
    'path', storage_path,
    'width', width,
    'height', height
  ) ORDER BY page_index)
  INTO v_pages
  FROM public.ena_asset_pages
  WHERE asset_id = p_asset_id;
  
  -- Registrar acesso
  INSERT INTO public.sanctum_asset_access(user_id, user_email, user_role, asset_id, asset_kind, action, metadata)
  VALUES (p_user_id, v_profile.name, v_profile.role, p_asset_id, v_asset.kind, 'manifest_issued', 
    jsonb_build_object('page_count', v_asset.page_count));
  
  RETURN jsonb_build_object(
    'asset_id', p_asset_id,
    'title', v_asset.title,
    'page_count', v_asset.page_count,
    'pages', v_pages,
    'watermark_seed', v_profile.name || ' • ' || COALESCE(LEFT(v_profile.cpf, 3) || '.***.***-' || RIGHT(v_profile.cpf, 2), p_user_id::TEXT)
  );
END;
$$;

-- ============================================
-- PARTE 4: RLS
-- ============================================

ALTER TABLE public.ena_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ena_asset_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctum_jobs_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctum_risk_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctum_asset_access ENABLE ROW LEVEL SECURITY;

-- Assets: admin/owner podem tudo, outros só leem se premium=false ou role permitido
CREATE POLICY "ena_assets_select" ON public.ena_assets FOR SELECT USING (
  is_premium = false 
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND (p.role = 'owner' OR p.role = 'admin' OR p.role = 'beta' OR p.role = 'funcionario')
  )
);

CREATE POLICY "ena_assets_admin" ON public.ena_assets FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('owner', 'admin')
  )
);

-- Asset pages: mesma regra
CREATE POLICY "ena_asset_pages_select" ON public.ena_asset_pages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ena_assets a
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE a.id = ena_asset_pages.asset_id
    AND (a.is_premium = false OR p.role IN ('owner', 'admin', 'beta', 'funcionario'))
  )
);

-- Jobs: apenas admin/owner
CREATE POLICY "sanctum_jobs_admin" ON public.sanctum_jobs_queue FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('owner', 'admin')
  )
);

-- Risk state: apenas owner
CREATE POLICY "sanctum_risk_owner" ON public.sanctum_risk_state FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'owner'
  )
);

-- Asset access: owner e próprio usuário (leitura)
CREATE POLICY "sanctum_access_owner" ON public.sanctum_asset_access FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'owner'
  )
);

CREATE POLICY "sanctum_access_self" ON public.sanctum_asset_access FOR SELECT USING (
  user_id = auth.uid()
);
```

---

## 5) EDGE FUNCTIONS

### 5.1 `supabase/functions/sanctum-asset-manifest/index.ts`

```typescript
// ============================================
// 🌌 SANCTUM ASSET MANIFEST
// Retorna manifest assinado de páginas
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Autenticar usuário
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Obter assetId
    const url = new URL(req.url);
    const assetId = url.searchParams.get("assetId") ?? "";
    
    if (!assetId) {
      return new Response(JSON.stringify({ error: "ASSET_ID_REQUIRED" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Chamar função SQL que verifica permissões
    const { data: manifest, error: manifestErr } = await supabase
      .rpc("fn_get_asset_manifest", { p_asset_id: assetId, p_user_id: user.id });
    
    if (manifestErr) {
      return new Response(JSON.stringify({ error: manifestErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (manifest?.error) {
      const status = manifest.error === "FORBIDDEN" ? 403 : 
                    manifest.error === "USER_LOCKED" ? 423 : 
                    manifest.error === "ACCESS_EXPIRED" ? 402 : 404;
      return new Response(JSON.stringify(manifest), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Gerar signed URLs para cada página
    const pages = manifest.pages || [];
    const signedPages = [];
    
    for (const page of pages) {
      const { data } = await supabase.storage
        .from("ena-assets-transmuted")
        .createSignedUrl(page.path, 120); // 2 minutos
      
      if (data?.signedUrl) {
        signedPages.push({
          page: page.page,
          url: data.signedUrl,
          width: page.width,
          height: page.height
        });
      }
    }

    return new Response(JSON.stringify({
      assetId: manifest.asset_id,
      title: manifest.title,
      pageCount: manifest.page_count,
      expiresInSec: 120,
      pages: signedPages,
      watermarkSeed: manifest.watermark_seed,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
```

### 5.2 `supabase/functions/sanctum-report-violation/index.ts`

```typescript
// ============================================
// 🌌 SANCTUM REPORT VIOLATION
// Registra violação de segurança
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceKey);

    // Autenticar usuário
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    const body = await req.json();
    const { violationType, severity, assetId, metadata } = body;

    // Hash de IP e UA para privacidade
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    
    const encoder = new TextEncoder();
    const ipHash = await crypto.subtle.digest("SHA-256", encoder.encode(ip));
    const uaHash = await crypto.subtle.digest("SHA-256", encoder.encode(ua));

    // Registrar violação
    await supabase.from("sanctum_asset_access").insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      asset_id: assetId ?? null,
      action: "violation_detected",
      domain: req.headers.get("host") ?? "",
      route: req.headers.get("referer") ?? "",
      ip_hash: Array.from(new Uint8Array(ipHash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16),
      ua_hash: Array.from(new Uint8Array(uaHash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16),
      metadata: {
        violation_type: violationType,
        severity: severity ?? 25,
        ...metadata
      }
    });

    // Verificar se usuário foi bloqueado
    let lockStatus = null;
    if (user) {
      const { data } = await supabase.rpc("fn_check_sanctum_lock", { p_user_id: user.id });
      lockStatus = data?.[0] ?? null;
    }

    return new Response(JSON.stringify({
      ok: true,
      locked: lockStatus?.is_locked ?? false,
      lockedUntil: lockStatus?.locked_until ?? null
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
```

---

## 6) FRONTEND — IMPLEMENTAÇÃO TÉCNICA

### 6.1 `src/hooks/useSanctumCore.ts`

```typescript
// ============================================
// 🌌 SANCTUM CORE HOOK — SENTINELA DE SEGURANÇA
// Detecta violações e reporta ao backend
// ============================================

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SanctumContext {
  resourceId: string;
  resourceType: "pdf" | "web_text" | "image" | "video";
}

interface Threat {
  type: string;
  severity: number;
  meta?: Record<string, unknown>;
}

const OWNER_EMAIL = "moisesblank@gmail.com";

export function useSanctumCore(ctx: SanctumContext) {
  const { profile, session, signOut } = useAuth();
  const isOwner = profile?.role === "owner" || profile?.email?.toLowerCase() === OWNER_EMAIL;
  const counters = useRef<Record<string, number>>({});
  const lastSend = useRef<number>(0);

  const bump = useCallback((k: string, add = 1) => {
    counters.current[k] = (counters.current[k] ?? 0) + add;
    return counters.current[k];
  }, []);

  const reportViolation = useCallback(async (t: Threat) => {
    const now = Date.now();
    if (now - lastSend.current < 500) return; // Rate limit
    lastSend.current = now;

    try {
      const { data, error } = await supabase.functions.invoke("sanctum-report-violation", {
        body: {
          violationType: t.type,
          severity: t.severity,
          assetId: ctx.resourceId,
          metadata: { ...t.meta, resourceType: ctx.resourceType }
        }
      });

      // Se foi bloqueado, fazer logout
      if (data?.locked) {
        toast.error("Sua conta foi temporariamente bloqueada por atividade suspeita.");
        await signOut();
      }
    } catch (err) {
      console.error("[Sanctum] Erro ao reportar:", err);
    }
  }, [ctx.resourceId, ctx.resourceType, signOut]);

  const punish = useCallback(async (severity: number, reason: string) => {
    if (isOwner) return;
    await reportViolation({ type: "sanctum_punish", severity, meta: { reason } });
    toast.error("Atividade suspeita detectada. Você será desconectado.");
    await signOut();
  }, [isOwner, reportViolation, signOut]);

  // Handler de keydown
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (isOwner) return;

    const k = e.key.toLowerCase();
    const isCtrl = e.ctrlKey || e.metaKey;

    // DevTools keys
    const devtools =
      e.key === "F12" ||
      (isCtrl && e.shiftKey && ["i", "j", "c"].includes(k)) ||
      (isCtrl && ["u", "s"].includes(k));

    // Print
    const print = isCtrl && k === "p";

    // Copy
    const copy = isCtrl && ["c", "x", "a"].includes(k);

    if (devtools || print || copy) {
      e.preventDefault();
      e.stopPropagation();

      const type = devtools ? "devtools_key_attempt" : print ? "print_shortcut_attempt" : "copy_shortcut_attempt";
      const sev = devtools ? 35 : print ? 30 : 25;
      const n = bump(type);

      void reportViolation({ type, severity: sev, meta: { count: n, key: k } });

      if (n >= 50) void punish(95, `${type}>=50`);
    }
  }, [isOwner, bump, reportViolation, punish]);

  // Handler de context menu
  const onContextMenu = useCallback((e: Event) => {
    if (isOwner) return;
    e.preventDefault();
    const n = bump("contextmenu_blocked");
    void reportViolation({ type: "contextmenu_blocked", severity: 10, meta: { count: n } });
    if (n >= 50) void punish(90, "contextmenu>=50");
  }, [isOwner, bump, reportViolation, punish]);

  // Handler de copy
  const onCopy = useCallback((e: ClipboardEvent) => {
    if (isOwner) return;
    e.preventDefault();
    e.clipboardData?.setData("text/plain", "");
    const n = bump("copy_event_blocked");
    void reportViolation({ type: "copy_event_blocked", severity: 20, meta: { count: n } });
    if (n >= 50) void punish(92, "copy_event>=50");
  }, [isOwner, bump, reportViolation, punish]);

  // Heurística de DevTools
  const devtoolsHeuristic = useCallback(() => {
    if (isOwner) return;
    const w = Math.abs(window.outerWidth - window.innerWidth);
    const h = Math.abs(window.outerHeight - window.innerHeight);
    if (w > 160 || h > 160) {
      const n = bump("devtools_probable");
      void reportViolation({ type: "devtools_probable", severity: 55, meta: { count: n, w, h } });
      if (n >= 3) void punish(80, "devtools_probable_repeat");
    }
  }, [isOwner, bump, reportViolation, punish]);

  // Registrar superfície protegida
  const registerProtectedSurface = useCallback(() => {
    void reportViolation({ type: "protected_surface_opened", severity: 0, meta: { path: window.location.pathname } });
  }, [reportViolation]);

  // Setup
  useEffect(() => {
    if (!profile || isOwner) return;

    // Detectar automação
    if ((navigator as any).webdriver) {
      void reportViolation({ type: "automation_webdriver", severity: 95 });
      void punish(95, "navigator.webdriver");
    }

    // Event listeners
    window.addEventListener("keydown", onKeyDown, { capture: true });
    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("copy", onCopy, { capture: true });

    // MutationObserver para detectar tampering
    const observer = new MutationObserver((mutations) => {
      const n = bump("dom_mutation", mutations.length);
      if (n >= 50) {
        void reportViolation({ type: "dom_mutation_detected", severity: 15, meta: { count: n } });
      }
      if (n >= 100) void punish(85, "dom_mutation>=100");
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Intervalo para heurística de devtools
    const interval = setInterval(devtoolsHeuristic, 2000);

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      document.removeEventListener("contextmenu", onContextMenu, { capture: true });
      document.removeEventListener("copy", onCopy, { capture: true });
      observer.disconnect();
      clearInterval(interval);
    };
  }, [profile, isOwner, onKeyDown, onContextMenu, onCopy, devtoolsHeuristic, reportViolation, punish, bump]);

  return { registerProtectedSurface, isOwner };
}
```

### 6.2 `src/components/security/SanctumWatermark.tsx`

```typescript
// ============================================
// 🌌 SANCTUM WATERMARK — MARCA D'ÁGUA DINÂMICA
// ============================================

import React, { useEffect, useMemo, useState, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";

function bucket20s() {
  return Math.floor(Date.now() / 20000);
}

export const SanctumWatermark = memo(() => {
  const { profile } = useAuth();
  const [tick, setTick] = useState(bucket20s());

  useEffect(() => {
    const id = setInterval(() => setTick(bucket20s()), 20000);
    return () => clearInterval(id);
  }, []);

  const text = useMemo(() => {
    const name = profile?.name ?? profile?.email ?? "ALUNO";
    const id = profile?.id?.slice(0, 8) ?? "UNKNOWN";
    const cpf = profile?.cpf 
      ? `${profile.cpf.slice(0, 3)}.***.***-${profile.cpf.slice(-2)}`
      : "";
    const time = new Date().toLocaleString("pt-BR");
    return `${name} • ${cpf || id} • ${time}`;
  }, [profile, tick]);

  return (
    <div className="sanctum-watermark" aria-hidden="true">
      <div className="sanctum-watermark-inner">
        {/* Repetir o texto várias vezes para cobrir a tela */}
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i}>{text}{"    "}</span>
        ))}
      </div>
    </div>
  );
});

SanctumWatermark.displayName = "SanctumWatermark";
```

### 6.3 `src/components/security/SanctumProtectedContent.tsx`

```typescript
// ============================================
// 🌌 SANCTUM PROTECTED CONTENT — WRAPPER UNIVERSAL
// ============================================

import React, { useEffect, memo } from "react";
import { useSanctumCore } from "@/hooks/useSanctumCore";
import { SanctumWatermark } from "./SanctumWatermark";
import { cn } from "@/lib/utils";

interface SanctumProtectedContentProps {
  resourceId: string;
  resourceType: "pdf" | "web_text" | "image" | "video";
  children: React.ReactNode;
  watermark?: boolean;
  className?: string;
}

export const SanctumProtectedContent = memo(({
  resourceId,
  resourceType,
  children,
  watermark = true,
  className
}: SanctumProtectedContentProps) => {
  const { registerProtectedSurface, isOwner } = useSanctumCore({ resourceId, resourceType });

  useEffect(() => {
    registerProtectedSurface();
  }, [registerProtectedSurface]);

  return (
    <div 
      className={cn("sanctum-protected-surface", className)}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {watermark && !isOwner && <SanctumWatermark />}
      {children}
    </div>
  );
});

SanctumProtectedContent.displayName = "SanctumProtectedContent";
```

### 6.4 `src/components/security/HologramText.tsx`

```typescript
// ============================================
// 🌌 HOLOGRAM TEXT — TEXTO EM CANVAS (NÃO SELECIONÁVEL)
// ============================================

import React, { useEffect, useRef, memo } from "react";

interface HologramTextProps {
  text: string;
  font?: string;
  color?: string;
  lineHeight?: number;
  className?: string;
}

export const HologramText = memo(({
  text,
  font = "16px Inter, sans-serif",
  color = "#0f172a",
  lineHeight = 24,
  className
}: HologramTextProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.font = font;
    ctx.fillStyle = color;
    
    wrapText(ctx, text, 0, lineHeight, rect.width, lineHeight);
  }, [text, font, color, lineHeight]);

  return (
    <div className={className} style={{ position: "relative", userSelect: "none" }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: "100%", height: "auto", minHeight: 100 }}
      />
      {/* Texto real fora da tela para acessibilidade (aria-only) */}
      <div 
        style={{ 
          position: "absolute", 
          left: "-99999px", 
          top: "-99999px",
          width: 1,
          height: 1,
          overflow: "hidden"
        }}
        aria-hidden="false"
      >
        {text}
      </div>
    </div>
  );
});

HologramText.displayName = "HologramText";

function wrapText(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  x: number, 
  y: number, 
  maxWidth: number, 
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
```

### 6.5 `src/components/pdf/SecurePdfViewerOmega.tsx`

```typescript
// ============================================
// 🌌 SECURE PDF VIEWER OMEGA — VIEWER POR IMAGENS
// ============================================

import React, { useEffect, useState, useMemo, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { SanctumProtectedContent } from "@/components/security/SanctumProtectedContent";
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Manifest {
  assetId: string;
  title?: string;
  pageCount: number;
  expiresInSec: number;
  pages: Array<{ page: number; url: string; width?: number; height?: number }>;
  watermarkSeed: string;
}

interface SecurePdfViewerOmegaProps {
  assetId: string;
  title?: string;
  className?: string;
}

export const SecurePdfViewerOmega = memo(({ assetId, title, className }: SecurePdfViewerOmegaProps) => {
  const { session } = useAuth();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke("sanctum-asset-manifest", {
          body: {},
          headers: {},
        });

        // Alternativa: usar fetch direto com query params
        const baseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${baseUrl}/functions/v1/sanctum-asset-manifest?assetId=${assetId}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao carregar documento");
        }

        const manifestData = await res.json();
        setManifest(manifestData);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar documento");
      } finally {
        setLoading(false);
      }
    };

    if (assetId && session) {
      fetchManifest();
    }
  }, [assetId, session]);

  const pages = useMemo(() => 
    (manifest?.pages ?? []).slice().sort((a, b) => a.page - b.page), 
    [manifest]
  );

  const currentPageData = pages[currentPage];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando documento protegido...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-destructive">
        <Shield className="w-10 h-10 mr-3" />
        <span>{error}</span>
      </div>
    );
  }

  if (!manifest || pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <span>Documento não encontrado ou sem páginas</span>
      </div>
    );
  }

  return (
    <SanctumProtectedContent resourceId={assetId} resourceType="pdf">
      <div className={cn("sanctum-pdf-viewer flex flex-col bg-background rounded-xl border", className)}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium truncate max-w-[200px]">
              {title || manifest.title || "Documento Protegido"}
            </span>
            <Lock className="w-3 h-3 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom */}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(50, z - 25))} disabled={zoom <= 50}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(200, z + 25))} disabled={zoom >= 200}>
              <ZoomIn className="w-4 h-4" />
            </Button>

            {/* Páginas */}
            <div className="flex items-center gap-1 ml-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage <= 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                {currentPage + 1} / {pages.length}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage >= pages.length - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-muted/20 min-h-[500px] flex items-center justify-center p-4">
          {currentPageData && (
            <img
              src={currentPageData.url}
              alt={`Página ${currentPage + 1}`}
              loading="lazy"
              decoding="async"
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{ 
                transform: `scale(${zoom / 100})`,
                transformOrigin: "center top"
              }}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 border-t">
          <Shield className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-muted-foreground">
            Documento protegido • {manifest.watermarkSeed}
          </span>
        </div>
      </div>
    </SanctumProtectedContent>
  );
});

SecurePdfViewerOmega.displayName = "SecurePdfViewerOmega";
```

### 6.6 `src/styles/sanctum.css`

```css
/* ============================================
   🌌 SANCTUM CSS — PROTEÇÃO VISUAL
   ============================================ */

/* Superfície protegida */
.sanctum-protected-surface {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.sanctum-protected-surface * {
  user-select: none !important;
  -webkit-user-select: none !important;
}

/* Watermark */
.sanctum-watermark {
  position: fixed;
  inset: 0;
  z-index: 999999;
  pointer-events: none;
  opacity: 0.12;
  transform: translateZ(0);
  overflow: hidden;
}

.sanctum-watermark-inner {
  position: absolute;
  inset: -40%;
  transform: rotate(-25deg);
  font-size: clamp(12px, 2vw, 40px);
  line-height: 3.5;
  white-space: pre;
  letter-spacing: 0.08em;
  font-family: monospace;
  color: currentColor;
}

/* PDF Viewer */
.sanctum-pdf-viewer {
  user-select: none;
}

.sanctum-pdf-viewer img {
  pointer-events: none;
}

/* Bloquear impressão */
@media print {
  .sanctum-protected-surface,
  .sanctum-protected-surface * {
    display: none !important;
    visibility: hidden !important;
  }
  
  body::after {
    content: "⚠️ IMPRESSÃO NÃO PERMITIDA - DOCUMENTO PROTEGIDO ⚠️";
    display: block;
    font-size: 24px;
    text-align: center;
    padding: 100px 50px;
    color: #dc2626;
    font-weight: bold;
  }
}
```

---

## 7) CSP E HEADERS (SEM QUEBRAR PANDA VIDEO)

Aplicar no seu deploy (Cloudflare, Netlify, etc.):

```json
{
  "headers": [
    {
      "for": "/*",
      "values": {
        "Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src https://player.pandavideo.com.br https://*.youtube.com;",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
      }
    }
  ]
}
```

---

## 8) INVENTÁRIO DE ARQUIVOS

### Backend (Supabase)
| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/20251222800000_sanctum_pdf_omega.sql` | CRIAR | Tabelas e funções |
| `supabase/functions/sanctum-asset-manifest/index.ts` | CRIAR | Edge Function para manifest |
| `supabase/functions/sanctum-report-violation/index.ts` | CRIAR | Edge Function para violações |

### Frontend (src/)
| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useSanctumCore.ts` | CRIAR | Hook de segurança |
| `src/components/security/SanctumWatermark.tsx` | CRIAR | Watermark dinâmica |
| `src/components/security/SanctumProtectedContent.tsx` | CRIAR | Wrapper universal |
| `src/components/security/HologramText.tsx` | CRIAR | Texto em canvas |
| `src/components/pdf/SecurePdfViewerOmega.tsx` | CRIAR | Viewer por imagens |
| `src/styles/sanctum.css` | CRIAR | CSS de proteção |
| `src/core/storage.ts` | ATUALIZAR | Adicionar buckets |

---

## 9) CHECKLIST FINAL (OBRIGATÓRIO)

| Item | Como validar | Passou/Falhou |
|------|--------------|---------------|
| PDF nunca "puro" no client | Network sem `.pdf` | |
| Texto premium não seleciona | Tentar select/copy | |
| Print bloqueado (Ctrl+P) | Testar atalho | |
| DevTools loga violação | Abrir F12 | |
| Automação detecta | `navigator.webdriver` | |
| CSP ativa | `curl -I` nos headers | |
| Lock automático funciona | Simular 50 violações | |
| Watermark aparece | Visual | |
| Owner ignora restrições | Testar com moisesblank@gmail.com | |

---

## 10) COMANDO FINAL (COLE NA LOVABLE)

```
Implemente o PROTOCOLO SANCTUM 3.0 — PROTECT PDF OMEGA conforme especificado no documento PROMPT_LOVABLE_SANCTUM_PDF_DEFINITIVO.md.

REGRAS:
1. NÃO criar tabelas duplicadas - usar as existentes quando possível
2. Integrar com o sistema de controle de acesso existente (urlAccessControl.ts)
3. Owner (moisesblank@gmail.com) ignora TODAS as restrições
4. PDF original NUNCA chega ao client
5. Texto premium renderizado em canvas (não selecionável)
6. Watermark dinâmica com nome + CPF + timestamp
7. Violações escalam até lock temporário
8. Logs forenses completos

ARQUIVOS A CRIAR:
- supabase/migrations/20251222800000_sanctum_pdf_omega.sql
- supabase/functions/sanctum-asset-manifest/index.ts
- supabase/functions/sanctum-report-violation/index.ts
- src/hooks/useSanctumCore.ts
- src/components/security/SanctumWatermark.tsx
- src/components/security/SanctumProtectedContent.tsx
- src/components/security/HologramText.tsx
- src/components/pdf/SecurePdfViewerOmega.tsx
- src/styles/sanctum.css

Validar com checklist antes de dizer PRONTO.
```

---

**✅ STATUS: PROMPT DEFINITIVO — MELHORADO UM MILHÃO DE VEZES!**

**ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS!**
