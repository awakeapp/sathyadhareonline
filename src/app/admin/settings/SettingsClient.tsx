'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { toast } from 'sonner';
import { 
  Settings, Globe, Share2, Search, Link2, Hash, 
  Mail, Edit2, AlertTriangle, Save
} from 'lucide-react';
import { saveSiteSettingsAction, saveEmailTemplateAction } from './actions';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';

export interface SiteSettings {
  [key: string]: unknown;
  id: number;
  general: Record<string, string>;
  social_links: Record<string, string>;
  seo: Record<string, string>;
  integrations: Record<string, string | boolean>;
  features: Record<string, boolean>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface SettingsClientProps {
  initialSettings: SiteSettings;
  initialTemplates: EmailTemplate[];
  userId: string;
}

export default function SettingsClient({ initialSettings, initialTemplates, userId }: SettingsClientProps) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [activeTab, setActiveTab] = useState('general');
  const [isPending, startTransition] = useTransition();
  const [unsaved, setUnsaved] = useState(false);
  
  // Email Template Edit State
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'social', label: 'Social Links', icon: Share2 },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'features', label: 'Features', icon: Hash },
    { id: 'emails', label: 'Email Templates', icon: Mail },
  ];

  // Handler for nested JSONB settings
  const handleChange = (category: keyof SiteSettings, field: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] as Record<string, unknown>),
        [field]: value
      }
    }));
    setUnsaved(true);
  };

  const handleSaveSettings = async () => {
    startTransition(async () => {
      const res = await saveSiteSettingsAction(settings);
      if (res?.error) {
        toast.error(`Error: ${res.error}`);
      } else {
        toast.success("Settings saved successfully.");
        setUnsaved(false);
      }
    });
  };

  const handleEditTemplate = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setTemplateSubject(t.subject);
    setTemplateBody(t.body);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    startTransition(async () => {
      const res = await saveEmailTemplateAction(
        editingTemplate.id,
        editingTemplate.name,
        templateSubject,
        templateBody
      );
      if (res?.error) {
        toast.error(`Error: ${res.error}`);
      } else {
        toast.success("Template updated successfully.");
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id ? { ...t, subject: templateSubject, body: templateBody } : t
        ));
        setEditingTemplate(null);
      }
    });
  };

  // Warn before leaving if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsaved]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 font-sans antialiased text-white">
      
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#00a6ff]/10 border border-[#00a6ff]/20 flex items-center justify-center">
          <Settings className="w-6 h-6 text-[#00a6ff]" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight leading-tight">Platform Settings</h1>
          <p className="text-sm text-[var(--color-muted)] font-medium mt-1">
            Configure Sathyadhare&apos;s core behavior and integrations
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* ── Sidebar Tabs ─────────────────────────────────── */}
        <aside className="w-full md:w-64 shrink-0">
          <Card className="rounded-[2rem] border-transparent bg-[var(--color-surface)] shadow-none p-2">
            <div className="flex flex-col gap-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-3xl transition-all text-sm font-semibold tracking-wide
                    ${activeTab === t.id 
                      ? 'bg-[#ffe500] text-black shadow-lg shadow-black/10' 
                      : 'text-[var(--color-text)] hover:bg-black/20 hover:text-white'
                    }`}
                >
                  <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-black' : 'text-[var(--color-muted)]'}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </Card>
        </aside>

        {/* ── Main Content Area ────────────────────────────── */}
        <div className="flex-1 min-w-0">
          
          {/* 1. General Settings */}
          <div className={activeTab === 'general' ? 'block' : 'hidden'}>
            <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">General Information</h2>
                  <div className="grid gap-5">
                    <div>
                      <Label>Site Name</Label>
                      <Input 
                        value={settings.general?.site_name || ''} 
                        onChange={e => handleChange('general', 'site_name', e.target.value)} 
                        placeholder="e.g. Sathyadhare Online"
                      />
                    </div>
                    <div>
                      <Label>Tagline</Label>
                      <Input 
                        value={settings.general?.tagline || ''} 
                        onChange={e => handleChange('general', 'tagline', e.target.value)} 
                        placeholder="A short description"
                      />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input 
                        type="email"
                        value={settings.general?.contact_email || ''} 
                        onChange={e => handleChange('general', 'contact_email', e.target.value)} 
                        placeholder="admin@example.com"
                      />
                    </div>
                    
                    {/* Could be an image uploader, but simple input for URL right now */}
                    <div>
                      <Label>Logo URL</Label>
                      <div className="flex gap-2">
                         <Input 
                           value={settings.general?.logo_url || ''} 
                           onChange={e => handleChange('general', 'logo_url', e.target.value)} 
                           placeholder="https://..."
                         />
                      </div>
                      <p className="text-xs text-[var(--color-muted)] mt-1.5 font-medium">Upload via Media Library and paste the URL here.</p>
                    </div>
                    <div>
                      <Label>Favicon URL</Label>
                      <Input 
                        value={settings.general?.favicon_url || ''} 
                        onChange={e => handleChange('general', 'favicon_url', e.target.value)} 
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. Social Links */}
          <div className={activeTab === 'social' ? 'block' : 'hidden'}>
            <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Social Profiles</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label>Twitter (X)</Label>
                      <Input 
                        value={settings.social_links?.twitter || ''} 
                        onChange={e => handleChange('social_links', 'twitter', e.target.value)} 
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <Label>Facebook</Label>
                      <Input 
                        value={settings.social_links?.facebook || ''} 
                        onChange={e => handleChange('social_links', 'facebook', e.target.value)} 
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <Label>Instagram</Label>
                      <Input 
                        value={settings.social_links?.instagram || ''} 
                        onChange={e => handleChange('social_links', 'instagram', e.target.value)} 
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div>
                      <Label>YouTube</Label>
                      <Input 
                        value={settings.social_links?.youtube || ''} 
                        onChange={e => handleChange('social_links', 'youtube', e.target.value)} 
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. SEO */}
          <div className={activeTab === 'seo' ? 'block' : 'hidden'}>
            <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Search Engine Optimization</h2>
                  <div className="grid gap-5">
                    <div>
                      <Label>Default Meta Title</Label>
                      <Input 
                        value={settings.seo?.meta_title || ''} 
                        onChange={e => handleChange('seo', 'meta_title', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label>Default Meta Description</Label>
                      <Textarea 
                        value={settings.seo?.meta_description || ''} 
                        onChange={e => handleChange('seo', 'meta_description', e.target.value)} 
                        rows={3} 
                      />
                    </div>
                    <div>
                      <Label>Default OpenGraph Image URL</Label>
                      <Input 
                        value={settings.seo?.og_image || ''} 
                        onChange={e => handleChange('seo', 'og_image', e.target.value)} 
                        placeholder="https://..."
                      />
                      <p className="text-xs text-[var(--color-muted)] mt-1.5 font-medium">Used when sharing pages that don&apos;t have their own cover image.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 4. Integrations */}
          <div className={activeTab === 'integrations' ? 'block' : 'hidden'}>
            <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">External Integrations</h2>
                  <div className="grid gap-6">
                    <div className="p-5 rounded-2xl bg-black/20 border border-[var(--color-border)]">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="uppercase tracking-widest text-[#ea4335]">Google OAuth</Label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!settings.integrations?.google_oauth_enabled} 
                            onChange={e => handleChange('integrations', 'google_oauth_enabled', e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-[#ea4335] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Client ID <span className="text-xs opacity-50 uppercase">(Public)</span></Label>
                          <Input 
                            value={(settings.integrations?.google_client_id as string) || ''} 
                            onChange={e => handleChange('integrations', 'google_client_id', e.target.value)} 
                            className="font-mono text-sm"
                          />
                        </div>
                        {/* Note: Sensitive credentials should ideally be in env variables entirely natively. */}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-black/20 border border-[var(--color-border)]">
                      <Label className="uppercase tracking-widest text-[#fbbc05] mb-4 block">Google Analytics</Label>
                      <div>
                        <Label>Measurement ID</Label>
                        <Input 
                          value={(settings.integrations?.analytics_id as string) || ''} 
                          onChange={e => handleChange('integrations', 'analytics_id', e.target.value)} 
                          placeholder="G-XXXXXXXXXX"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 5. Features */}
          <div className={activeTab === 'features' ? 'block' : 'hidden'}>
            <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-6">Feature Toggles</h2>
                  <div className="grid gap-3">
                    
                    {[
                      { key: 'comments_enabled', label: 'Global Comments', desc: 'Allow readers to comment on published articles.' },
                      { key: 'guest_submissions_enabled', label: 'Guest Submissions', desc: 'Allow visitors to submit articles for review.' },
                      { key: 'newsletter_enabled', label: 'Newsletter Subscriptions', desc: 'Enable the newsletter signup forms.' },
                      { key: 'registration_enabled', label: 'User Registration', desc: 'Allow new users to sign up via email/password.' },
                    ].map(feat => (
                      <div key={feat.key} className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${settings.features?.[feat.key] ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/20 border-[var(--color-border)] hover:border-white/20'}`} onClick={() => handleChange('features', feat.key, !settings.features?.[feat.key])}>
                        <div className="pr-4">
                          <p className="font-bold text-white text-[15px]">{feat.label}</p>
                          <p className="text-sm text-[var(--color-muted)] mt-1">{feat.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={settings.features?.[feat.key] || false} 
                            onChange={e => handleChange('features', feat.key, e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                      </div>
                    ))}

                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 6. Email Templates */}
          <div className={activeTab === 'emails' ? 'block' : 'hidden'}>
            <div className="space-y-4">
              {templates.length === 0 ? (
                <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
                  <Mail className="w-10 h-10 mb-4 opacity-20" />
                  <p className="font-bold">No templates found</p>
                  <p className="text-sm text-[var(--color-muted)]">Run initial migrations to seed templates.</p>
                </Card>
              ) : (
                templates.map((t) => (
                  <Card key={t.id} hoverable className="rounded-3xl border-transparent bg-[var(--color-surface)] shadow-none cursor-pointer" onClick={() => handleEditTemplate(t)}>
                    <CardContent className="p-6 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                           <h3 className="font-bold text-lg">{t.name}</h3>
                           <span className="bg-white/10 text-white/50 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase">id: {t.id.split('-')[0]}</span>
                        </div>
                        <p className="text-sm text-[var(--color-muted)]"><span className="opacity-50">Subject:</span> {t.subject}</p>
                      </div>
                      <Button variant="outline" size="icon" className="rounded-full flex-shrink-0">
                         <Edit2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Unsaved Changes Bar ────────────────────────────── */}
      {unsaved && activeTab !== 'emails' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-auto max-w-xl bg-[var(--color-surface)] border border-[#ffe500]/50 rounded-full shadow-2xl flex items-center justify-between p-2 pl-6 z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ffe500]/10 to-transparent pointer-events-none" />
          <p className="font-bold text-[15px] relative z-10 flex items-center">
            <AlertTriangle className="w-4 h-4 text-[#ffe500] mr-2" />
            <span className="text-white hidden sm:inline">Unsaved changes detected</span>
            <span className="text-white sm:hidden">Unsaved changes</span>
          </p>
          <div className="relative z-10 flex items-center gap-2">
            <Button variant="ghost" className="rounded-full text-[var(--color-muted)] hover:text-white" onClick={() => { setSettings(initialSettings); setUnsaved(false); }}>Discard</Button>
            <Button onClick={handleSaveSettings} loading={isPending} className="rounded-full bg-[#ffe500] hover:bg-[#ffe500]/80 text-black font-black px-6">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      )}

      {/* ── Edit Template Modal ─────────────────────────────── */}
      <Modal open={!!editingTemplate} onOpenChange={(o) => (!o && setEditingTemplate(null))}>
        <ModalContent className="max-w-3xl border border-[var(--color-border)] shadow-2xl bg-[var(--color-background)] rounded-[2rem]">
          <ModalHeader className="mb-4">
            <ModalTitle className="text-2xl font-bold">Edit Template: <span className="text-[#ffe500] font-mono ml-2 text-lg px-2 rounded-lg bg-[#ffe500]/10 border border-[#ffe500]/20">{editingTemplate?.name}</span></ModalTitle>
          </ModalHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-bold opacity-80 uppercase tracking-widest pl-1 mb-2 block">Email Subject</Label>
              <Input 
                value={templateSubject} 
                onChange={(e) => setTemplateSubject(e.target.value)} 
                className="py-4 rounded-2xl bg-black/30 border-[var(--color-border)] text-lg font-bold"
              />
            </div>
            <div>
              <Label className="text-sm font-bold opacity-80 uppercase tracking-widest pl-1 mb-2 block">HTML Body</Label>
              <div className="border border-[var(--color-border)] rounded-2xl bg-black/20 overflow-hidden min-h-[300px] flex">
                 <Textarea 
                   value={templateBody}
                   onChange={e => setTemplateBody(e.target.value)}
                   className="flex-1 w-full bg-transparent border-0 font-mono text-sm resize-none focus:ring-0 text-[var(--color-muted)] p-4 leading-relaxed outline-none"
                   placeholder="Edit HTML directly here..."
                 />
              </div>
            </div>
          </div>
          <ModalFooter className="mt-8">
            <Button variant="ghost" className="rounded-full" onClick={() => setEditingTemplate(null)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} loading={isPending} className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8">Save Change</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
