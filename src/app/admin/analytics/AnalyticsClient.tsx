'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, Eye, MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { exportUsersCSVAction, exportContentPerformanceCSVAction, exportCategoryCSVAction } from './exports';
import Link from 'next/link';

interface Props {
  startDate: string;
  endDate: string;
  timeSeries: { date: string; views: number; users: number; comments: number }[];
  topArticlesByViews: { id: string; title: string; slug: string; count: number }[];
  topArticlesByComments: { id: string; title: string; slug: string; count: number }[];
  categoryStats: { id: string; name: string; count: number; views: number }[];
  totals: { articles: number; published: number; viewsInRange: number };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string, value: number, color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-2xl shadow-xl z-50">
        <p className="font-semibold text-[12px] text-zinc-500 mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex justify-between gap-6 items-center">
             <span className="text-[13px] font-medium" style={{ color: p.color }}>{p.name}</span>
             <span className="font-semibold text-[14px] text-[var(--color-text)] tabular-nums">{Number(p.value).toLocaleString()}</span>
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-24">
      
      {/* Segmented Controls */}
      <div className="bg-[#e3e3e8] dark:bg-[#1c1c1e] p-1 rounded-[10px] flex">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'content', label: 'Content' },
          { id: 'categories', label: 'Categories' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as 'overview' | 'content' | 'categories')}
            className={`flex-1 py-1.5 rounded-[8px] text-[13px] font-medium transition-all ${activeTab === t.id ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-sm' : 'text-zinc-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap items-center gap-2">
         <button onClick={() => applyPreset(7)} className="px-4 py-[6px] rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text)]">7 Days</button>
         <button onClick={() => applyPreset(30)} className="px-4 py-[6px] rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text)]">30 Days</button>
         <button onClick={() => setIsCustom(!isCustom)} className={`px-4 py-[6px] rounded-full flex items-center gap-2 text-[13px] font-medium border border-[var(--color-border)] ${isCustom ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'bg-[var(--color-surface)] text-[var(--color-text)]'}`}>
           <Calendar className="w-4 h-4" strokeWidth={1.5} /> Custom
         </button>
      </div>
      
      {isCustom && (
         <div className="flex items-center gap-2 bg-[var(--color-surface)] p-2 rounded-xl border border-[var(--color-border)]">
            <input type="date" className="h-10 px-3 flex-1 rounded-lg bg-transparent text-[14px] text-zinc-800 dark:text-zinc-200 outline-none" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <span className="text-zinc-400">→</span>
            <input type="date" className="h-10 px-3 flex-1 rounded-lg bg-transparent text-[14px] text-zinc-800 dark:text-zinc-200 outline-none" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            <button onClick={applyCustom} className="h-10 px-4 rounded-lg bg-blue-500 text-white text-[13px] font-medium">Apply</button>
         </div>
      )}

      <div className="transition-all duration-300">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            
            {/* Top Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
               <div className="bg-[var(--color-surface)] p-5 rounded-3xl border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 mb-2 text-zinc-500">
                    <Eye className="w-5 h-5" />
                    <span className="text-[13px] font-medium">Views</span>
                  </div>
                  <p className="text-3xl font-semibold text-[var(--color-text)] tabular-nums">{totals.viewsInRange.toLocaleString()}</p>
               </div>
               <div className="bg-[var(--color-surface)] p-5 rounded-3xl border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 mb-2 text-zinc-500">
                    <Users className="w-5 h-5" />
                    <span className="text-[13px] font-medium">New Accounts</span>
                  </div>
                  <p className="text-3xl font-semibold text-[var(--color-text)] tabular-nums">{totalUsers.toLocaleString()}</p>
               </div>
               <div className="bg-[var(--color-surface)] p-5 rounded-3xl border border-[var(--color-border)] col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 mb-2 text-zinc-500">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[13px] font-medium">Comments</span>
                  </div>
                  <p className="text-3xl font-semibold text-[var(--color-text)] tabular-nums">{totalComments.toLocaleString()}</p>
               </div>
            </div>

            {/* Charts */}
            <div className="bg-[var(--color-surface)] p-5 rounded-3xl border border-[var(--color-border)]">
                <h3 className="text-[15px] font-semibold text-[var(--color-text)] mb-6">Audience Growth</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeries}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="views" name="Views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
           <div className="flex flex-col gap-6">
              <div className="flex justify-end">
                 <button onClick={() => handleExport('content')} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] rounded-full border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text)]">
                   <Download className="w-4 h-4" /> Export CSV
                 </button>
              </div>
              
              <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden">
                 <div className="p-5 border-b border-[var(--color-border)]">
                    <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Top Articles by Views</h2>
                 </div>
                 <div className="flex flex-col">
                   {topArticlesByViews.length === 0 ? (
                     <p className="text-center py-8 text-zinc-400 text-[13px]">No data available</p>
                   ) : (
                     topArticlesByViews.map((a) => {
                       return (
                         <Link key={a.id} href={`/articles/${a.slug}`} target="_blank" className="flex items-center justify-between p-4 active:bg-zinc-50 dark:active:bg-[#2c2c2e] transition-colors">
                            <span className="text-[15px] font-medium text-[var(--color-text)] truncate max-w-[75%] pr-4">{a.title}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[14px] text-zinc-500 tabular-nums">{a.count.toLocaleString()}</span>
                              <ChevronRight className="w-4 h-4 text-zinc-300" />
                            </div>
                         </Link>
                       );
                     })
                   )}
                 </div>
              </div>

              <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden">
                 <div className="p-5 border-b border-[var(--color-border)]">
                    <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Most Discussed</h2>
                 </div>
                 <div className="flex flex-col">
                   {topArticlesByComments.length === 0 ? (
                     <p className="text-center py-8 text-zinc-400 text-[13px]">No data available</p>
                   ) : (
                     topArticlesByComments.map((a) => {
                       return (
                         <Link key={a.id} href={`/articles/${a.slug}`} target="_blank" className="flex items-center justify-between p-4 active:bg-zinc-50 dark:active:bg-[#2c2c2e] transition-colors">
                            <span className="text-[15px] font-medium text-[var(--color-text)] truncate max-w-[75%] pr-4">{a.title}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[14px] text-zinc-500 tabular-nums">{a.count.toLocaleString()}</span>
                              <ChevronRight className="w-4 h-4 text-zinc-300" />
                            </div>
                         </Link>
                       );
                     })
                   )}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'categories' && (
           <div className="flex flex-col gap-6">
              <div className="flex justify-end">
                 <button onClick={() => handleExport('categories')} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] rounded-full border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text)]">
                   <Download className="w-4 h-4" /> Export CSV
                 </button>
              </div>

              <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] flex flex-col items-center">
                 <h2 className="text-[16px] font-semibold text-[var(--color-text)] w-full mb-6 text-left">Views by Category</h2>
                  <div className="h-[250px] w-[250px] relative">
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
                          cornerRadius={8}
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
              </div>

              <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden">
                 <div className="p-5 border-b border-[var(--color-border)]">
                    <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Content Library</h2>
                 </div>
                 <div className="flex flex-col">
                   {categoryStats.map((cat, i) => {
                     return (
                         <div key={cat.id} className="flex items-center justify-between p-4 border-b border-[var(--color-border)] last:border-0">
                           <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-[15px] text-[var(--color-text)]">{cat.name}</span>
                           </div>
                           <span className="text-[14px] text-zinc-500">{cat.count} articles</span>
                         </div>
                     );
                   })}
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
