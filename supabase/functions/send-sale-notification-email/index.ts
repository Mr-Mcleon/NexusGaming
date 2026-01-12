import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

class Resend {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async sendEmail(options: { from: string; to: string[]; subject: string; html: string }) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }
    
    return response.json();
  }
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SaleNotificationRequest {
  user_id: string;
  game_id: string;
  game_title: string;
  original_price: number;
  sale_price: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, game_id, game_title, original_price, sale_price }: SaleNotificationRequest = await req.json();

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "User not found or no email" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userEmail = userData.user.email;
    const discount = Math.round(((original_price - sale_price) / original_price) * 100);

    const emailResponse = await resend.sendEmail({
      from: "GameVault <onboarding@resend.dev>",
      to: [userEmail],
      subject: `🎮 ${game_title} is ${discount}% off!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0b; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #a855f7; }
            .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 30px; margin-bottom: 20px; border: 1px solid #2a2a4a; }
            .game-title { font-size: 24px; font-weight: bold; color: #ffffff; margin-bottom: 10px; }
            .sale-badge { display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px; margin-bottom: 20px; }
            .price-container { display: flex; align-items: center; gap: 15px; margin-top: 20px; }
            .original-price { text-decoration: line-through; color: #888; font-size: 20px; }
            .sale-price { color: #22c55e; font-size: 28px; font-weight: bold; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎮 GameVault</div>
            </div>
            <div class="card">
              <div class="sale-badge">🔥 ${discount}% OFF</div>
              <div class="game-title">${game_title}</div>
              <p style="color: #aaa; margin: 10px 0;">A game on your wishlist is now on sale!</p>
              <div class="price-container">
                <span class="original-price">$${original_price.toFixed(2)}</span>
                <span class="sale-price">$${sale_price.toFixed(2)}</span>
              </div>
              <p style="color: #888; font-size: 14px; margin-top: 15px;">You save: $${(original_price - sale_price).toFixed(2)}</p>
            </div>
            <div style="text-align: center;">
              <p style="color: #aaa;">Don't miss out on this deal!</p>
            </div>
            <div class="footer">
              <p>You received this email because ${game_title} is on your wishlist.</p>
              <p>© ${new Date().getFullYear()} GameVault. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-sale-notification-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
