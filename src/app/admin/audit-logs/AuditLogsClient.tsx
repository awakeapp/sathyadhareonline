'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { toast } from 'sonner';
import { getAuditLogsAction } from './actions';
import { Search, ScrollText, Calendar, ChevronLeft, ChevronRight, User, Eye, Activity, FileJson } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  profiles: {
    email?: string;
    full_name?: string;
    role?: string;
  } | {
    email?: string;
    full_name?: string;
    role?: string;
  }[] | null;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export default function AuditLogsClient({
  usersList
}: {
  usersList: UserOption[]
}) {
  const [isPending, startTransition] = useTransition();
  
  // Data State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  
  // Filter State
  const [actionSearch, setActionSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expanded details rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const loadLogs = useCallback(() => {
    startTransition(async () => {
      try {
        const res = await getAuditLogsAction({
          page,
          limit,
          userId: userFilter,
          actionSearch,
          startDate,
          endDate
        });
        setLogs(res.logs as unknown as AuditLog[]);
        setTotalCount(res.count || 0);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to fetch logs');
      }
    });
  }, [page, limit, userFilter, actionSearch, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);
  
  // Separate submit for text search since we don't want it typing debounce-firing heavily right now.
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      
      {/* ── Control Bar ──────────────────────────────────────────────── */}
      <Card className="rounded-3xl shadow-none border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <form onSubmit={handleSearchSubmit} className="p-4 sm:p-5 flex flex-col xl:flex-row gap-4 items-end xl:items-center">
          
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Action Search */}
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-muted)]">Search Action</label>
               <div className="relative">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                 <Input 
                   placeholder="e.g. USER_LOGIN" 
                   value={actionSearch}
                   onChange={(e) => setActionSearch(e.target.value)}
                   className="pl-9 h-10 w-full bg-black/20 text-sm"
                 />
               </div>
             </div>

             {/* User Filter */}
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-muted)]">Filter by User</label>
               <div className="relative">
                 <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                 <Select 
                   value={userFilter} 
                   onChange={(e) => { setUserFilter(e.target.value); setPage(1); }} 
                   className="pl-9 h-10 w-full bg-black/20 text-sm"
                 >
                   <option value="all">All Users</option>
                   {usersList.map(u => (
                     <option key={u.id} value={u.id}>{u.name || u.email}</option>
                   ))}
                 </Select>
               </div>
             </div>
             
             {/* Date Start */}
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-muted)]">Start Date</label>
               <div className="relative">
                 <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                 <input 
                   type="date"
                   value={startDate}
                   onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                   className="pl-9 pr-3 h-10 w-full rounded-xl bg-black/20 border border-[var(--color-border)] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                 />
               </div>
             </div>

             {/* Date End */}
             <div className="space-y-1.5">
               <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-muted)]">End Date</label>
               <div className="relative">
                 <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                 <input 
                   type="date"
                   value={endDate}
                   onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                   className="pl-9 pr-3 h-10 w-full rounded-xl bg-black/20 border border-[var(--color-border)] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                 />
               </div>
             </div>
          </div>

          <Button type="submit" className="h-10 px-6 rounded-xl font-bold bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90 shrink-0 shadow-md w-full xl:w-auto" loading={isPending}>
             Apply Filters
          </Button>
        </form>
      </Card>

      {/* ── Table Area ──────────────────────────────────────────────── */}
      <Card className="rounded-3xl shadow-none border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
           <table className="w-full text-left text-sm whitespace-nowrap">
             <thead>
               <tr className="border-b border-[var(--color-border)] bg-black/20">
                 <th className="px-5 py-4 font-bold text-[var(--color-muted)] uppercase tracking-wider text-[10px]">Timestamp</th>
                 <th className="px-5 py-4 font-bold text-[var(--color-muted)] uppercase tracking-wider text-[10px]">Actor (User)</th>
                 <th className="px-5 py-4 font-bold text-[var(--color-muted)] uppercase tracking-wider text-[10px]">Action Type</th>
                 <th className="px-5 py-4 font-bold text-[var(--color-muted)] uppercase tracking-wider text-[10px] text-right">Details</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[var(--color-border)]">
               {isPending && logs.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="py-20 text-center">
                       <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] animate-spin mx-auto"></div>
                       <p className="text-[var(--color-muted)] text-xs mt-3 font-semibold uppercase tracking-widest">Scanning Logs...</p>
                    </td>
                 </tr>
               ) : logs.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="py-24 text-center">
                       <ScrollText className="w-12 h-12 opacity-20 text-[var(--color-muted)] mx-auto mb-4" />
                       <p className="font-bold text-white text-lg">No log entries found</p>
                       <p className="text-[var(--color-muted)] text-sm mt-1">Try adjusting the filter parameters.</p>
                    </td>
                 </tr>
               ) : (
                 logs.map((log) => {
                   const isExpanded = expandedRows.has(log.id);
                   const hasDetails = log.details && Object.keys(log.details).length > 0;
                   return (
                     <React.Fragment key={log.id}>
                       <tr className="hover:bg-white/5 transition-colors group">
                         <td className="px-5 py-4 text-xs tabular-nums text-[var(--color-muted)] font-medium">
                           {new Date(log.created_at).toLocaleString('en-US', {
                             month: 'short', day: '2-digit', year: 'numeric',
                             hour: '2-digit', minute: '2-digit', second: '2-digit'
                           })}
                         </td>
                         <td className="px-5 py-4">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs uppercase shrink-0">
                               {Array.isArray(log.profiles) ? (log.profiles[0]?.full_name || log.profiles[0]?.email || '?').charAt(0) : (log.profiles?.full_name || log.profiles?.email || '?').charAt(0)}
                             </div>
                             <div>
                               <p className="font-bold text-white leading-none text-sm">{Array.isArray(log.profiles) ? (log.profiles[0]?.full_name || log.profiles[0]?.email || 'Unknown User') : (log.profiles?.full_name || log.profiles?.email || 'Unknown User')}</p>
                               {Array.isArray(log.profiles) ? (log.profiles[0]?.role && <span className="text-[9px] uppercase tracking-widest text-[var(--color-muted)] block mt-1 leading-none">{log.profiles[0].role}</span>) : (log.profiles?.role && <span className="text-[9px] uppercase tracking-widest text-[var(--color-muted)] block mt-1 leading-none">{log.profiles.role}</span>)}
                             </div>
                           </div>
                         </td>
                         <td className="px-5 py-4">
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                             <Activity className="w-3 h-3" /> {log.action.replace(/_/g, ' ')}
                           </span>
                         </td>
                         <td className="px-5 py-4 text-right">
                           {hasDetails ? (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               onClick={() => toggleExpand(log.id)}
                               className={`h-7 px-3 text-xs rounded-lg transition-all ${isExpanded ? 'bg-[var(--color-primary)] text-black border-transparent hover:bg-[var(--color-primary)]/90' : 'bg-black/20 text-[var(--color-muted)] border-[var(--color-border)] hover:text-white hover:border-white/20'}`}
                             >
                                <Eye className="w-3 h-3 mr-1.5" /> {isExpanded ? 'Hide' : 'Inspect'}
                             </Button>
                           ) : (
                             <span className="text-[10px] text-[var(--color-muted)] font-semibold uppercase tracking-widest opacity-50 px-3">No payload</span>
                           )}
                         </td>
                       </tr>
                       {isExpanded && hasDetails && (
                         <tr className="bg-black/40 shadow-inner">
                           <td colSpan={4} className="px-5 py-4 relative">
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary)] opacity-50"></div>
                             <div className="flex gap-3">
                                <FileJson className="w-4 h-4 text-[var(--color-primary)] mt-1 opacity-60 shrink-0" />
                                <pre className="text-xs text-[#a0a0b0] font-mono leading-relaxed bg-[#0d0c13] p-4 rounded-xl shadow-inner border border-white/5 overflow-x-auto w-full">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                             </div>
                           </td>
                         </tr>
                       )}
                     </React.Fragment>
                   );
                 })
               )}
             </tbody>
           </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────── */}
        <div className="p-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/20">
           <div className="flex items-center gap-3">
             <span className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider">Rows per page:</span>
             <Select 
               value={limit} 
               onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} 
               className="h-8 py-0 px-2 text-xs w-[70px] bg-black/30 border border-[var(--color-border)]"
             >
               <option value={10}>10</option>
               <option value={20}>20</option>
               <option value={50}>50</option>
               <option value={100}>100</option>
             </Select>
           </div>
           
           <div className="flex items-center gap-4">
             <span className="text-xs text-[var(--color-muted)] font-bold tracking-wider">
               Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalCount)} of {totalCount} entries
             </span>
             <div className="flex gap-1.5">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setPage(typeof page === 'number' ? Math.max(1, page - 1) : 1)} 
                  disabled={page <= 1 || isPending}
                  className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="w-8 h-8 flex items-center justify-center font-black text-xs text-white bg-black/30 rounded-lg border border-[var(--color-border)]">
                  {page}
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setPage(typeof page === 'number' ? Math.min(totalPages, page + 1) : page)} 
                  disabled={page >= totalPages || isPending}
                  className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)] disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
             </div>
           </div>
        </div>
      </Card>
    </div>
  );
}
