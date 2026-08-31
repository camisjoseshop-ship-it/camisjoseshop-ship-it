import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const SHOP_DOMAIN = 'camisjose-es-69x8d-3kikcak1.myshopify.com';
const ADMIN_API_VERSION = '2025-07';

type Prize = {
  id: string;
  label: string;
  short: string;
  weight: number;
  winner: boolean;
  kind: 'fixed' | 'raffle' | 'none';
  value?: number;
  minSubtotal?: number;
};

// Server-side source of truth for probabilities (sum = 100)
const PRIZES: Prize[] = [
  { id: 'off10', label: '10 € de descuento (pedido mínimo 90 €)', short: '10 € DTO', weight: 1, winner: true, kind: 'fixed', value: 10, minSubtotal: 90 },
  { id: 'off7', label: '7 € de descuento (pedido mínimo 70 €)', short: '7 € DTO', weight: 4, winner: true, kind: 'fixed', value: 7, minSubtotal: 70 },
  { id: 'off5', label: '5 € de descuento (pedido mínimo 50 €)', short: '5 € DTO', weight: 10, winner: true, kind: 'fixed', value: 5, minSubtotal: 50 },
  { id: 'off3', label: '3 € de descuento (pedido mínimo 50 €)', short: '3 € DTO', weight: 20, winner: true, kind: 'fixed', value: 3, minSubtotal: 50 },
  { id: 'raffle', label: 'Participación en el sorteo mensual de una camiseta premium', short: 'SORTEO CAMISETA PREMIUM', weight: 25, winner: true, kind: 'raffle' },
  { id: 'retry', label: '¡Sigue probando suerte!', short: 'SIGUE PROBANDO SUERTE', weight: 40, winner: false, kind: 'none' },
];

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
});

function pickPrize(): Prize {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of PRIZES) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return PRIZES[PRIZES.length - 1];
}

function makeCode(prefix: string) {
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return `${prefix}-${rand}`;
}

async function shopifyAdmin(path: string, body: unknown) {
  const token = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
  if (!token) return null;
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/${ADMIN_API_VERSION}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Shopify ${path} failed [${res.status}]: ${text}`);
    return null;
  }
  try { return JSON.parse(text); } catch { return null; }
}

async function createShopifyDiscount(prize: Prize, code: string) {
  if (prize.kind !== 'fixed') return false;

  const endsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const base: Record<string, unknown> = {
    title: `Ruleta ${prize.id} ${code}`,
    customer_selection: 'all',
    starts_at: new Date().toISOString(),
    ends_at: endsAt,
    usage_limit: 1,
    once_per_customer: true,
    value_type: 'fixed_amount',
    value: `-${prize.value!.toFixed(2)}`,
    target_type: 'line_item',
    target_selection: 'all',
    allocation_method: 'across',
    prerequisite_subtotal_range: { greater_than_or_equal_to: (prize.minSubtotal ?? 0).toFixed(2) },
  };

  const rule = await shopifyAdmin('price_rules.json', { price_rule: base });
  const ruleId = rule?.price_rule?.id;
  if (!ruleId) return false;

  const created = await shopifyAdmin(`price_rules/${ruleId}/discount_codes.json`, { discount_code: { code } });
  return Boolean(created?.discount_code?.id);
}

async function sendEmail(email: string, prize: Prize, code: string | null) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (!resendKey || !lovableKey) return false;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0b0b0b;color:#fff;padding:32px;border-radius:16px">
      <h1 style="color:#E30613;letter-spacing:2px;margin:0 0 8px">CAMISJOSE</h1>
      <h2 style="margin:0 0 16px">¡Has ganado: ${prize.label}!</h2>
      ${prize.minSubtotal ? `<p style="color:#ccc">Pedido mínimo: ${prize.minSubtotal} €</p>` : ''}
      ${code ? `<p>Tu código exclusivo:</p><p style="font-size:26px;font-weight:bold;letter-spacing:3px;background:#fff;color:#E30613;padding:14px;border-radius:10px;text-align:center">${code}</p>` : ''}
      <p style="color:#ccc">Válido durante 30 días. Aplícalo en el checkout.</p>
      <p><a href="https://camisjose-es.lovable.app" style="display:inline-block;background:#E30613;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">COMPRAR AHORA</a></p>
    </div>`;

  const res = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': resendKey,
    },
    body: JSON.stringify({
      from: 'Camisjose <ruleta@camisjose.es>',
      to: [email],
      subject: `Tu premio: ${prize.label}`,
      html,
    }),
  });
  if (!res.ok) {
    console.error(`Resend failed [${res.status}]: ${await res.text()}`);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Email no válido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const email = parsed.data.email.toLowerCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: existing } = await supabase
      .from('wheel_spins')
      .select('prize_id, prize_label, code, is_winner')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ alreadyPlayed: true, ...existing }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const prize = pickPrize();
    let code: string | null = null;
    if (prize.winner) {
      code = makeCode('RULETA');
      await createShopifyDiscount(prize, code);
    }

    const { error } = await supabase.from('wheel_spins').insert({
      email,
      prize_id: prize.id,
      prize_label: prize.label,
      code,
      is_winner: prize.winner,
    });
    if (error) {
      console.error('Insert failed:', error.message);
      if (error.code === '23505') {
        return new Response(JSON.stringify({ error: 'Este email ya ha jugado' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let emailed = false;
    if (prize.winner) emailed = await sendEmail(email, prize, code);

    return new Response(
      JSON.stringify({ prize_id: prize.id, prize_label: prize.label, code, is_winner: prize.winner, emailed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('spin-wheel error:', e);
    return new Response(JSON.stringify({ error: 'Error inesperado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
