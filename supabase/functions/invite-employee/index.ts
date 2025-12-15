import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface InviteRequest {
  email: string;
  nome: string;
  funcao?: string;
  employee_id?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the requesting user is admin/owner
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin/owner
    const { data: isAdmin } = await supabase.rpc("is_admin_or_owner", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Permission denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, nome, funcao, employee_id }: InviteRequest = await req.json();

    if (!email || !nome) {
      return new Response(
        JSON.stringify({ error: "Email and nome are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[INVITE] Inviting employee: ${email} (${nome})`);

    // Generate magic link for signup
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://fyikfsasudgzsjmumdlw.lovableproject.com"}/auth?invited=true`,
        data: {
          nome: nome,
          invited: true,
          employee_id: employee_id,
        },
      },
    });

    if (inviteError) {
      console.error("[INVITE] Error generating link:", inviteError);
      
      // If user already exists, try to send password reset instead
      if (inviteError.message.includes("already registered")) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${req.headers.get("origin") || "https://fyikfsasudgzsjmumdlw.lovableproject.com"}/auth?reset=true`,
        });
        
        if (resetError) {
          throw resetError;
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Usuário já existe. Email de recuperação de senha enviado." 
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      throw inviteError;
    }

    // Send custom invitation email via Edge Function
    if (inviteData?.properties?.action_link) {
      try {
        // Use the send-notification-email function to send the invite
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: email,
            subject: "Convite para acessar o Sistema - Moisés Medeiros",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 20px; margin: 0;">
                <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #131318 0%, #0a0a0f 100%); border-radius: 16px; padding: 40px; border: 1px solid #7D1128;">
                  
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #E62B4A; margin: 0; font-size: 28px;">🧪 Curso de Química</h1>
                    <p style="color: #888; margin-top: 5px;">Moisés Medeiros</p>
                  </div>
                  
                  <h2 style="color: #ffffff; text-align: center;">Bem-vindo(a), ${nome}!</h2>
                  
                  <p style="color: #cccccc; line-height: 1.6; text-align: center;">
                    Você foi convidado(a) para fazer parte da nossa equipe${funcao ? ` como <strong>${funcao}</strong>` : ''}.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteData.properties.action_link}" 
                       style="display: inline-block; background: linear-gradient(135deg, #E62B4A, #7D1128); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      Acessar Sistema
                    </a>
                  </div>
                  
                  <p style="color: #888888; font-size: 12px; text-align: center;">
                    Se você não esperava este email, pode ignorá-lo com segurança.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
                  
                  <p style="color: #666666; font-size: 11px; text-align: center;">
                    © ${new Date().getFullYear()} Moisés Medeiros - Todos os direitos reservados
                  </p>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.warn("[INVITE] Email sending may have failed, but invite link was generated");
        } else {
          console.log("[INVITE] Email sent successfully");
        }
      } catch (emailErr) {
        console.warn("[INVITE] Email error:", emailErr);
        // Don't fail completely, the magic link was still generated
      }
    }

    // Update employee record if employee_id provided
    if (employee_id) {
      const { error: updateError } = await supabase
        .from("employees")
        .update({ email: email })
        .eq("id", employee_id);
      
      if (updateError) {
        console.warn("[INVITE] Could not update employee email:", updateError);
      }
    }

    console.log(`[INVITE] Success: Invitation sent to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Convite enviado com sucesso!",
        action_link: inviteData?.properties?.action_link
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[INVITE] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
