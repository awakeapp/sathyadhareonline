'use client';

import { useState } from 'react';
import { subscribeAction } from '@/app/actions/newsletter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
      <div className="flex flex-col items-center gap-3 py-4 w-full text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-tight">Thank you for subscribing.</p>
          <p className="text-[var(--color-muted)] text-sm font-medium mt-1">You&apos;ll hear from us soon.</p>
        </div>
      </div>
    );
  }

  if (state === 'exists') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 w-full text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <p className="text-amber-500 font-bold text-lg leading-tight">Already subscribed.</p>
          <p className="text-[var(--color-muted)] text-sm font-medium mt-1">This email is already on our list.</p>
        </div>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <Input
        name="email"
        type="email"
        required
        placeholder="your@email.com"
        disabled={state === 'loading'}
        className="flex-1 px-4 py-3 h-12 rounded-2xl bg-black/40 border-[var(--color-border)] text-white placeholder-[var(--color-muted)] focus:ring-[var(--color-primary)] transition-all"
      />
      <Button
        type="submit"
        disabled={state === 'loading'}
        loading={state === 'loading'}
        variant="primary"
        className="h-12 px-6 rounded-2xl text-black shadow-none whitespace-nowrap"
      >
        {state === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </Button>
      {state === 'error' && (
        <p className="w-full text-center text-red-400 font-semibold text-sm mt-1">{errorMsg}</p>
      )}
    </form>
  );
}
