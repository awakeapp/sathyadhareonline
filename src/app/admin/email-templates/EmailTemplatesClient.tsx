'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { updateTemplateAction } from './actions';
import { Mail, Edit, Calendar, Code, Check } from 'lucide-react';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  updated_at: string;
}

export default function EmailTemplatesClient({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {
  const [isPending, startTransition] = useTransition();
  const [templates, setTemplates] = useState(initialTemplates);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Form states
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const openEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setSubject(template.subject);
    setBody(template.body);
  };

  const closeEdit = () => {
    setEditingTemplate(null);
    setSubject('');
    setBody('');
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    
    startTransition(async () => {
      const res = await updateTemplateAction(editingTemplate.id, subject, body);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Template "${editingTemplate.name}" updated successfully`);
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id ? { ...t, subject, body, updated_at: new Date().toISOString() } : t
        ));
        closeEdit();
      }
    });
  };

  return (
    <div className="space-y-6">
      {!editingTemplate ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <Card key={t.id} className="rounded-3xl border border-[var(--color-border)] shadow-none bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50 transition-colors group cursor-pointer" onClick={() => openEdit(t)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 border-white/10 shrink-0">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </div>
                
                <h3 className="font-bold text-lg mb-1">{t.name.replace(/_/g, ' ')}</h3>
                <p className="text-xs text-[var(--color-muted)] line-clamp-2 min-h-[32px] mb-4">Subject: {t.subject}</p>
                
                <div className="flex items-center gap-1.5 pt-4 border-t border-[var(--color-border)] text-[9px] uppercase tracking-widest text-[var(--color-muted)] font-bold">
                   <Calendar className="w-3 h-3" />
                   {new Date(t.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && (
             <div className="md:col-span-2 lg:col-span-3 py-16 text-center border-dashed border border-[var(--color-border)] rounded-3xl text-[var(--color-muted)] font-bold text-sm">
               No templates active in database.
             </div>
          )}
        </div>
      ) : (
        <Card className="rounded-3xl border border-[var(--color-border)] shadow-none bg-[var(--color-surface)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6 md:p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-2">
               <div>
                 <h2 className="text-xl font-black text-white capitalize">{editingTemplate.name.replace(/_/g, ' ')} Template</h2>
                 <p className="text-sm text-[var(--color-muted)] mt-1 tracking-wide">Customize system email dispatches.</p>
               </div>
               <div className="flex gap-3">
                  <Button variant="outline" onClick={closeEdit} className="rounded-xl h-10 bg-transparent border-white/10 text-[var(--color-muted)] hover:text-white">Cancel</Button>
                  <Button onClick={handleSave} loading={isPending} className="rounded-xl h-10 font-bold bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90 px-6">
                    <Check className="w-4 h-4 mr-1.5" /> Save Output
                  </Button>
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-1.5 flex-1">
                 <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Subject Line</label>
                 <Input 
                   value={subject} 
                   onChange={(e) => setSubject(e.target.value)} 
                   className="bg-black/20 text-base h-12" 
                   placeholder="Verify your email..."
                 />
                 <p className="text-[10px] text-[var(--color-muted)]">Users see this straight inside their inbox directly.</p>
               </div>

               <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-1.5">
                     <Code className="w-3.5 h-3.5" /> HTML Body
                   </label>
                   <textarea
                     value={body}
                     onChange={(e) => setBody(e.target.value)}
                     className="w-full h-80 px-4 py-4 rounded-xl border border-[var(--color-border)] bg-black/40 focus:ring-2 focus:ring-[var(--color-primary)] text-white text-sm font-mono leading-relaxed resize-y hide-scrollbar"
                     placeholder="<h1>Hello {{name}}</h1>"
                     spellCheck={false}
                   />
                 </div>
                 
                 <div className="space-y-1.5 flex flex-col">
                   <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-1.5">
                     <Mail className="w-3.5 h-3.5" /> Render Preview
                   </label>
                   <div className="flex-1 w-full h-[320px] rounded-xl border border-[var(--color-border)] bg-white p-6 overflow-y-auto">
                     {/* Safe generic iframe wrapper to prevent client rendering conflicts while live editing un-sanitized html natively */}
                     <iframe 
                       srcDoc={body} 
                       className="w-full h-full border-0" 
                       title="Email Preview"
                     />
                   </div>
                 </div>
               </div>

               <div className="px-5 py-4 bg-black/30 rounded-2xl border border-[var(--color-border)]">
                 <h4 className="text-xs font-black uppercase text-white tracking-widest mb-3">Available Injection Variables</h4>
                 <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold text-[var(--color-muted)]">
                   <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">{"{{name}}"}</span>
                   <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">{"{{email}}"}</span>
                   <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">{"{{reset_link}}"}</span>
                   <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">{"{{invite_link}}"}</span>
                   <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">{"{{role}}"}</span>
                 </div>
               </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
