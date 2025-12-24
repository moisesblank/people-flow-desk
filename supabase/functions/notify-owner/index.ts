import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, type, action_url, send_email } = await req.json();
    
    if (!title || !content) {
      throw new Error("Missing required fields: title and content");
    }
    
    console.log("[Notify Owner] Creating notification:", title);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // Buscar ID do owner
    const { data: ownerRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .single();
    
    if (!ownerRole?.user_id) {
      console.error("[Notify Owner] Owner not found");
      throw new Error("Owner not found");
    }
    
    // Criar notificação no banco
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: ownerRole.user_id,
      title: title,
      message: content,
      type: type || "info",
      action_url: action_url || "/dashboard",
      read: false,
    });
    
    if (notifError) {
      console.error("[Notify Owner] Error creating notification:", notifError);
    } else {
      console.log("[Notify Owner] Notification created in database");
    }
    
    // Enviar email se solicitado
    if (send_email !== false) {
      try {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7D1128;">${title}</h2>
            <p style="white-space: pre-line;">${content}</p>
            ${action_url ? `<p><a href="${action_url}" style="color: #7D1128;">Ver detalhes</a></p>` : ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Notificação automática do sistema de gestão</p>
          </div>
        `;
        
        await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              to: "moisesblank@gmail.com",
              subject: title,
              html: htmlContent,
            }),
          }
        );
        console.log("[Notify Owner] Email notification sent");
      } catch (emailError) {
        console.error("[Notify Owner] Error sending email:", emailError);
      }
    }
    
    console.log("[Notify Owner] ✅ Owner notified successfully");
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Owner notified"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Notify Owner] Error:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
