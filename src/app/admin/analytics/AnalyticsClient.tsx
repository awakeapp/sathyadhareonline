'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, Eye, MessageSquare, Layers, Calendar, Flame, TrendingUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { exportUsersCSVAction, exportContentPerformanceCSVAction, exportCategoryCSVAction } from './exports';
import Link from 'next/link';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

interface Props {
  startDate: string;
  endDate: string;
  timeSeries: { date: string; views: number; users: number; comments: number }[];
  topArticlesByViews: { id: string; title: string; slug: string; count: number }[];
  topArticlesByComments: { id: string; title: string; slug: string; count: number }[];
  categoryStats: { id: string; name: string; count: number; views: number }[];
  totals: { articles: number; published: number; viewsInRange: number };
}

const COLORS = ['#5c4ae4', '#2dd4bf', '#fbbf24', '#f43f5e', '#a855f7', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#181623] border border-indigo-100 dark:border-white/10 p-4 rounded-2xl shadow-2xl space-y-2 z-50">
        <p className="font-black text-[10px] uppercase tracking-widest text-zinc-500 mb-2 border-b border-indigo-50 dark:border-white/10 pb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4 items-center">
             <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: p.color }}>{p.name}</span>
             <span className="font-black text-sm text-zinc-900 dark:text-zinc-50 tabular-nums">{Number(p.value).toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsClient({ startDate, endDate, timeSeries, topArticlesByViews, topArticlesByComments, categoryStats, totals }: Props) {
  const router = useRouter();
  const [isExporting, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'categories'>('overview');

  const [isCustom, setIsCustom] = useState(false);
  const [customStart, setCustomStart] = useState(startDate.substring(0, 10));
  const [customEnd, setCustomEnd] = useState(endDate.substring(0, 10));

  const totalUsers = timeSeries.reduce((s, p) => s + p.users, 0);
  const totalComments = timeSeries.reduce((s, p) => s + p.comments, 0);
  const maxCatCount = Math.max(...categoryStats.map(c => c.count), 1);

  const applyPreset = (days: number) => {
    setIsCustom(false);
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    router.push(`?start=${start.toISOString()}&end=${end.toISOString()}`);
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) return toast.error('Check dates');
    const startD = new Date(customStart);
    const endSD = new Date(customEnd);
    endSD.setHours(23, 59, 59, 999);
    router.push(`?start=${startD.toISOString()}&end=${endSD.toISOString()}`);
  };

  const handleExport = (type: 'users' | 'content' | 'categories') => {
    startTransition(async () => {
        let res;
        if (type === 'users') res = await exportUsersCSVAction(startDate, endDate);
        else if (type === 'content') res = await exportContentPerformanceCSVAction(startDate, endDate);
        else res = await exportCategoryCSVAction(startDate, endDate);

        if (res?.error) {
          toast.error(`Export failed: ${res.error}`);
          return;
        }
        if (res?.csv && res?.filename) {
          const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', res.filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(`Exported ${res.filename}`);
        }
        return;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* ── Discovery Controls ── */}
      <PresenceCard className="bg-zinc-50 dark:bg-white/5 border-none p-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
          
          <div className="flex gap-2 bg-white dark:bg-zinc-950 p-2 rounded-[2rem] shadow-sm">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'content', label: 'Performance' },
              { id: 'categories', label: 'Taxonomy' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 p-2 rounded-[2rem] shadow-sm">
                <button onClick={() => applyPreset(7)} className="px-4 py-2 rounded-xl text-[10px] font-black text-zinc-500 hover:text-zinc-900 dark:text-zinc-50 transition-all">7D</button>
                <button onClick={() => applyPreset(30)} className="px-4 py-2 rounded-xl text-[10px] font-black text-zinc-500 hover:text-zinc-900 dark:text-zinc-50 transition-all">30D</button>
                <button onClick={() => setIsCustom(!isCustom)} className={`px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all ${isCustom ? 'bg-indigo-50 dark:bg-indigo-500/10 text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-50'}`}>
                  <Calendar className="w-4 h-4" strokeWidth={1.25} /> Range
                </button>
             </div>
             
             {isCustom && (
               <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <input type="date" className="h-12 px-4 rounded-2xl bg-white dark:bg-zinc-950 border-none text-[11px] font-black text-indigo-400 shadow-sm outline-none" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                  <input type="date" className="h-12 px-4 rounded-2xl bg-white dark:bg-zinc-950 border-none text-[11px] font-black text-indigo-400 shadow-sm outline-none" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                  <PresenceButton onClick={applyCustom} className="h-12 px-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">Seek</PresenceButton>
               </div>
             )}
          </div>

        </div>
      </PresenceCard>

      {/* ── Intelligence Render ── */}
      <div className="transition-all duration-500">
        
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               <PresenceCard className="relative overflow-hidden group">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Traffic Volume</p>
                  <p className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">{totals.viewsInRange.toLocaleString()}</p>
                  <Eye className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/5 group-hover:scale-125 transition-transform duration-700" />
               </PresenceCard>
               <PresenceCard className="relative overflow-hidden group">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">Network Growth</p>
                  <p className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">{totalUsers.toLocaleString()}</p>
                  <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500/5 group-hover:scale-125 transition-transform duration-700" />
               </PresenceCard>
               <PresenceCard className="relative overflow-hidden group">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3">Interaction Log</p>
                  <p className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">{totalComments.toLocaleString()}</p>
                  <MessageSquare className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-500/5 group-hover:scale-125 transition-transform duration-700" />
               </PresenceCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               <PresenceCard>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-zinc-900 dark:text-zinc-50">
                       <TrendingUp className="w-5 h-5" strokeWidth={1.25} />
                    </div>
                    <div>
                       <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">Growth Velocity</h3>
                       <p className="text-[9px] font-bold text-zinc-500 uppercase">User acquisition timeline</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeries}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5c4ae4" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#5c4ae4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="10 10" stroke="rgba(0,0,0,0.03)" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="stepAfter" dataKey="users" name="New Logins" stroke="#5c4ae4" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </PresenceCard>

               <PresenceCard>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-zinc-900 dark:text-zinc-50">
                       <BarChart3 className="w-5 h-5" strokeWidth={1.25} />
                    </div>
                    <div>
                       <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">Attention Span</h3>
                       <p className="text-[9px] font-bold text-zinc-500 uppercase">Impression distribution</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeries}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="10 10" stroke="rgba(0,0,0,0.03)" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="views" name="Impressions" stroke="#2dd4bf" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </PresenceCard>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
           <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 flex flex-col gap-4">
              <div className="flex justify-end">
                 <PresenceButton onClick={() => handleExport('content')} disabled={isExporting} className="bg-indigo-50 !text-zinc-900 dark:text-zinc-50 hover:bg-indigo-100 shadow-none">
                   <Download className="w-5 h-5 mr-3" strokeWidth={1.25} /> Export Performance Manifest
                 </PresenceButton>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PresenceCard>
                   <div className="flex items-center gap-4 mb-10 pb-6 border-b border-indigo-50 dark:border-white/5">
                      <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10">
                         <Flame className="w-7 h-7" strokeWidth={1.25} />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">High Velocity Content</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Maximum impressions in specified cycle</p>
                      </div>
                   </div>
                   
                   <div className="flex flex-col gap-4">
                     {topArticlesByViews.length === 0 ? (
                       <p className="text-center py-12 text-zinc-400 font-black uppercase text-xs">No Data Synchronised</p>
                     ) : (
                       topArticlesByViews.map((a) => {
                         const maxViews = Math.max(...topArticlesByViews.map(x => x.count), 1);
                         const pct = (a.count / maxViews) * 100;
                         return (
                           <div key={a.id} className="group">
                              <div className="flex items-center justify-between mb-2">
                                 <Link href={`/${a.slug}`} target="_blank" className="font-black text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-zinc-900 dark:text-zinc-50 transition-colors truncate max-w-[70%]">{a.title}</Link>
                                 <span className="font-black tabular-nums text-sm text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-50 transition-all">{a.count.toLocaleString()}</span>
                              </div>
                              <div className="h-2 bg-zinc-50 dark:bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full bg-rose-400/80 rounded-full transition-all duration-1000 group-hover:bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" style={{ width: `${pct}%` }} />
                              </div>
                           </div>
                         );
                       })
                     )}
                   </div>
                </PresenceCard>

                <PresenceCard>
                   <div className="flex items-center gap-4 mb-10 pb-6 border-b border-indigo-50 dark:border-white/5">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900/10 flex items-center justify-center text-zinc-900 dark:text-zinc-50 shadow-lg shadow-indigo-500/10">
                         <MessageSquare className="w-7 h-7" strokeWidth={1.25} />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">Enagement Density</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Highest interaction coefficients</p>
                      </div>
                   </div>
                   
                   <div className="flex flex-col gap-4">
                     {topArticlesByComments.length === 0 ? (
                       <p className="text-center py-12 text-zinc-400 font-black uppercase text-xs">No Data Synchronised</p>
                     ) : (
                       topArticlesByComments.map((a) => {
                         const maxComments = Math.max(...topArticlesByComments.map(x => x.count), 1);
                         const pct = (a.count / maxComments) * 100;
                         return (
                           <div key={a.id} className="group">
                              <div className="flex items-center justify-between mb-2">
                                 <Link href={`/${a.slug}`} target="_blank" className="font-black text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-zinc-900 dark:text-zinc-50 transition-colors truncate max-w-[70%]">{a.title}</Link>
                                 <span className="font-black tabular-nums text-sm text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-50 transition-all">{a.count.toLocaleString()}</span>
                              </div>
                              <div className="h-2 bg-zinc-50 dark:bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-400/80 rounded-full transition-all duration-1000 group-hover:bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" style={{ width: `${pct}%` }} />
                              </div>
                           </div>
                         );
                       })
                     )}
                   </div>
                </PresenceCard>
              </div>
           </div>
        )}

        {activeTab === 'categories' && (
           <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 grid grid-cols-1 md:grid-cols-2 gap-4">
              <PresenceCard>
                  <div className="flex items-center gap-4 mb-10 pb-6 border-b border-indigo-50 dark:border-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-500">
                       <Layers className="w-7 h-7" strokeWidth={1.25} />
                    </div>
                    <div>
                       <h2 className="text-base font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">Structural Mass</h2>
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Taxonomy volume distribution</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {categoryStats.map((cat, i) => {
                      const pct = (cat.count / maxCatCount) * 100;
                      return (
                        <div key={cat.id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black uppercase text-zinc-500">{cat.name}</span>
                            <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 tabular-nums">{cat.count} Units</span>
                          </div>
                          <div className="h-3 bg-zinc-50 dark:bg-white/5 rounded-xl overflow-hidden">
                            <div className="h-full rounded-xl transition-all duration-1000"
                              style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
              </PresenceCard>

              <PresenceCard>
                  <div className="flex items-center justify-between mb-10 pb-6 border-b border-indigo-50 dark:border-white/5">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                           <BarChart3 className="w-7 h-7" strokeWidth={1.25} />
                        </div>
                        <div>
                           <h2 className="text-base font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">Attention Matrix</h2>
                           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Engagement by category (Live)</p>
                        </div>
                     </div>
                     <PresenceButton onClick={() => handleExport('categories')} disabled={isExporting} className="bg-indigo-50 !text-zinc-900 dark:text-zinc-50 hover:bg-indigo-100 shadow-none h-11 px-5">
                       <Download className="w-4 h-4" strokeWidth={1.25} />
                     </PresenceButton>
                  </div>
                  
                  <div className="h-[300px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats.filter(c => c.views > 0).sort((a,b) => b.views - a.views)}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="views"
                          nameKey="name"
                          stroke="none"
                          cornerRadius={12}
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-6">
                     {categoryStats.slice(0, 5).map((cat, i) => (
                       <div key={cat.id} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{cat.name}</span>
                       </div>
                     ))}
                  </div>
              </PresenceCard>
           </div>
        )}

      </div>
    </div>
  );
}
