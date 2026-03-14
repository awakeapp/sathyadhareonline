/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { updateSettingsAction } from './actions';
import { Globe, Link as LinkIcon, Search, ToggleRight, Workflow, Save } from 'lucide-react';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

interface SiteSettings {
  general: Record<string, any>;
  social_links: Record<string, any>;
  seo: Record<string, any>;
  integrations: Record<string, any>;
  features: Record<string, any>;
}

export default function SettingsClient({ initialSettings }: { initialSettings: SiteSettings }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('general');

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
        toast.success('Settings saved successfully');
      }
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'social', label: 'Social', icon: LinkIcon },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'features', label: 'Features', icon: ToggleRight },
    { id: 'integrations', label: 'Integrations', icon: Workflow },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* ── Navigator ── */}
      <div className="w-full md:w-64 shrink-0 space-y-3 flex flex-col">
        <div className="px-2 mb-2">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Settings Categories</p>
        </div>
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-left transition-all whitespace-nowrap md:whitespace-normal
                  ${isActive 
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-white shadow-xl shadow-indigo-500/20' 
                    : 'bg-white dark:bg-zinc-950 text-zinc-500 hover:text-zinc-900 dark:text-zinc-50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span className="font-black text-sm uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col gap-4">
        <PresenceCard className="min-h-[600px] flex flex-col">
          <div className="flex-1 p-2 md:p-4">
            
            {/* TAB CONTENT */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               {activeTab === 'general' && (
                 <div className="flex flex-col gap-4">
                   <div>
                     <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">General Settings</h2>
                     <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Basic Information</p>
                   </div>
                   <div className="grid gap-8 md:grid-cols-2">
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500">Site Name</label>
                        <Input value={general.site_name || ''} onChange={(e) => setGeneral({ ...general, site_name: e.target.value })} className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border-none font-bold" />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500">Tagline</label>
                        <Input value={general.tagline || ''} onChange={(e) => setGeneral({ ...general, tagline: e.target.value })} className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border-none font-bold text-sm" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500">Contact Email</label>
                        <Input type="email" value={general.contact_email || ''} onChange={(e) => setGeneral({ ...general, contact_email: e.target.value })} className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border-none font-bold" />
                     </div>
                   </div>
                   
                   <div className="pt-8 border-t border-indigo-50 dark:border-white/5">
                      <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Images</h3>
                      <div className="grid gap-8 md:grid-cols-2">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-zinc-500">Logo URL</label>
                           <Input value={general.logo_url || ''} onChange={(e) => setGeneral({ ...general, logo_url: e.target.value })} className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border-none font-mono text-[11px]" placeholder="https://..." />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-zinc-500">Favicon URL</label>
                           <Input value={general.favicon_url || ''} onChange={(e) => setGeneral({ ...general, favicon_url: e.target.value })} className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border-none font-mono text-[11px]" placeholder="https://..." />
                         </div>
                      </div>
                   </div>
                 </div>
               )}

               {activeTab === 'social' && (
                 <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Social Links</h2>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Connect your accounts</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map(key => (
                        <div key={key} className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-500">{key}</label>
                          <Input 
                            value={social[key] || ''} 
                            onChange={(e) => setSocial({ ...social, [key]: e.target.value })} 
                            className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border-none font-mono text-[11px]" 
                            placeholder={`https://${key}.com/...`}
                          />
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {activeTab === 'seo' && (
                 <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">SEO Settings</h2>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Search Engine Optimization</p>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500">Default Meta Title</label>
                        <Input value={seo.meta_title || ''} onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })} className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500">Meta Description</label>
                        <textarea 
                          value={seo.meta_description || ''} 
                          onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })} 
                          className="w-full px-5 py-4 rounded-3xl bg-zinc-50 dark:bg-white/5 border-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-500">Default OG Image URL</label>
                        <Input value={seo.og_image || ''} onChange={(e) => setSeo({ ...seo, og_image: e.target.value })} className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border-none font-mono text-[11px]" />
                      </div>
                    </div>
                 </div>
               )}

               {activeTab === 'features' && (
                 <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Features & Modules</h2>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Enable or disable features</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {Object.keys(features).map(key => {
                          const label = key.replace(/_enabled/g, '').replace(/_/g, ' ');
                          const toggleName = label.charAt(0).toUpperCase() + label.slice(1);
                          const isActive = features[key];
                          return (
                            <label key={key} className={`cursor-pointer group flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all ${isActive ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-zinc-900 dark:border-white/30' : 'bg-white dark:bg-zinc-950 border-gray-50 dark:border-white/5'}`}>
                              <div className="space-y-1">
                                <span className="font-black text-sm uppercase tracking-tight block">{toggleName}</span>
                                <div className="flex items-center gap-2">
                                   <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                   <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                      {isActive ? "Enabled" : "Disabled"}
                                   </span>
                                </div>
                              </div>
                              <input type="checkbox" checked={isActive} onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })} className="hidden" />
                              <div className={`w-12 h-7 shrink-0 rounded-full transition-all flex items-center p-1 cursor-pointer ${isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-gray-100 dark:bg-white/5'}`}>
                                 <div className={`h-5 w-5 bg-white rounded-full shadow-lg transition-all ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                              </div>
                            </label>
                          );
                       })}
                    </div>
                 </div>
               )}

               {activeTab === 'integrations' && (
                 <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Integrations</h2>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Third-party services</p>
                    </div>

                    <div className="flex flex-col gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-zinc-500">Google Analytics ID</label>
                         <Input value={String(integrations.analytics_id || '')} onChange={(e) => setIntegrations({ ...integrations, analytics_id: e.target.value })} className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border-none font-mono" placeholder="G-XXXXXXXXXX" />
                       </div>

                         <div className="pt-8 border-t border-indigo-50 dark:border-white/5">
                          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Authentication</h3>
                          <div className="p-6 rounded-[1.5rem] border-2 bg-white dark:bg-zinc-950 border-gray-50 dark:border-white/5">
                             <p className="text-[13px] text-zinc-500 font-medium leading-relaxed">
                               External authentication integrations such as Google OAuth are currently managed directly via the Supabase configuration dashboard. Please contact a system administrator for modifications.
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-white/5 flex justify-end items-center gap-4 mt-auto border-t border-indigo-50 dark:border-white/5">
             {isPending && (
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full border-2 border-indigo-50 border-t-[#5c4ae4] animate-spin" />
                   <span className="text-[10px] font-bold uppercase text-zinc-900 dark:text-zinc-50">Saving...</span>
                </div>
             )}
             <PresenceButton 
               onClick={handleSave} 
               disabled={isPending}
               className="h-14 px-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl shadow-indigo-500/30"
             >
                <Save className="w-5 h-5 mr-3" strokeWidth={1.25} /> Save Settings
             </PresenceButton>
          </div>
        </PresenceCard>
      </div>

    </div>
  );
}
