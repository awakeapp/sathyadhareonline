'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  articleId: string;
  userId?: string | null;
}

export function ReadingProgressTracker({ articleId, userId }: Props) {
  const lastSavedProgress = useRef(0);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      

      // Save to database if progress increased significantly (e.g. by 5%)
      // or if we reached the end (95%+)
      if (currentPercent > lastSavedProgress.current + 5 || (currentPercent >= 95 && lastSavedProgress.current < 95)) {
        lastSavedProgress.current = currentPercent;
        saveProgress(currentPercent);
      }
    };

    const saveProgress = async (percent: number) => {
      try {
        await supabase
          .from('article_progress')
          .upsert({
            user_id: userId,
            article_id: articleId,
            percentage: percent,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,article_id' });
      } catch (e) {
        console.error('Failed to save reading progress:', e);
      }
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, [articleId, userId, supabase]);

  return null;
}
