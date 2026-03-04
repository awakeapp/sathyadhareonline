'use client';

import { useState } from 'react';
import { subscribeAction } from '@/app/actions/newsletter';

export default function NewsletterForm() {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'exists' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(formData: FormData) {
    setState('loading');
    const result = await subscribeAction(formData);
    if (result.status === 'success') setState('success');
    else if (result.status === 'exists') setState('exists');
    else {
      setErrorMsg(result.message);
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-semibold text-lg">Thank you for subscribing.</p>
        <p className="text-indigo-200 text-sm">You&apos;ll hear from us soon.</p>
      </div>
    );
  }

  if (state === 'exists') {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <p className="text-yellow-300 font-semibold text-lg">Already subscribed.</p>
        <p className="text-indigo-200 text-sm">This email is already on our list.</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <input
        name="email"
        type="email"
        required
        placeholder="your@email.com"
        disabled={state === 'loading'}
        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-sm transition-all"
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-md disabled:opacity-60 whitespace-nowrap"
      >
        {state === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {state === 'error' && (
        <p className="w-full text-center text-red-300 text-sm mt-1">{errorMsg}</p>
      )}
    </form>
  );
}
