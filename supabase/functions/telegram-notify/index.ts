// Telegram notification for premium events
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyBody {
  event: 'payment_submitted' | 'premium_granted' | 'promo_redeemed' | 'payment_rejected';
  email?: string;
  user_id?: string;
  plan?: string;
  amount_inr?: number;
  utr?: string;
  note?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');
    if (!token || !chatId) {
      return new Response(JSON.stringify({ error: 'Telegram not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as NotifyBody;
    const emoji: Record<string, string> = {
      payment_submitted: '💸',
      premium_granted: '👑',
      promo_redeemed: '🎟️',
      payment_rejected: '❌',
    };
    const title: Record<string, string> = {
      payment_submitted: 'New Payment Submitted',
      premium_granted: 'Premium Activated',
      promo_redeemed: 'Promo Code Redeemed',
      payment_rejected: 'Payment Rejected',
    };

    const lines = [
      `${emoji[body.event] ?? 'ℹ️'} <b>${title[body.event] ?? body.event}</b>`,
      body.email ? `👤 ${body.email}` : null,
      body.plan ? `📦 Plan: <b>${body.plan}</b>` : null,
      typeof body.amount_inr === 'number' ? `💰 ₹${body.amount_inr}` : null,
      body.utr ? `🧾 UTR: <code>${body.utr}</code>` : null,
      body.note ? `📝 ${body.note}` : null,
      body.user_id ? `🆔 <code>${body.user_id}</code>` : null,
      `🕐 ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    ].filter(Boolean);

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const tgData = await tgRes.json();
    if (!tgRes.ok) {
      console.error('Telegram error', tgData);
      return new Response(JSON.stringify({ error: tgData }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
