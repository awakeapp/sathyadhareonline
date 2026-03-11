'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { updateSettingsAction } from './actions';
import { Globe, Link as LinkIcon, Search, ToggleRight, Workflow, Image as ImageIcon } from 'lucide-react';

interface SiteSettings {
  general: any;
  social_links: any;
  seo: any;
  integrations: any;
  features: any;
}

export default function SettingsClient({ initialSettings }: { initialSettings: SiteSettings }) {
  const [isPending, startTransition] = useTransition();

  // Tabs: general, social, seo, features, integrations
  const [activeTab, setActiveTab] = useState('general');

  // Form states based on JSON columns
  const [general, setGeneral] = useState(initialSettings.general || {});
  const [social, setSocial] = useState(initialSettings.social_links || {});
  const [seo, setSeo] = useState(initialSettings.seo || {});
  const [features, setFeatures] = useState(initialSettings.features || {});
  const [integrations, setIntegrations] = useState(initialSettings.integrations || {});

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateSettingsAction({
        general,
        social_links: social,
        seo,
        features,
        integrations
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Site configuration saved successfully');
      }
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'social', label: 'Social Links', icon: LinkIcon },
    { id: 'seo', label: 'SEO Config', icon: Search },
    { id: 'features', label: 'Feature Toggles', icon: ToggleRight },
    { id: 'integrations', label: 'Integrations', icon: Workflow },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      
      {/* ── Sidebar Nav ────────────────────────────────────────────── */}
      <div className="w-full md:w-64 shrink-0 space-y-2 flex-col flex overflow-x-auto md:overflow-visible pb-2 md:pb-0 hide-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal
                ${isActive 
                  ? 'bg-[var(--color-primary)] text-black shadow-md border-transparent' 
                  : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-white hover:bg-white/5 border border-[var(--color-border)]'}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ────────────────────────────────────────────── */}
      <Card className="flex-1 rounded-3xl shadow-none border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="p-6 md:p-8 space-y-8 min-h-[500px]">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-black text-white">General Settings</h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">Core details representing your global identity.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Site Name</label>
                  <Input value={general.site_name || ''} onChange={(e) => setGeneral({ ...general, site_name: e.target.value })} className="bg-black/20" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Tagline</label>
                  <Input value={general.tagline || ''} onChange={(e) => setGeneral({ ...general, tagline: e.target.value })} className="bg-black/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Contact Email</label>
                  <Input type="email" value={general.contact_email || ''} onChange={(e) => setGeneral({ ...general, contact_email: e.target.value })} className="bg-black/20" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-[var(--color-border)]">
                 <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Media Assets</h3>
                 <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Logo URL</label>
                      <Input value={general.logo_url || ''} onChange={(e) => setGeneral({ ...general, logo_url: e.target.value })} className="bg-black/20" placeholder="https://" />
                      <p className="text-[10px] text-[var(--color-muted)]">Must be uploaded to media library first, copy public URL here.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Favicon URL</label>
                      <Input value={general.favicon_url || ''} onChange={(e) => setGeneral({ ...general, favicon_url: e.target.value })} className="bg-black/20" placeholder="https://" />
                      <p className="text-[10px] text-[var(--color-muted)]">Preferably a square .ico or .png file</p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* SOCIAL TAB */}
          {activeTab === 'social' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div>
                <h2 className="text-xl font-black text-white">Social Linking</h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">Populate platform footers across the front-end network.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {Object.keys(social).map(key => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">{key}</label>
                    <Input 
                      value={social[key] || ''} 
                      onChange={(e) => setSocial({ ...social, [key]: e.target.value })} 
                      className="bg-black/20" 
                      placeholder="https://"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEO TAB */}
          {activeTab === 'seo' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div>
                <h2 className="text-xl font-black text-white">SEO Configuration</h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">Global defaults for search engine and open-graph indexing.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Default Meta Title</label>
                  <Input value={seo.meta_title || ''} onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })} className="bg-black/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Meta Description</label>
                  <textarea 
                    value={seo.meta_description || ''} 
                    onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })} 
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-black/20 focus:ring-2 focus:ring-[var(--color-primary)] text-white text-sm"
                    rows={4}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">OG Share Image URL</label>
                  <Input value={seo.og_image || ''} onChange={(e) => setSeo({ ...seo, og_image: e.target.value })} className="bg-black/20" placeholder="https://" />
                  <p className="text-[10px] text-[var(--color-muted)]">Fallback image when links are shared on social media apps.</p>
                </div>
              </div>
            </div>
          )}

          {/* FEATURES TAB */}
          {activeTab === 'features' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div>
                <h2 className="text-xl font-black text-white">Feature Toggles</h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">Flip switches dynamically to adapt system traffic.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {Object.keys(features).map(key => {
                    const label = key.replace(/_enabled/g, '').replace(/_/g, ' ');
                    const toggleName = label.charAt(0).toUpperCase() + label.slice(1);
                    return (
                      <label key={key} className={`cursor-pointer group flex items-center justify-between p-4 rounded-xl border transition-all ${features[key] ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/50 text-[var(--color-primary)]' : 'bg-black/20 border border-[var(--color-border)] text-white'}`}>
                        <div className="space-y-0.5">
                          <span className="font-bold tracking-wider uppercase text-xs block">{toggleName}</span>
                          <span className={`text-[10px] ${features[key] ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`}>
                             {features[key] ? "Currently Live" : "Offline"}
                          </span>
                        </div>
                        <input 
                           type="checkbox" 
                           checked={features[key]} 
                           onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })} 
                           className="hidden"
                        />
                        <div className={`w-10 h-6 shrink-0 rounded-full transition-all flex items-center p-1 cursor-pointer ${features[key] ? 'bg-[var(--color-primary)]' : 'bg-black/40 border border-[var(--color-border)]'}`}>
                           <div className={`h-4 w-4 bg-white rounded-full shadow-md transition-all ${features[key] ? 'translate-x-4' : 'translate-x-0 bg-[var(--color-muted)]'}`} />
                        </div>
                      </label>
                    );
                 })}
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div>
                <h2 className="text-xl font-black text-white">Integrations</h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">Configure external data pipelining identifiers.</p>
              </div>

              <div className="space-y-6">
                 {/* Google Analytics or tracking */}
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Tracking / Analytics ID</label>
                   <Input value={integrations.analytics_id || ''} onChange={(e) => setIntegrations({ ...integrations, analytics_id: e.target.value })} className="bg-black/20" placeholder="e.g. G-XXXXXXX" />
                 </div>

                 {/* Auth */}
                 <div className="pt-4 border-t border-[var(--color-border)]">
                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Authentication Systems</h3>
                    
                    <label className={`cursor-pointer group flex items-center justify-between p-4 rounded-xl border transition-all mb-4 ${integrations.google_oauth_enabled ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-black/20 border border-[var(--color-border)] text-white'}`}>
                        <div className="space-y-0.5">
                          <span className="font-bold tracking-wider uppercase text-xs block">Google OAuth Check</span>
                          <span className={`text-[10px] ${integrations.google_oauth_enabled ? 'text-emerald-500/80' : 'text-[var(--color-muted)]'}`}>
                             Gate toggle for logging in with google button UI
                          </span>
                        </div>
                        <input 
                           type="checkbox" 
                           checked={integrations.google_oauth_enabled} 
                           onChange={(e) => setIntegrations({ ...integrations, google_oauth_enabled: e.target.checked })} 
                           className="hidden"
                        />
                        <div className={`w-10 h-6 shrink-0 rounded-full transition-all flex items-center p-1 cursor-pointer ${integrations.google_oauth_enabled ? 'bg-emerald-500' : 'bg-black/40 border border-[var(--color-border)]'}`}>
                           <div className={`h-4 w-4 bg-white rounded-full shadow-md transition-all ${integrations.google_oauth_enabled ? 'translate-x-4' : 'translate-x-0 bg-[var(--color-muted)]'}`} />
                        </div>
                     </label>

                     <div className="space-y-1.5 opacity-60 pointer-events-none grayscale">
                       <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider flex justify-between">
                         <span>Google Client ID</span>
                         <span className="text-red-400">Environment Configured in DB Vault directly</span>
                       </label>
                       <Input value={integrations.google_client_id || '********************'} readOnly className="bg-black/40 blur-[2px]" />
                     </div>
                 </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Save Action ───────────────────────────────────────────── */}
        <div className="p-4 md:p-6 border-t border-[var(--color-border)] bg-black/20 flex justify-end">
          <Button 
            onClick={handleSave} 
            loading={isPending}
            className="h-12 w-full md:w-auto px-10 rounded-xl font-bold bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90 shadow-lg shrink-0"
          >
             Commit Configurations
          </Button>
        </div>
      </Card>

    </div>
  );
}
