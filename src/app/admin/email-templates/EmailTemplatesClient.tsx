'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { updateTemplateAction } from './actions';
import { Mail, Edit, Calendar, Code, Check, Box, Layout, ArrowLeft, Terminal } from 'lucide-react';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

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
        toast.success('Protocol Reconfigured');
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <PresenceCard key={t.id} noPadding className="group cursor-pointer overflow-hidden" onClick={() => openEdit(t)}>
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-[#5c4ae4] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Edit className="w-4 h-4" />
                  </div>
                </div>
                
                <h3 className="font-black text-xl text-[#1b1929] dark:text-white uppercase tracking-tight mb-2 truncate">
                   {t.name.replace(/_/g, ' ')}
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed line-clamp-2 h-10">
                   {t.subject}
                </p>
                
                <div className="flex items-center gap-2 mt-6 pt-6 border-t border-indigo-50 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-indigo-300">
                   <Calendar className="w-3.5 h-3.5" />
                   Last Sync · {new Date(t.updated_at).toLocaleDateString()}
                </div>
              </div>
            </PresenceCard>
          ))}
          {templates.length === 0 && (
             <PresenceCard className="md:col-span-2 lg:col-span-3 py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
                <Mail className="w-16 h-16 mb-5 text-indigo-100" />
                <p className="font-black text-xl text-gray-400 uppercase tracking-widest">Protocol Bank Empty</p>
             </PresenceCard>
          )}
        </div>
      ) : (
        <PresenceCard className="p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-10 border-b border-indigo-50 dark:border-white/5 flex items-center justify-between bg-indigo-50/10">
             <div className="flex items-center gap-5">
                <button onClick={closeEdit} className="w-12 h-12 rounded-full bg-white dark:bg-[#1b1929] text-gray-400 flex items-center justify-center shadow-sm">
                   <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                   <h2 className="text-2xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">{editingTemplate.name.replace(/_/g, ' ')} Node</h2>
                   <p className="text-[10px] font-black text-[#5c4ae4] uppercase tracking-widest mt-1">Direct Communication Reconfiguration</p>
                </div>
             </div>
             <PresenceButton onClick={handleSave} loading={isPending} className="bg-[#5c4ae4] shadow-xl shadow-indigo-500/20 px-10">
               <Check className="w-5 h-5 mr-3" /> Synchronize Matrix
             </PresenceButton>
          </div>

          <div className="p-10 space-y-10">
             <div className="space-y-3">
               <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Identity Dispatch Subject</label>
               <input 
                 value={subject} 
                 onChange={(e) => setSubject(e.target.value)} 
                 className="w-full h-16 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-md font-bold shadow-inner" 
               />
             </div>

             <div className="grid gap-10 lg:grid-cols-2">
               <div className="space-y-4">
                 <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4] flex items-center gap-3">
                   <Terminal className="w-4 h-4" /> Protocol Buffer (HTML)
                 </label>
                 <textarea
                   value={body}
                   onChange={(e) => setBody(e.target.value)}
                   className="w-full h-[500px] p-8 rounded-[2rem] bg-gray-50 dark:bg-[#1b1929] border-none text-sm font-mono font-bold shadow-inner text-indigo-400 leading-relaxed resize-none focus:ring-0"
                   spellCheck={false}
                 />
               </div>
               
               <div className="space-y-4">
                 <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4] flex items-center gap-3">
                   <Layout className="w-4 h-4" /> Visual Intercept (Preview)
                 </label>
                 <div className="w-full h-[500px] rounded-[2rem] bg-gray-100 dark:bg-white p-10 overflow-hidden shadow-2xl relative">
                   <iframe 
                     srcDoc={body} 
                     className="w-full h-full border-0 select-none pointer-events-none" 
                     title="Email Preview"
                   />
                 </div>
               </div>
             </div>

             <div className="p-8 rounded-[2rem] bg-[#f0f2ff] dark:bg-indigo-500/5 border-none">
               <h4 className="text-[10px] font-black uppercase text-[#5c4ae4] tracking-[0.3em] mb-4">Injection Pointers</h4>
               <div className="flex flex-wrap gap-3">
                 {["{{name}}", "{{email}}", "{{reset_link}}", "{{invite_link}}", "{{role}}"].map(v => (
                   <span key={v} className="px-4 py-2 rounded-xl bg-white dark:bg-[#1b1929] text-[10px] font-black text-indigo-400 shadow-sm border border-indigo-50">
                     {v}
                   </span>
                 ))}
               </div>
             </div>
          </div>
        </PresenceCard>
      )}
    </div>
  );
}
