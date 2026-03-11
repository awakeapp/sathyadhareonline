'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { updateSettingsAction } from './actions';
import { Globe, Link as LinkIcon, Search, ToggleRight, Workflow, CheckCircle2, Save } from 'lucide-react';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

interface SiteSettings {
  general: any;
  social_links: any;
  seo: any;
  integrations: any;
  features: any;
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
        toast.success('System configuration deployed');
      }
    });
  };

  const tabs = [
    { id: 'general', label: 'Identity', icon: Globe },
    { id: 'social', label: 'Network', icon: LinkIcon },
    { id: 'seo', label: 'Discovery', icon: Search },
    { id: 'features', label: 'Modules', icon: ToggleRight },
    { id: 'integrations', label: 'Ecosystem', icon: Workflow },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* ── Navigator ── */}
      <div className="w-full md:w-64 shrink-0 space-y-3 flex flex-col">
        <div className="px-2 mb-2">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Settings Domains</p>
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
                    ? 'bg-[#5c4ae4] text-white shadow-xl shadow-indigo-500/20' 
                    : 'bg-white dark:bg-[#1b1929] text-gray-400 hover:text-[#5c4ae4] hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-300'}`} />
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
                     <h2 className="text-2xl font-black text-[#1b1929] dark:text-white">Global Identity</h2>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Foundational Branding</p>
                   </div>
                   <div className="grid gap-8 md:grid-cols-2">
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">Site Name</label>
                        <Input value={general.site_name || ''} onChange={(e) => setGeneral({ ...general, site_name: e.target.value })} className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-bold" />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">Tagline</label>
                        <Input value={general.tagline || ''} onChange={(e) => setGeneral({ ...general, tagline: e.target.value })} className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-bold text-sm" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">Contact Email</label>
                        <Input type="email" value={general.contact_email || ''} onChange={(e) => setGeneral({ ...general, contact_email: e.target.value })} className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-bold" />
                     </div>
                   </div>
                   
                   <div className="pt-8 border-t border-indigo-50 dark:border-white/5">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Asset Repository</h3>
                      <div className="grid gap-8 md:grid-cols-2">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-400">Logo Endpoint</label>
                           <Input value={general.logo_url || ''} onChange={(e) => setGeneral({ ...general, logo_url: e.target.value })} className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-mono text-[11px]" placeholder="https://..." />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-400">Favicon Link</label>
                           <Input value={general.favicon_url || ''} onChange={(e) => setGeneral({ ...general, favicon_url: e.target.value })} className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-mono text-[11px]" placeholder="https://..." />
                         </div>
                      </div>
                   </div>
                 </div>
               )}

               {activeTab === 'social' && (
                 <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-[#1b1929] dark:text-white">Social Network</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Cross-platform integration</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.keys(social).map(key => (
                        <div key={key} className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400">{key}</label>
                          <Input 
                            value={social[key] || ''} 
                            onChange={(e) => setSocial({ ...social, [key]: e.target.value })} 
                            className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-mono text-[11px]" 
                          />
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {activeTab === 'seo' && (
                 <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-[#1b1929] dark:text-white">Discovery & SEO</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Search Engine Optimisation</p>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">Default Architecture Title</label>
                        <Input value={seo.meta_title || ''} onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })} className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">Metadata Narrative</label>
                        <textarea 
                          value={seo.meta_description || ''} 
                          onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })} 
                          className="w-full px-5 py-4 rounded-3xl bg-gray-50 dark:bg-white/5 border-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">Open Graph Manifest Image</label>
                        <Input value={seo.og_image || ''} onChange={(e) => setSeo({ ...seo, og_image: e.target.value })} className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-mono text-[11px]" />
                      </div>
                    </div>
                 </div>
               )}

               {activeTab === 'features' && (
                 <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-[#1b1929] dark:text-white">Module Governance</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Dynamic feature toggles</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {Object.keys(features).map(key => {
                          const label = key.replace(/_enabled/g, '').replace(/_/g, ' ');
                          const toggleName = label.charAt(0).toUpperCase() + label.slice(1);
                          const isActive = features[key];
                          return (
                            <label key={key} className={`cursor-pointer group flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all ${isActive ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-[#5c4ae4]/30' : 'bg-white dark:bg-[#1b1929] border-gray-50 dark:border-white/5'}`}>
                              <div className="space-y-1">
                                <span className="font-black text-sm uppercase tracking-tight block">{toggleName}</span>
                                <div className="flex items-center gap-2">
                                   <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                   <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-emerald-500' : 'text-gray-400'}`}>
                                      {isActive ? "Operational" : "Deferred"}
                                   </span>
                                </div>
                              </div>
                              <input type="checkbox" checked={isActive} onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })} className="hidden" />
                              <div className={`w-12 h-7 shrink-0 rounded-full transition-all flex items-center p-1 cursor-pointer ${isActive ? 'bg-[#5c4ae4]' : 'bg-gray-100 dark:bg-white/5'}`}>
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
                      <h2 className="text-2xl font-black text-[#1b1929] dark:text-white">System Ecosystem</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Cross-platform identifiers</p>
                    </div>

                    <div className="flex flex-col gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400">Cloud Analytics ID</label>
                         <Input value={integrations.analytics_id || ''} onChange={(e) => setIntegrations({ ...integrations, analytics_id: e.target.value })} className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border-none font-mono" placeholder="G-XXXXXXXXXX" />
                       </div>

                       <div className="pt-8 border-t border-indigo-50 dark:border-white/5">
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Security Protocols</h3>
                          
                          <label className={`cursor-pointer group flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all mb-6 ${integrations.google_oauth_enabled ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/30' : 'bg-white dark:bg-[#1b1929] border-gray-50 dark:border-white/5 font-bold'}`}>
                              <div className="space-y-1">
                                <span className="font-black text-sm uppercase tracking-tight block">Google OAuth Gate</span>
                                <span className="text-[10px] font-bold text-gray-400">Authentication protocol bypass toggle</span>
                              </div>
                              <input type="checkbox" checked={integrations.google_oauth_enabled} onChange={(e) => setIntegrations({ ...integrations, google_oauth_enabled: e.target.checked })} className="hidden" />
                              <div className={`w-12 h-7 shrink-0 rounded-full transition-all flex items-center p-1 cursor-pointer ${integrations.google_oauth_enabled ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-white/5'}`}>
                                 <div className={`h-5 w-5 bg-white rounded-full shadow-lg transition-all ${integrations.google_oauth_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                              </div>
                           </label>

                           <div className="space-y-2 opacity-40">
                             <label className="text-[10px] font-black uppercase text-gray-400 flex justify-between">
                               <span>Google Client Identity</span>
                               <span className="text-emerald-500">Secure Vault Encrypted</span>
                             </label>
                             <div className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center px-5 font-mono text-xs select-none">
                               ******************************************.apps.googleusercontent.com
                             </div>
                           </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-white/5 flex justify-end items-center gap-4 mt-auto border-t border-indigo-50 dark:border-white/5">
             {isPending && (
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full border-2 border-indigo-50 border-t-[#5c4ae4] animate-spin" />
                   <span className="text-[10px] font-bold uppercase text-[#5c4ae4]">Synchronising...</span>
                </div>
             )}
             <PresenceButton 
               onClick={handleSave} 
               disabled={isPending}
               className="h-14 px-12 bg-[#5c4ae4] shadow-2xl shadow-indigo-500/30"
             >
                <Save className="w-5 h-5 mr-3" /> Deploy Config
             </PresenceButton>
          </div>
        </PresenceCard>
      </div>

    </div>
  );
}
