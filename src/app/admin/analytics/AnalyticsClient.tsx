'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, Eye, MessageSquare, Layers, Calendar, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { exportUsersCSVAction, exportContentPerformanceCSVAction, exportCategoryCSVAction } from './exports';
import Link from 'next/link';

// Custom lightweight date picker to avoid massive dependencies if react-day-picker acts up, 
// using native inputs for custom dates for extreme reliability in admin panels.

interface Props {
  startDate: string;
  endDate: string;
  timeSeries: { date: string; views: number; users: number; comments: number }[];
  topArticlesByViews: { id: string; title: string; slug: string; count: number }[];
  topArticlesByComments: { id: string; title: string; slug: string; count: number }[];
  categoryStats: { id: string; name: string; count: number; views: number }[];
  totals: { articles: number; published: number; viewsInRange: number };
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#181623] border border-white/10 p-3 rounded-xl shadow-xl text-xs space-y-1 z-50">
        <p className="font-bold text-white mb-2 pb-2 border-b border-white/10">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4">
             <span style={{ color: p.color }}>{p.name}:</span>
             <span className="font-bold text-white">{Number(p.value).toLocaleString()}</span>
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

  // Manual Date States for Custom range
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
    if (!customStart || !customEnd) return toast.error('Select valid dates');
    const startD = new Date(customStart);
    const endD = new Date(customEnd);
    endD.setHours(23, 59, 59, 999);
    router.push(`?start=${startD.toISOString()}&end=${endD.toISOString()}`);
  };

  const handleExport = (type: 'users' | 'content' | 'categories') => {
    startTransition(() => {
      (async () => {
        let res;
        if (type === 'users') res = await exportUsersCSVAction(startDate, endDate);
        else if (type === 'content') res = await exportContentPerformanceCSVAction(startDate, endDate);
        else res = await exportCategoryCSVAction(startDate, endDate);

        if (res?.error) return toast.error(`Export failed: ${res.error}`);
        if (res?.csv && res?.filename) {
          const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', res.filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(`${res.filename} exported successfully.`);
        }
      })();
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ── Top Controls: Tabs & Date Range ──────────────────── */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-[var(--color-surface)] p-4 border border-[var(--color-border)] rounded-3xl">
        
        {/* Tabs */}
        <div className="flex gap-2 w-full xl:w-auto overflow-x-auto hide-scrollbar">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'content', label: 'Content Performance' },
            { id: 'categories', label: 'Category Matrix' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-[var(--color-primary)] text-black shadow-md' : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Date Picker Engine */}
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center gap-1 bg-black/20 p-1.5 rounded-[1.25rem] border border-[var(--color-border)]">
              <button onClick={() => applyPreset(7)} className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all text-[var(--color-muted)] hover:text-white hover:bg-white/5">7D</button>
              <button onClick={() => applyPreset(30)} className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all text-[var(--color-muted)] hover:text-white hover:bg-white/5">30D</button>
              <button onClick={() => setIsCustom(!isCustom)} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isCustom ? 'bg-white/10 text-white' : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5'}`}>
                <Calendar className="w-3.5 h-3.5" /> Custom
              </button>
           </div>
           
           {isCustom && (
             <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 pl-2">
                <input type="date" className="h-9 px-3 rounded-xl bg-black/20 border border-[var(--color-border)] text-xs text-white outline-none" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                <span className="text-[var(--color-muted)] text-xs font-bold">to</span>
                <input type="date" className="h-9 px-3 rounded-xl bg-black/20 border border-[var(--color-border)] text-xs text-white outline-none" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                <Button size="sm" onClick={applyCustom} className="h-9 rounded-xl bg-[#ffe500] text-black hover:bg-[#ffe500]/90">Apply</Button>
             </div>
           )}
        </div>

      </div>

      {/* ── Content Render ────────────────────────────────────── */}
      <div className="transition-all duration-300">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <Card className="rounded-[2rem] border-transparent bg-indigo-500/10 shadow-none">
                 <CardContent className="p-6">
                   <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black mb-2">Total Views</p>
                   <p className="text-3xl font-black tabular-nums text-white">{totals.viewsInRange.toLocaleString()}</p>
                 </CardContent>
               </Card>
               <Card className="rounded-[2rem] border-transparent bg-emerald-500/10 shadow-none">
                 <CardContent className="p-6">
                   <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black mb-2">New Signups</p>
                   <p className="text-3xl font-black tabular-nums text-white">{totalUsers.toLocaleString()}</p>
                 </CardContent>
               </Card>
               <Card className="rounded-[2rem] border-transparent bg-amber-500/10 shadow-none">
                 <CardContent className="p-6">
                   <p className="text-[10px] text-amber-400 uppercase tracking-widest font-black mb-2">New Comments</p>
                   <p className="text-3xl font-black tabular-nums text-white">{totalComments.toLocaleString()}</p>
                 </CardContent>
               </Card>
               <div className="flex flex-col gap-2 justify-center ml-2">
                 <Button variant="outline" className="w-full justify-start h-11 rounded-2xl bg-black/20 border-[var(--color-border)] text-[var(--color-muted)] hover:text-white" onClick={() => handleExport('users')} loading={isExporting}>
                    <Download className="w-4 h-4 mr-2" /> Export Users CSV
                 </Button>
                 <Button variant="outline" className="w-full justify-start h-11 rounded-2xl bg-black/20 border-[var(--color-border)] text-[var(--color-muted)] hover:text-white" onClick={() => handleExport('content')} loading={isExporting}>
                    <Download className="w-4 h-4 mr-2" /> Export Content CSV
                 </Button>
               </div>
            </div>

            {/* Growth Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">User Growth Engine</h3>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeSeries} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="date" hide />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="stepAfter" dataKey="users" name="New Signups" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
               </Card>

               <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Eye className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Platform Views Trajectory</h3>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeSeries} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="date" hide />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="views" name="Views" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
               </Card>
            </div>
          </div>
        )}

        {/* TAB 2: CONTENT PERFORMANCE */}
        {activeTab === 'content' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={() => handleExport('content')} disabled={isExporting} className="rounded-full text-xs h-9 bg-black/20 text-[#ffe500] border-[#ffe500]/30 hover:bg-[#ffe500]/10">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export full performance log
                </Button>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-white/5 gap-2">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                           <Flame className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-white uppercase tracking-wider">Top by Views</h2>
                          <p className="text-[10px] text-[var(--color-muted)] font-medium">Top 10 highest driving articles in period</p>
                        </div>
                     </div>
                  </div>
                  
                  {topArticlesByViews.length === 0 ? (
                    <div className="py-12 border-dashed border border-[var(--color-border)] rounded-2xl text-center text-[var(--color-muted)] font-semibold text-sm">No view data available</div>
                  ) : (
                    <div className="space-y-4">
                      {topArticlesByViews.slice(0, 10).map((a, i) => {
                        const maxViews = Math.max(...topArticlesByViews.map(x => x.count), 1);
                        const pct = Math.round((a.count / maxViews) * 100);
                        return (
                          <div key={a.id} className="group relative">
                             <div className="flex items-center gap-3 mb-1.5 relative z-10">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-orange-500 text-black' : i === 1 ? 'bg-orange-500/50 text-white' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-transparent text-[var(--color-muted)]'}`}>{i + 1}</span>
                                <Link href={`/${a.slug}`} target="_blank" className="flex-1 font-bold text-sm truncate text-white group-hover:text-orange-400 transition-colors pointer-events-auto">{a.title}</Link>
                                <span className="font-black tabular-nums text-sm text-white shrink-0">{a.count.toLocaleString()}</span>
                             </div>
                             <div className="pl-9 relative z-0">
                                <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                                   <div className="h-full bg-orange-500/60 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                </div>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>

               <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-white/5 gap-2">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                           <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-white uppercase tracking-wider">Top by Comments</h2>
                          <p className="text-[10px] text-[var(--color-muted)] font-medium">Top 10 most engaging articles in period</p>
                        </div>
                     </div>
                  </div>
                  
                  {topArticlesByComments.length === 0 ? (
                    <div className="py-12 border-dashed border border-[var(--color-border)] rounded-2xl text-center text-[var(--color-muted)] font-semibold text-sm">No comment data available</div>
                  ) : (
                    <div className="space-y-4">
                      {topArticlesByComments.slice(0, 10).map((a, i) => {
                        const maxComments = Math.max(...topArticlesByComments.map(x => x.count), 1);
                        const pct = Math.round((a.count / maxComments) * 100);
                        return (
                          <div key={a.id} className="group relative">
                             <div className="flex items-center gap-3 mb-1.5 relative z-10">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-sky-500 text-black' : i === 1 ? 'bg-sky-500/50 text-white' : i === 2 ? 'bg-sky-500/20 text-sky-400' : 'bg-transparent text-[var(--color-muted)]'}`}>{i + 1}</span>
                                <Link href={`/${a.slug}`} target="_blank" className="flex-1 font-bold text-sm truncate text-white group-hover:text-sky-400 transition-colors pointer-events-auto">{a.title}</Link>
                                <span className="font-black tabular-nums text-sm text-white shrink-0">{a.count.toLocaleString()}</span>
                             </div>
                             <div className="pl-9 relative z-0">
                                <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                                   <div className="h-full bg-sky-500/60 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                </div>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>

             </div>
           </div>
        )}

        {/* TAB 3: CATEGORY METRICS */}
        {activeTab === 'categories' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
                           <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-white uppercase tracking-wider">Volume Density</h2>
                          <p className="text-[10px] text-[var(--color-muted)] font-medium">Article count distribution</p>
                        </div>
                     </div>
                  </div>
                  
                  {categoryStats.length === 0 ? (
                    <div className="py-12 border-dashed border border-[var(--color-border)] rounded-2xl text-center text-[var(--color-muted)] font-semibold text-sm">No categories active.</div>
                  ) : (
                    <div className="space-y-4">
                      {categoryStats.map((cat, i) => {
                        const pct = Math.round((cat.count / maxCatCount) * 100);
                        return (
                          <div key={cat.id}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-bold text-white">{cat.name}</span>
                              <span className="text-xs font-black text-[var(--color-muted)] tabular-nums">{cat.count}</span>
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700`}
                                style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
             </Card>

             <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-white/5 pb-4 gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                           <Eye className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-white uppercase tracking-wider">Traction Matrix</h2>
                          <p className="text-[10px] text-[var(--color-muted)] font-medium">Views driving categories (Range)</p>
                        </div>
                     </div>
                     <Button variant="outline" size="sm" onClick={() => handleExport('categories')} disabled={isExporting} className="rounded-full text-xs h-9 bg-black/20 text-[#ffe500] border-[#ffe500]/30 hover:bg-[#ffe500]/10 shrink-0">
                       <Download className="w-3.5 h-3.5 mr-1.5" /> CSV Export
                     </Button>
                  </div>
                  
                  {categoryStats.every(c => c.views === 0) ? (
                    <div className="py-12 border-dashed border border-[var(--color-border)] rounded-2xl text-center text-[var(--color-muted)] font-semibold text-sm">No category views in this range.</div>
                  ) : (
                    <div className="h-[300px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryStats.filter(c => c.views > 0).sort((a,b) => b.views - a.views)}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={4}
                            dataKey="views"
                            nameKey="name"
                            stroke="none"
                            cornerRadius={5}
                          >
                            {categoryStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
             </Card>
           </div>
        )}

      </div>
    </div>
  );
}
