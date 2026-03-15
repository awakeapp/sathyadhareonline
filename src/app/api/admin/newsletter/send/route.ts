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
  
  if (!profile || !['admin', 'super_admin', 'editor'].includes(profile.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const resBody = await req.json();
  const { subject, body: content, recipients } = resBody as {
    subject: string; body: string; recipients: string[];
  };

  if (!subject || !content || !recipients?.length) {
    return NextResponse.json({ error: 'Missing subject, body, or recipients' }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const batchSize = 50; 
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const fromEmail = process.env.NEWSLETTER_FROM_EMAIL ?? 'onboarding@resend.dev';
        const fromName = 'Sathyadhare';
        
        const response = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch.map(to => ({
            from: `${fromName} <${fromEmail}>`,
            to,
            subject,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111; line-height: 1.6;">
                <h1 style="color: #685de6; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase;">
                  Sathyadhare
                </h1>
                <div style="margin-top: 32px; font-size: 16px;">
                  ${content.replace(/\n/g, '<br/>')}
                </div>
                <hr style="margin-top: 48px; border: none; border-top: 1px solid #eee;" />
                <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; text-align: center;">
                  Truth Always Triumphs
                </p>
              </div>
            `,
            text: content,
          }))),
        });

        if (!response.ok) {
          const err = await response.text();
          console.error('Resend error:', err);
          return NextResponse.json({ error: `Resend failed: ${err}` }, { status: 500 });
        }
      }
      return NextResponse.json({ ok: true, count: recipients.length });
    } catch (e) {
      console.error('Newsletter send error:', e);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // ── Fallback: log (dev mode, no email service configured) ────
  console.log(`[Newsletter] Would send to ${recipients.length} recipients:`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body preview: ${content.slice(0, 100)}…`);
  
  // In dev / no key configured, pretend success so the UI flow can be tested
  return NextResponse.json({ ok: true, count: recipients.length, note: 'No email service configured — logged only' });
}
