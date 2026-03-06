'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Key, Plus, Trash2, KeyRound, Copy } from 'lucide-react';
import { createApiKeyAction, revokeApiKeyAction } from './actions';
import { toast } from 'sonner';

export default function ApiKeysClient({ keys }: { keys: { id: string; name: string; key_hash: string; created_at: string }[] }) {
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreate = async (formData: FormData) => {
    const res = await createApiKeyAction(formData);
    if (res.error) {
      toast.error(res.error);
    } else if (res.success && res.key) {
      setCreatedKey(res.key);
      toast.success('API Key generated successfully. Please copy it now.');
    }
  };

  const copyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      toast.success('API Secret Key copied directly to your clipboard.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── Heading ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">API Access Tokens</h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">Manage static server-side tokens simulating secure integrations</p>
        </div>
      </div>

      {/* ── Reveal Banner (Only runs once) ────────────────────── */}
      {createdKey && (
        <Card className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 mt-4">
          <CardContent className="p-5">
             <div className="flex items-center gap-3 mb-2 text-amber-500">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold tracking-tight">Save this secure key somewhere safe</h3>
             </div>
             <p className="text-xs text-[var(--color-muted)] mb-4 leading-relaxed">
                For security reasons, you will <strong>never</strong> be able to see this secret token again. If you lose it, you must revoke the credential and mint a freshly randomized string natively.
             </p>
             <div className="flex bg-black/50 border border-white/10 rounded-xl overflow-hidden p-1 gap-2 items-center pl-3">
                <code className="text-emerald-400 flex-1 font-mono text-xs select-all">{createdKey}</code>
                <Button size="sm" variant="secondary" onClick={copyToClipboard} className="h-8">
                   <Copy className="w-3.5 h-3.5 mr-1" />
                   Copy
                </Button>
             </div>
          </CardContent>
        </Card>
      )}

      {/* ── Create New UI ─────────────────────────────────────── */}
      <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
        <CardContent className="p-6">
          <form action={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                Mint New Key Context Name
              </label>
              <Input id="name" name="name" placeholder="e.g. Vercel CMS Extractor Plugin" required className="bg-black/20" />
            </div>
            <Button type="submit" variant="primary" className="text-black bg-white hover:bg-gray-200">
               <Plus className="w-4 h-4 mr-2" />
               Generate Key
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── List Keys ─────────────────────────────────────────── */}
      <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
        <CardContent className="p-0">
          {!keys || keys.length === 0 ? (
            <div className="text-center py-20">
              <Key className="w-12 h-12 text-[var(--color-muted)] opacity-20 mx-auto mb-4" />
              <p className="font-bold text-lg">No static tokens minted</p>
              <p className="text-sm text-[var(--color-muted)]">Use the prompt above to generate secure credentials securely.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]/50">
              {keys.map((k) => (
                <div key={k.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{k.name}</h4>
                      <p className="text-[10px] text-[var(--color-muted)] font-mono mt-1 w-64 truncate">
                         {/* Display a masked version of the hash */}
                         {k.key_hash.substring(0, 12)}•••••••••••••••••••••
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                       <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] tracking-widest">Created On</p>
                       <p className="text-xs text-white/50">{new Date(k.created_at).toLocaleDateString()}</p>
                    </div>
                    <form action={revokeApiKeyAction}>
                      <input type="hidden" name="id" value={k.id} />
                      <Button type="submit" variant="outline" size="sm" className="text-rose-500 border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500">
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Revoke Token
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
