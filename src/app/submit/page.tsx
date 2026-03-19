import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit an Article | Sathyadhare',
  description: 'Share your writing with the Sathyadhare community.',
};

interface Props {
  searchParams: Promise<{ submitted?: string }>;
}

export default async function SubmitPage({ searchParams }: Props) {
  const { submitted } = await searchParams;

  async function submitAction(formData: FormData) {
    'use server';
    const supabase = await createClient();

    const name    = formData.get('name')    as string;
    const email   = formData.get('email')   as string;
    const title   = formData.get('title')   as string;
    const content = formData.get('content') as string;

    const { error } = await supabase
      .from('guest_submissions')
      .insert({ name, email, title, content, status: 'pending' });

    if (error) {
      console.error('Submission error:', error);
      return;
    }

    redirect('/submit?submitted=true');
  }

  if (submitted === 'true') {
    return (
      <main className="max-w-2xl mx-auto px-6 py-20 text-center min-h-[100svh]">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-green-500/10 mb-8 border border-green-500/20">
          <svg className="w-10 h-10 text-green-500 min-w-[44px] min-h-[44px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--color-text)] mb-4 tracking-tight">Thank you!</h1>
        <p className="text-lg text-[var(--color-muted)]">
          Submission received. Our editors will review it shortly.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex px-8 py-4 bg-[#685de6] text-white font-black text-sm uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-lg shadow-[#685de6]/25"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 min-h-[100svh] pb-0">
      <div className="mb-8 px-2">
        <h1 className="text-3xl font-extrabold text-[var(--color-text)] mb-2 tracking-tight">Submit an Article</h1>
        <p className="text-[var(--color-muted)] text-base">Have something to share? Our editors will review your submission.</p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] shadow-sm p-6 sm:p-8">
        <form action={submitAction} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-2 px-1">Your Name</label>
            <input
              id="name" name="name" type="text" required
              placeholder="Full name"
              className="w-full px-5 py-4 rounded-2xl border border-[var(--color-border)] focus:ring-2 focus:ring-[#685de6]/50 focus:border-[#685de6] outline-none transition-all text-[var(--color-text)] bg-[var(--color-surface-2)] placeholder:text-[var(--color-muted-foreground)] font-medium"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-2 px-1">Email Address</label>
            <input
              id="email" name="email" type="email" required
              placeholder="you@example.com"
              className="w-full px-5 py-4 rounded-2xl border border-[var(--color-border)] focus:ring-2 focus:ring-[#685de6]/50 focus:border-[#685de6] outline-none transition-all text-[var(--color-text)] bg-[var(--color-surface-2)] placeholder:text-[var(--color-muted-foreground)] font-medium"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-2 px-1">Article Title</label>
            <input
              id="title" name="title" type="text" required
              placeholder="A compelling title..."
              className="w-full px-5 py-4 rounded-2xl border border-[var(--color-border)] focus:ring-2 focus:ring-[#685de6]/50 focus:border-[#685de6] outline-none transition-all text-[var(--color-text)] bg-[var(--color-surface-2)] placeholder:text-[var(--color-muted-foreground)] font-bold"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-2 px-1">Article Content</label>
            <textarea
              id="content" name="content" required rows={10}
              placeholder="Write your article here..."
              className="w-full px-5 py-5 rounded-3xl border border-[var(--color-border)] focus:ring-2 focus:ring-[#685de6]/50 focus:border-[#685de6] outline-none transition-all text-[var(--color-text)] bg-[var(--color-surface-2)] placeholder:text-[var(--color-muted-foreground)] font-medium resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-[#685de6] text-white font-black uppercase tracking-widest text-sm rounded-2xl active:scale-95 transition-all shadow-lg shadow-[#685de6]/25"
            >
              Submit Article
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
