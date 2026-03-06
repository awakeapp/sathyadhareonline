'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, X } from 'lucide-react';

interface Props {
  actions: string[];
}

export default function AuditLogFilters({ actions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [action, setAction] = useState(searchParams.get('action') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');

  function handleFilter() {
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set('q', query); else params.delete('q');
    if (action) params.set('action', action); else params.delete('action');
    if (date) params.set('date', date); else params.delete('date');
    params.set('page', '1'); // Reset to page 1

    startTransition(() => {
      router.push(`/admin/audit-logs?${params.toString()}`);
    });
  }

  function handleClear() {
    setQuery('');
    setAction('');
    setDate('');
    startTransition(() => {
      router.push('/admin/audit-logs');
    });
  }

  return (
    <div className="flex flex-wrap gap-3 mb-8 bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)]">
      <div className="flex-1 min-w-[200px]">
        <Input 
          placeholder="Search by user email or ID..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 text-xs"
        />
      </div>
      <div className="w-[180px]">
        <Select 
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-10 text-xs"
        >
          <option value="">All Actions</option>
          {actions.map(a => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </Select>
      </div>
      <div className="w-[150px]">
        <Input 
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-10 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={handleFilter} 
          disabled={isPending}
          size="sm"
          className="px-4 h-10 rounded-xl"
        >
          <Search className="w-4 h-4 mr-2" />
          Filter
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClear}
          disabled={isPending}
          size="sm"
          className="px-3 h-10 rounded-xl border-[var(--color-border)] text-[var(--color-muted)]"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
