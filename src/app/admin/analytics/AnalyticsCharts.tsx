'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, Eye, MessageSquare, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { exportUsersCSV, exportArticlesCSV, exportViewsCSV } from './actions';
import { toast } from 'sonner';

interface DayPoint { date: string; views: number; users: number; comments: number; }
interface CategoryStat { id: string; name: string; count: number; views: number; }

interface Props {
  timeSeries: DayPoint[]; // Typically the last 90 days, ordered oldest to newest
  categoryStats: CategoryStat[];
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#181623] border border-white/10 p-3 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-bold text-white mb-2 pb-2 border-b border-white/10">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="font-bold text-white">{p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsCharts({ timeSeries, categoryStats }: Props) {
  const [range, setRange] = useState<'7' | '30' | '90'>('30');
  const [isExporting, startTransition] = useTransition();

  // Slice the data based on range
  const days = parseInt(range, 10);
  const data = timeSeries.slice(-days);

  const totalViews = data.reduce((s, p) => s + p.views, 0);
  const totalUsers = data.reduce((s, p) => s + p.users, 0);
  const totalComments = data.reduce((s, p) => s + p.comments, 0);

  const maxCatCount = Math.max(...categoryStats.map(c => c.count), 1);

  const handleExport = (type: 'users' | 'articles' | 'views') => {
    startTransition(async () => {
      let res;
      if (type === 'users') res = await exportUsersCSV();
      else if (type === 'articles') res = await exportArticlesCSV();
      else res = await exportViewsCSV();

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
        toast.success(`${res.filename} exported successfully.`);
      }
    });
  };


  return (
    <div className="space-y-6">
      {/* ── Range Picker & Export ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-1 bg-black/20 p-1.5 rounded-[1.25rem] border border-[var(--color-border)]">
          {(['7', '30', '90'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                range === r
                  ? 'bg-[#ffe500] text-black shadow-lg shadow-black/20'
                  : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5'
              }`}>
              Last {r} Days
            </button>
          ))}
        </div>

        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => handleExport('users')} disabled={isExporting} className="rounded-full text-xs h-9">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Users
           </Button>
           <Button variant="outline" size="sm" onClick={() => handleExport('articles')} disabled={isExporting} className="rounded-full text-xs h-9">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Articles
           </Button>
           <Button variant="outline" size="sm" onClick={() => handleExport('views')} disabled={isExporting} className="rounded-full text-xs h-9">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Views
           </Button>
        </div>
      </div>

      {/* ── Time Series Charts ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <Card className="rounded-[2rem] border-transparent bg-[var(--color-surface)] shadow-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest font-bold">Views</p>
                <p className="text-3xl font-black tabular-nums">{totalViews.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                 <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
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

        <Card className="rounded-[2rem] border-transparent bg-[var(--color-surface)] shadow-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest font-bold">New Signups</p>
                <p className="text-3xl font-black tabular-nums">{totalUsers.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                 <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
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

        <Card className="rounded-[2rem] border-transparent bg-[var(--color-surface)] shadow-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest font-bold">Comments</p>
                <p className="text-3xl font-black tabular-nums">{totalComments.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                 <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="comments" name="Comments" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Category Breakdown ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
          <CardContent className="p-6">
             <div className="flex items-center gap-2 mb-6">
               <Layers className="w-5 h-5 text-gray-400" />
               <h3 className="text-sm font-bold text-white uppercase tracking-wider">Articles by Category</h3>
             </div>
             
             {categoryStats.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)] py-4 text-center">No categories yet.</p>
              ) : (
                <div className="space-y-4">
                  {categoryStats.sort((a,b) => b.count - a.count).map((cat, i) => {
                    const pct = Math.round((cat.count / maxCatCount) * 100);
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-white">{cat.name}</span>
                          <span className="text-xs font-bold text-[var(--color-muted)] tabular-nums">
                            {cat.count} article{cat.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
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
             <div className="flex items-center gap-2 mb-6">
               <Eye className="w-5 h-5 text-gray-400" />
               <h3 className="text-sm font-bold text-white uppercase tracking-wider">Views by Category</h3>
             </div>
             
             {categoryStats.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)] py-4 text-center">No categories yet.</p>
              ) : (
                <div className="h-[250px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryStats.filter(c => c.views > 0).sort((a,b) => b.views - a.views)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="views"
                        nameKey="name"
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {categoryStats.every(c => c.views === 0) && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--color-muted)]">No view data</div>
                  )}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
