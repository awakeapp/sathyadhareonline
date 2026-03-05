import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/admin/newsletter/send
// Sends a newsletter via Supabase Edge Function (or logs it if not configured).
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { subject, body: content, recipients } = body as {
    subject: string; body: string; recipients: string[];
  };

  if (!subject || !content || !recipients?.length) {
    return NextResponse.json({ error: 'Missing subject, body, or recipients' }, { status: 400 });
  }

  // ── Option A: Supabase Edge Function ─────────────────────────
  // If you have a "send-newsletter" edge function deployed, uncomment:
  // const { data, error } = await supabase.functions.invoke('send-newsletter', {
  //   body: { subject, content, recipients },
  // });
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Option B: Resend REST API ─────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const batchSize = 50; // Resend batch limit
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const response = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch.map(to => ({
            from: process.env.NEWSLETTER_FROM_EMAIL ?? 'Sathyadhare <newsletter@sathyadhare.com>',
            to,
            subject,
            text: content,
          }))),
        });

        if (!response.ok) {
          const err = await response.text();
          console.error('Resend error:', err);
          return NextResponse.json({ error: `Resend batch ${i / batchSize + 1} failed: ${err}` }, { status: 500 });
        }
      }
      return NextResponse.json({ ok: true, count: recipients.length });
    } catch (e) {
      console.error('Newsletter send error:', e);
      return NextResponse.json({ error: 'Failed to send via Resend' }, { status: 500 });
    }
  }

  // ── Fallback: log (dev mode, no email service configured) ────
  console.log(`[Newsletter] Would send to ${recipients.length} recipients:`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body preview: ${content.slice(0, 100)}…`);
  
  // In dev / no key configured, pretend success so the UI flow can be tested
  return NextResponse.json({ ok: true, count: recipients.length, note: 'No email service configured — logged only' });
}
