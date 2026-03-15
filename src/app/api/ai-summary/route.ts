import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, content, title } = body;

    if (!articleId || !content) {
      return NextResponse.json({ error: 'Missing article data' }, { status: 400 });
    }

    // 1. Hyper-Sanitize API Key (Google Free Tier Key)
    const rawKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawKey.replace(/["']/g, '').replace(/\s/g, '').trim();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'AI key not found' }, { status: 500 });
    }

    // 2. Prepare text
    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000);

    const isKannada = /[\u0C80-\u0CFF]/.test(plainText.slice(0, 500));
    const prompt = isKannada
      ? `ಸಾರಾಂಶ ತಯಾರಿಸಿ: ${title}\n\n${plainText}`
      : `Summarize this: ${title}\n\n${plainText}`;

    // 3. FREE TIER MODELS ONLY (Gemini 1.5 & 2.0 Flash)
    // We try multiple models and versions to ensure reliability.
    const configs = [
      { ver: 'v1beta', model: 'gemini-2.0-flash-exp' }, // Newest & fastest
      { ver: 'v1beta', model: 'gemini-1.5-flash' },     // Standard
      { ver: 'v1',     model: 'gemini-1.5-flash' },     // Stable endpoint
      { ver: 'v1beta', model: 'gemini-1.5-flash-8b' },  // Efficient fallback
      { ver: 'v1beta', model: 'gemini-1.5-flash-latest' }
    ];

    let lastError = '';
    let successData: GeminiResponse | null = null;

    for (const config of configs) {
      try {
        const url = `https://generativelanguage.googleapis.com/${config.ver}/models/${config.model}:generateContent?key=${apiKey}`;
        
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
              maxOutputTokens: 300, 
              temperature: 0.2,
              topP: 0.95
            },
          }),
        });

        if (res.ok) {
          successData = await res.json() as GeminiResponse;
          break;
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || 'Not Found';
          lastError = `${config.model} (${res.status}: ${errMsg})`;
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'unknown';
        lastError = `Network: ${message}`;
      }
    }

    if (!successData) {
      // Clean up technical model names for the user
      const userFriendlyError = lastError
        .replace('gemini-1.5-flash-8b', 'Flash-8B')
        .replace('gemini-1.5-flash', 'Flash')
        .replace('gemini-2.0-flash-exp', 'Flash-2.0');

      return NextResponse.json({ 
        error: `AI Error: ${userFriendlyError}. Check API key in Google AI Studio.` 
      }, { status: 500 });
    }

    const summary = successData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!summary) {
      return NextResponse.json({ error: 'Empty summary returned' }, { status: 500 });
    }

    // 4. Save to DB
    try {
      const supabase = await createClient();
      await supabase.from('articles').update({ ai_summary: summary }).eq('id', articleId);
    } catch {}

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: 'System Error: ' + message }, { status: 500 });
  }
}
