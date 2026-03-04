'use client';

import { useEffect } from 'react';

interface Props {
  articleId: string;
  trackView: (articleId: string, sessionId: string) => Promise<void>;
}

/** Fires once per article per browser session. */
export function ArticleViewTracker({ articleId, trackView }: Props) {
  useEffect(() => {
    // Generate or reuse a session-scoped ID
    const key = 'sathyadhare_session_id';
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(key, sessionId);
    }

    // Deduplicate: don't count the same article twice in one session
    const viewedKey = `viewed_${articleId}`;
    if (sessionStorage.getItem(viewedKey)) return;
    sessionStorage.setItem(viewedKey, '1');

    trackView(articleId, sessionId).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  return null;
}
