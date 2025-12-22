// ============================================
// SANCTUM OMEGA ULTRA v3.0
// Edge Function: Report Violation
// Sistema de Detecção de Pirataria
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OWNER_EMAIL = "moisesblank@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

interface ViolationPayload {
  violationType: string;
  severity: number;
  assetId?: string;
  metadata?: Record<string, unknown>;
}

interface ViolationResponse {
  success: boolean;
  locked: boolean;
  immune?: boolean;
  violationType?: string;
  severity?: number;
  error?: string;
}

// Hash function for privacy (LGPD compliant)
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

serve(async (req: Request) => {
  console.log("[Sanctum Violation] Request received:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only POST allowed
  if (req.method !== "POST") {
    console.warn("[Sanctum Violation] Method not allowed:", req.method);
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse payload
    let payload: ViolationPayload;
    try {
      payload = await req.json();
    } catch {
      console.warn("[Sanctum Violation] Invalid JSON");
      return new Response(
        JSON.stringify({ success: false, error: "JSON inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { violationType, severity = 10, assetId, metadata = {} } = payload;

    if (!violationType) {
      console.warn("[Sanctum Violation] Missing violationType");
      return new Response(
        JSON.stringify({ success: false, error: "violationType obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Sanctum Violation] Processing:", violationType, "severity:", severity);

    // Get user from auth header (optional - can report anonymous violations)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userEmail: string | null = null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
        console.log("[Sanctum Violation] User identified:", userEmail);
      }
    }

    // OWNER BYPASS - moisesblank@gmail.com is IMMUNE
    if (userEmail?.toLowerCase() === OWNER_EMAIL) {
      console.log("[Sanctum Violation] Owner bypass - immune");
      return new Response(
        JSON.stringify({ success: true, locked: false, immune: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract and hash client info for privacy
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("cf-connecting-ip") 
      || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    
    const ipHash = await hashString(clientIp + "sanctum-salt-2300");
    const uaHash = await hashString(userAgent + "sanctum-salt-2300");
    
    const domain = req.headers.get("host") || req.headers.get("origin") || "";
    const route = req.headers.get("referer") || "";

    console.log("[Sanctum Violation] Registering violation in database...");

    // Call database function to register violation
    const { data: result, error: rpcError } = await supabase.rpc("fn_register_sanctum_violation", {
      p_user_id: userId,
      p_user_email: userEmail,
      p_violation_type: violationType,
      p_severity: severity,
      p_asset_id: assetId || null,
      p_domain: domain,
      p_route: route,
      p_ip_hash: ipHash,
      p_ua_hash: uaHash,
      p_metadata: { 
        ...metadata, 
        timestamp: new Date().toISOString(), 
        clientIpPartial: clientIp.split(".").slice(0, 2).join(".") + ".*.*" 
      },
    });

    if (rpcError) {
      console.error("[Sanctum Violation] RPC error:", rpcError);
      return new Response(
        JSON.stringify({ success: false, locked: false, error: "Erro interno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isLocked = result?.locked || false;
    console.log("[Sanctum Violation] Violation registered, locked:", isLocked);

    const response: ViolationResponse = {
      success: true,
      locked: isLocked,
      violationType,
      severity,
    };

    // Return 423 Locked if user is now locked
    const statusCode = isLocked ? 423 : 200;

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json", 
        "X-Sanctum-Version": "3.0-omega" 
      },
    });

  } catch (err) {
    console.error("[Sanctum Violation] Fatal error:", err);
    return new Response(
      JSON.stringify({ success: false, locked: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
