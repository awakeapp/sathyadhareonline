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
      <main className="max-w-2xl mx-auto px-6 py-20 text-center font-sans">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-8">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Thank you!</h1>
        <p className="text-lg text-gray-500">
          Submission received. Our editors will review it.
        </p>
        <Link
          href="/"
          className="mt-10 inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Submit an Article</h1>
        <p className="text-gray-500">Have something to share? Our editors will review your submission.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
        <form action={submitAction} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
            <input
              id="name" name="name" type="text" required
              placeholder="Full name"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              id="email" name="email" type="email" required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">Article Title</label>
            <input
              id="title" name="title" type="text" required
              placeholder="A compelling title..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">Article Content</label>
            <textarea
              id="content" name="content" required rows={12}
              placeholder="Write your article here..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 resize-y"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-100 text-base"
          >
            Submit Article
          </button>
        </form>
      </div>
    </main>
  );
}
