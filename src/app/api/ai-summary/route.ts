import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, content, title } = body;

    if (!articleId || !content) {
      return NextResponse.json({ error: 'Article content is missing' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not defined in environment variables');
      return NextResponse.json({ error: 'AI key not found' }, { status: 500 });
    }

    // Clean text: strip HTML, remove extra spaces, trim length
    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000); // 1.5 Flash can handle much more, but we keep it reasonable

    // Detect if text is predominantly Kannada
    const kannadaPattern = /[\u0C80-\u0CFF]/;
    const isKannada = kannadaPattern.test(plainText.slice(0, 500));

    const prompt = isKannada
      ? `ಸತ್ಯಧಾರೆ ಡಿಜಿಟಲ್ ಪತ್ರಿಕೆಗೆ ಈ ಲೇಖನಕ್ಕೆ ಸಾರಾಂಶವನ್ನು ತಯಾರಿಸಿ. ಈ ಕೆಳಗಿನ ಲೇಖನವನ್ನು ಓದಿ ಮತ್ತು ಅದರ ಮುಖ್ಯ ತಿರುಳನ್ನು ವಿವರಿಸುವ 2-3 ಆಕರ್ಷಕ ವಾಕ್ಯಗಳ ಕನ್ನಡ ಸಾರಾಂಶವನ್ನು ನೀಡಿ. ಯಾವುದೇ ಹೆಚ್ಚುವರಿ ಮಾತುಗಳಿಲ್ಲದೆ ನೇರವಾಗಿ ಸಾರಾಂಶವನ್ನು ಮಾತ್ರ ಬರೆಯಿರಿ.\n\nಶೀರ್ಷಿಕೆ: ${title}\n\nಲೇಖನ:\n${plainText}\n\nಸಾರಾಂಶ:`
      : `Write a high-quality, engaging 2-3 sentence summary for the following article. Focus on the core message and key takeaways. Return ONLY the summary text, no preamble.\n\nTitle: ${title}\n\nArticle:\n${plainText}\n\nSummary:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.2,
            topP: 0.9,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error Status:', response.status);
      console.error('Gemini API Error Details:', errText);
      return NextResponse.json({ error: `AI Error: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    
    // Check if we have candidates and text
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!summary) {
      console.error('Gemini Response Empty:', JSON.stringify(data));
      // Could be blocked by safety despite settings
      if (data.promptFeedback?.blockReason) {
         return NextResponse.json({ error: `Blocked: ${data.promptFeedback.blockReason}` }, { status: 403 });
      }
      return NextResponse.json({ error: 'AI failed to generate summary' }, { status: 500 });
    }

    // Optionally store the summary in the DB for future loads
    try {
      const supabase = await createClient();
      const { error: dbError } = await supabase
        .from('articles')
        .update({ ai_summary: summary })
        .eq('id', articleId);
      
      if (dbError) console.warn('Supabase Update Warning:', dbError.message);
    } catch (dbErr) {
      console.warn('DB Storage Trace:', dbErr);
    }

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('AI summary route error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
