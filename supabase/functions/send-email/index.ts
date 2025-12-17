import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text, from_name, from_email } = await req.json();
    
    if (!to || !subject || (!html && !text)) {
      throw new Error("Missing required fields: to, subject, and html or text");
    }
    
    console.log("[Send Email] Preparing to send to:", to);
    
    // Tentar SendGrid primeiro
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    
    if (SENDGRID_API_KEY && SENDGRID_API_KEY !== "CONFIGURAR_DEPOIS") {
      console.log("[Send Email] Using SendGrid...");
      
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }],
            subject: subject,
          }],
          from: {
            email: from_email || "falecom@moisesmedeiros.com.br",
            name: from_name || "Curso Moisés Medeiros"
          },
          content: [{
            type: html ? "text/html" : "text/plain",
            value: html || text
          }]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Send Email] SendGrid error:", errorText);
        throw new Error(`SendGrid error: ${response.status}`);
      }
      
      console.log("[Send Email] ✅ Email sent via SendGrid");
      
      return new Response(JSON.stringify({ success: true, provider: "sendgrid" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Tentar Resend como fallback
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (RESEND_API_KEY && RESEND_API_KEY !== "CONFIGURAR_DEPOIS") {
      console.log("[Send Email] Using Resend...");
      
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${from_name || "Curso Moisés Medeiros"} <${from_email || "onboarding@resend.dev"}>`,
          to: [to],
          subject: subject,
          html: html || `<p>${text}</p>`,
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Send Email] Resend error:", errorText);
        throw new Error(`Resend error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("[Send Email] ✅ Email sent via Resend:", result.id);
      
      return new Response(JSON.stringify({ success: true, provider: "resend", id: result.id }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Nenhum provedor configurado
    console.log("[Send Email] No email provider configured");
    
    return new Response(JSON.stringify({ 
      success: false,
      message: "No email provider configured (SendGrid or Resend)",
      email_content: { to, subject, preview: (html || text).substring(0, 200) }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Send Email] Error:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
