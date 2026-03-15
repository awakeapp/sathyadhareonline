'use client';

import AISummaryBox from './AISummaryBox';
import TextToSpeech from './TextToSpeech';
import { Headphones } from 'lucide-react';

interface ArticleReadingToolsProps {
  articleId: string;
  content: string;
  title: string;
  existingSummary?: string | null;
}

export default function ArticleReadingTools({ articleId, content, title, existingSummary }: ArticleReadingToolsProps) {
  return (
    <div className="mb-10">
      {/* Always single row — AI Summary left, Audio right */}
      <div className="flex flex-row gap-3 items-stretch">

        {/* AI Summary — grows to fill space */}
        <div className="flex-[3] min-w-0">
          <AISummaryBox
            articleId={articleId}
            content={content}
            title={title}
            existingSummary={existingSummary}
          />
        </div>

        {/* Audio — fixed compact width */}
        <div className="flex-[2] min-w-[160px] max-w-[260px]">
          <div className="h-full flex flex-col justify-center p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                <Headphones size={13} className="text-[var(--color-primary)]" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--color-muted)] leading-none">Listen</span>
            </div>
            <TextToSpeech text={content} title={title} />
          </div>
        </div>

      </div>
    </div>
  );
}
