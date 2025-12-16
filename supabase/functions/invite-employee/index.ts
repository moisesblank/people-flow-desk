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
  senha: string;
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
      console.log("[INVITE] No authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the requesting user is admin/owner
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.log("[INVITE] Invalid token:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin/owner
    const { data: isAdmin } = await supabase.rpc("is_admin_or_owner", { _user_id: user.id });
    if (!isAdmin) {
      console.log("[INVITE] User is not admin/owner:", user.id);
      return new Response(
        JSON.stringify({ error: "Permissão negada. Apenas administradores podem criar acessos." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, nome, senha, funcao, employee_id }: InviteRequest = await req.json();

    if (!email || !nome) {
      return new Response(
        JSON.stringify({ error: "Email e nome são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!senha || senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "Senha é obrigatória e deve ter no mínimo 6 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[INVITE] Creating user: ${email} (${nome})`);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log(`[INVITE] User already exists: ${email}`);
      
      // Update password for existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: senha }
      );

      if (updateError) {
        console.error("[INVITE] Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: `Erro ao atualizar senha: ${updateError.message}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Update employee record if employee_id provided
      if (employee_id) {
        await supabase
          .from("employees")
          .update({ 
            email: email,
            user_id: existingUser.id 
          })
          .eq("id", employee_id);
      }

      console.log(`[INVITE] Password updated for existing user: ${email}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Senha atualizada com sucesso! O funcionário já estava cadastrado.",
          user_id: existingUser.id
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create new user with password
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: senha,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        nome: nome,
        funcao: funcao,
        invited: true,
        employee_id: employee_id,
      },
    });

    if (createError) {
      console.error("[INVITE] Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[INVITE] User created successfully: ${email}, ID: ${newUser.user?.id}`);

    // Update employee record if employee_id provided
    if (employee_id && newUser.user) {
      const { error: updateError } = await supabase
        .from("employees")
        .update({ 
          email: email,
          user_id: newUser.user.id 
        })
        .eq("id", employee_id);
      
      if (updateError) {
        console.warn("[INVITE] Could not update employee:", updateError);
      } else {
        console.log(`[INVITE] Employee ${employee_id} linked to user ${newUser.user.id}`);
      }
    }

    // Assign employee role
    if (newUser.user) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ 
          user_id: newUser.user.id, 
          role: "employee" 
        }, { 
          onConflict: "user_id" 
        });
      
      if (roleError) {
        console.warn("[INVITE] Could not assign role:", roleError);
      } else {
        console.log(`[INVITE] Role 'employee' assigned to ${newUser.user.id}`);
      }
    }

    // Send welcome email (optional - don't fail if it doesn't work)
    try {
      const welcomeHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Bem-vindo(a) — Curso Moisés Medeiros</title>
        </head>
        <body style="margin:0;padding:0;background:#0a0a0f;color:#ffffff;font-family:Segoe UI, Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width:680px;margin:0 auto;padding:24px;">
            <div style="background:linear-gradient(180deg,#131318 0%,#0a0a0f 100%);border-radius:16px;padding:28px;border:1px solid #7D1128;">
              <div style="text-align:center;margin-bottom:18px;">
                <h1 style="margin:0;color:#E62B4A;font-size:22px;">Curso Moisés Medeiros</h1>
                <p style="margin:6px 0 0 0;color:#9aa0a6;font-size:13px;">Acesso criado com sucesso</p>
              </div>

              <h2 style="margin:18px 0 10px 0;font-size:18px;color:#ffffff;">Olá, ${nome}!</h2>

              <div style="color:#e6e6e6;line-height:1.7;font-size:14px;">
                <p style="margin:0 0 12px 0;">Seja muito bem-vindo(a) à equipe do Curso Moisés Medeiros 👊📚</p>

                <p style="margin:0 0 12px 0;">É uma satisfação enorme ter você conosco em um projeto que nasceu com um propósito muito claro: transformar estudo em aprovação e levar nossos alunos ao mais alto nível de desempenho acadêmico, especialmente em Medicina 🎯🩺</p>

                <p style="margin:0 0 12px 0;">Aqui a gente trabalha com padrão elevado, foco em resultado, responsabilidade e compromisso real com aquilo que entrega. Nosso crescimento não é acaso — é fruto de método, consistência e pessoas que entendem que excelência não é discurso, é prática diária ⚙️🔥</p>

                <p style="margin:0 0 12px 0;">Você passa a fazer parte de um time que valoriza organização, profissionalismo, ética e, acima de tudo, respeito aos alunos e à missão educacional que carregamos. Cada função aqui é estratégica e impacta diretamente milhares de estudantes espalhados pelo país 🌍📈</p>

                <p style="margin:0 0 12px 0;"><strong>📌 Ponto importante desde já:</strong><br/>Cada membro da equipe será responsável por manter a planilha atualizada, conforme alinhamentos internos. Isso é essencial para a organização e o bom funcionamento do time.</p>

                <p style="margin:0 0 12px 0;"><strong>🔐 Sobre acessos e login:</strong><br/>Os dados de acesso e orientações iniciais já foram encaminhados via WhatsApp pela Bruna, minha esposa, que cuida diretamente dessa parte operacional com vocês.</p>

                <p style="margin:0 0 12px 0;">Fique à vontade para contribuir, sugerir, aprender e crescer junto com a gente 🤝🚀<br/>As próximas orientações e alinhamentos continuarão sendo passados pelos nossos canais oficiais.</p>

                <p style="margin:0 0 12px 0;">Mais uma vez, seja bem-vindo(a).<br/>Vamos juntos manter — e elevar — o padrão. 💪🔥</p>

                <p style="margin:18px 0 6px 0;">Prof. Moisés Medeiros Melo</p>
                <p style="margin:0;color:#9aa0a6;font-size:12px;">MM CURSO DE QUÍMICA LTDA | O curso que mais aprova e comprova!</p>

                <hr style="border:none;border-top:1px solid #2a2a2f;margin:18px 0;" />

                <p style="margin:0 0 10px 0;color:#cfcfcf;font-size:12px;">
                  Telefone humanizado (WhatsApp): +55 83 9616-9222
                  <span style="color:#666;"> | </span>
                  <a href="https://wa.me/558396169222" style="color:#E62B4A;text-decoration:none;">clique aqui</a>
                </p>
                <p style="margin:0 0 10px 0;color:#cfcfcf;font-size:12px;">João Pessoa – PB | <a href="https://www.moisesmedeiros.com.br" style="color:#E62B4A;text-decoration:none;">www.moisesmedeiros.com.br</a></p>
                <p style="margin:0 0 14px 0;color:#cfcfcf;font-size:12px;">falemcom@moisesmedeiros.com.br</p>

                <p style="margin:0 0 8px 0;color:#9aa0a6;font-size:12px;">Siga nas redes:</p>
                <ul style="margin:0 0 0 18px;padding:0;color:#cfcfcf;font-size:12px;line-height:1.7;">
                  <li>Instagram: <a href="https://instagram.com/moises.profquimica" style="color:#E62B4A;text-decoration:none;">@moises.profquimica</a></li>
                  <li>Canal no Telegram (gratuito): <a href="https://t.me/+KIur74un8Gg2ZWJh" style="color:#E62B4A;text-decoration:none;">https://t.me/+KIur74un8Gg2ZWJh</a></li>
                  <li>YouTube: <a href="https://www.youtube.com/@moises.profquimica" style="color:#E62B4A;text-decoration:none;">moises.profquimica</a></li>
                </ul>

                <p style="margin:18px 0 0 0;color:#9aa0a6;font-size:12px;">Transformando conhecimento em aprovações reais. Capacitando pessoas a alcançarem seus sonhos na Química e na Medicina.</p>
                <p style="margin:10px 0 0 0;color:#9aa0a6;font-size:12px;">Faça parte da maior comunidade de Química do Brasil.</p>
                <p style="margin:10px 0 0 0;color:#9aa0a6;font-size:12px;">CURSO DE QUÍMICA QUE MAIS APROVA E COMPROVA EM UNIVERSIDADES PÚBLICAS DO BRASIL.</p>
              </div>

              <div style="text-align:center;margin-top:18px;">
                <a href="https://gestao.moisesmedeiros.com.br/auth" style="display:inline-block;background:linear-gradient(135deg,#E62B4A,#7D1128);color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">Acessar Sistema</a>
              </div>

              <p style="margin:18px 0 0 0;color:#666;font-size:11px;text-align:center;">© ${new Date().getFullYear()} MM Curso de Química Ltda.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          to: email,
          type: "custom",
          subject: "Seja bem-vindo(a) à equipe — Curso Moisés Medeiros",
          html: welcomeHtml,
        }),
      });

      if (emailResponse.ok) {
        console.log("[INVITE] Welcome email sent successfully");
      } else {
        console.warn("[INVITE] Email sending may have failed");
      }
    } catch (emailErr) {
      console.warn("[INVITE] Email error:", emailErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Acesso criado com sucesso!",
        user_id: newUser.user?.id
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[INVITE] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);