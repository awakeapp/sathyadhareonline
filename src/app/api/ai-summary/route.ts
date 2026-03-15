import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, content, title } = body;

    // 1. Validate Input
    if (!articleId || !content) {
      return NextResponse.json({ error: 'Missing article data' }, { status: 400 });
    }

    // 2. Extract and sanitize API Key
    // We remove ALL whitespace characters (\s) to prevent URL breakage
    const rawKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawKey.replace(/\s/g, ''); 
    
    if (!apiKey) {
      return NextResponse.json({ error: 'AI key not configured in Vercel' }, { status: 500 });
    }

    // 3. Prepare Content (Simple cleaning)
    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000);

    const isKannada = /[\u0C80-\u0CFF]/.test(plainText.slice(0, 500));

    const prompt = isKannada
      ? `ಸಾರಾಂಶ: ${title}\n\n${plainText}`
      : `Summarize: ${title}\n\n${plainText}`;

    // 4. API Request with explicit Model and Version
    // gemini-1.5-flash is the most reliable model name
    const model = 'gemini-1.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 250, temperature: 0.2 },
      }),
    });

    // 5. Advanced Error Handling
    if (!response.ok) {
      const errText = await response.text();
      let parsedErr;
      try { parsedErr = JSON.parse(errText); } catch { parsedErr = { error: { message: errText } }; }
      
      const errMsg = parsedErr?.error?.message || 'Unknown API Error';
      const status = response.status;

      console.error(`AI Summary Failure [${status}]:`, errMsg);

      if (status === 404) {
        return NextResponse.json({ error: `AI Setup Error: Model not found. Check if API key is active.` }, { status: 404 });
      }
      if (status === 403 || status === 401) {
        return NextResponse.json({ error: `AI Access Refused: Invalid API Key.` }, { status: 403 });
      }
      
      return NextResponse.json({ error: `AI Error (${status}): ${errMsg.slice(0, 100)}` }, { status });
    }

    // 6. Success Response
    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!summary) {
      return NextResponse.json({ error: 'AI returned an empty summary' }, { status: 500 });
    }

    // 7. Async Save to DB (don't block user)
    const supabase = await createClient();
    supabase
      .from('articles')
      .update({ ai_summary: summary })
      .eq('id', articleId)
      .then(() => {});

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('AI summary route error:', error);
    return NextResponse.json({ error: 'System Error: ' + (error.message || 'unknown') }, { status: 500 });
  }
}
