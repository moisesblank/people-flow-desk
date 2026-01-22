import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogEntry {
  timestamp: string;
  severity: "info" | "warning" | "error" | "critical";
  affected_url_or_area: string;
  triggered_action: string;
  error_message: string;
  user_id?: string;
  user_email?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const logEntry: LogEntry = await req.json();
    const now = new Date();

    // Gerar path do arquivo: YYYY/MM/DD/logs.txt
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const filePath = `${year}/${month}/${day}/logs.txt`;

    // Formatar linha de log em TXT simples (append-only, lightweight)
    const logLine = `[${logEntry.timestamp}] [${logEntry.severity.toUpperCase()}] ${logEntry.affected_url_or_area} | ${logEntry.triggered_action} | ${logEntry.error_message}\n`;

    // Tentar baixar arquivo existente para append
    let existingContent = "";
    const { data: existingFile } = await supabase.storage.from("system-logs").download(filePath);

    if (existingFile) {
      existingContent = await existingFile.text();
    }

    // Append nova linha
    const newContent = existingContent + logLine;

    // Upload com upsert (sobrescreve o arquivo)
    const { error: uploadError } = await supabase.storage
      .from("system-logs")
      .upload(filePath, new Blob([newContent], { type: "text/plain" }), {
        upsert: true,
        contentType: "text/plain",
      });

    if (uploadError) {
      console.error("Erro ao salvar log em TXT:", uploadError);
    }

    // Também inserir no banco para realtime (será limpo após 7 dias)
    const { error: dbError } = await supabase.from("system_realtime_logs").insert({
      severity: logEntry.severity,
      affected_url_or_area: logEntry.affected_url_or_area,
      triggered_action: logEntry.triggered_action,
      error_message: logEntry.error_message,
      user_id: logEntry.user_id || null,
      user_email: logEntry.user_email || null,
    });

    if (dbError) {
      console.error("Erro ao inserir log no banco:", dbError);
    }

    return new Response(JSON.stringify({ success: true, path: filePath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro no log-writer:", errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
