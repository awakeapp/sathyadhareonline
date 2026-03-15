import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { articleId, content, title } = await request.json();

    if (!articleId || !content) {
      return NextResponse.json({ error: 'articleId and content required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Strip HTML tags for plain text
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 8000);

    // Detect if text is Kannada (Unicode range ಀ-೿)
    const kannadaPattern = /[\u0C80-\u0CFF]/;
    const isKannada = kannadaPattern.test(plainText);

    const prompt = isKannada
      ? `ಈ ಕೆಳಗಿನ ಲೇಖನವನ್ನು ಓದಿ ಮತ್ತು ಮುಖ್ಯ ಅಂಶಗಳನ್ನು ಒಳಗೊಂಡ 2-3 ವಾಕ್ಯಗಳ ಕನ್ನಡ ಸಾರಾಂಶವನ್ನು ಬರೆಯಿರಿ. ಸಾರಾಂಶವು ಆಕರ್ಷಕವಾಗಿ ಮತ್ತು ಓದುಗರಿಗೆ ಸುಲಭವಾಗಿ ಅರ್ಥವಾಗುವಂತಿರಲಿ.\n\nಶೀರ್ಷಿಕೆ: ${title}\n\nಲೇಖನ:\n${plainText}\n\nಸಾರಾಂಶ:`
      : `Read the following article and write a premium, engaging 2-3 sentence summary in English. Capture the essence and key takeaways.\n\nTitle: ${title}\n\nArticle:\n${plainText}\n\nSummary:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 256,
            temperature: 0.3,
            topP: 0.8,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!summary) {
      return NextResponse.json({ error: 'No summary generated' }, { status: 500 });
    }

    // Optionally store the summary in the DB
    try {
      const supabase = await createClient();
      await supabase
        .from('articles')
        .update({ ai_summary: summary })
        .eq('id', articleId);
    } catch (dbErr) {
      console.warn('Could not store AI summary in DB:', dbErr);
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
