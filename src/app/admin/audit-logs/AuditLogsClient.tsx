'use client';

import React, { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { toast } from '@/lib/toast';
import { getAuditLogsAction } from './actions';
import { Search, ScrollText, Calendar, ChevronLeft, ChevronRight, User, Eye, FileJson, Download } from 'lucide-react';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

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
  usersList,
  initialLogs = [],
  initialCount = 0
}: {
  usersList: UserOption[];
  initialLogs?: AuditLog[];
  initialCount?: number;
}) {
  const [isPending, startTransition] = useTransition();
  
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [totalCount, setTotalCount] = useState(initialCount);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  
  const [actionSearch, setActionSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const hasMounted = useRef(false);

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
      } catch {
        toast.error('Search Failed');
      }
    });
  }, [page, limit, userFilter, actionSearch, startDate, endDate]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    loadLogs();
  }, [loadLogs]);
  
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

  const exportCSV = async () => {
    setIsExporting(true);
    try {
      // Fetch ALL matching rows (no pagination limit)
      const res = await getAuditLogsAction({
        page: 1,
        limit: 10000,
        userId: userFilter,
        actionSearch,
        startDate,
        endDate,
      });
      const rows = res.logs as unknown as AuditLog[];

      // Build CSV
      const escape = (v: unknown) => {
        const str = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      };

      const header = ['Date', 'Time', 'User', 'Role', 'Action', 'Details'];
      const csvLines = [
        header.join(','),
        ...rows.map(log => {
          const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
          const dt = new Date(log.created_at);
          return [
            escape(dt.toLocaleDateString('en-GB')),
            escape(dt.toLocaleTimeString('en-GB')),
            escape(profile?.full_name || profile?.email || 'Unknown'),
            escape(profile?.role || ''),
            escape(log.action),
            escape(log.details),
          ].join(',');
        }),
      ];

      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} log entries`);
    } catch {
      toast.error('Export failed');
    }
    setIsExporting(false);
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* ── Search Filters ── */}
      <PresenceCard className="bg-zinc-50 dark:bg-white/5 border-none p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col xl:flex-row gap-4 items-end">
          
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Action Type</label>
               <div className="relative">
                 <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" strokeWidth={1.25} />
                 <input 
                   placeholder="e.g. USER_UPGRADE" 
                   value={actionSearch}
                   onChange={(e) => setActionSearch(e.target.value)}
                   className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-xs"
                 />
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Performed By</label>
               <div className="relative">
                 <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" strokeWidth={1.25} />
                 <select 
                   value={userFilter} 
                   onChange={(e) => { setUserFilter(e.target.value); setPage(1); }} 
                   className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-xs appearance-none"
                 >
                   <option value="all">All Users</option>
                   {usersList.map(u => (
                     <option key={u.id} value={u.id}>{u.name || u.email}</option>
                   ))}
                 </select>
               </div>
             </div>
             
             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Start Date</label>
               <div className="relative">
                 <Calendar className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" strokeWidth={1.25} />
                 <input 
                   type="date"
                   value={startDate}
                   onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                   className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-xs text-indigo-400"
                 />
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">End Date</label>
               <div className="relative">
                 <Calendar className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" strokeWidth={1.25} />
                 <input 
                   type="date"
                   value={endDate}
                   onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                   className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-xs text-indigo-400"
                 />
               </div>
             </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <PresenceButton type="submit" className="h-12 px-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20" loading={isPending}>
               Search Logs
            </PresenceButton>
            <button
              type="button"
              onClick={exportCSV}
              disabled={isExporting || isPending}
              className="h-12 px-5 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-100 dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-40 flex items-center gap-2"
              title="Export filtered logs as CSV"
            >
              <Download className="w-4 h-4" strokeWidth={2} />
              {isExporting ? 'Exporting…' : 'CSV'}
            </button>
          </div>
        </form>
      </PresenceCard>

      {/* ── Audit Logs ── */}
      <PresenceCard noPadding className="overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
           <table className="w-full text-left text-xs whitespace-nowrap">
             <thead>
               <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-indigo-50 dark:border-white/5 font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                 <th className="px-4 py-5 text-[10px]">Date / Time</th>
                 <th className="px-4 py-5 text-[10px]">User</th>
                 <th className="px-4 py-5 text-[10px]">Action</th>
                 <th className="px-4 py-5 text-[10px] text-right">Details</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-indigo-50 dark:divide-white/5">
               {isPending && logs.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="py-24 text-center">
                       <div className="w-12 h-12 rounded-2xl border-4 border-indigo-100 border-t-[#5c4ae4] animate-spin mx-auto mb-4"></div>
                       <p className="text-zinc-400 font-black uppercase tracking-widest text-[10px]">Loading Logs...</p>
                    </td>
                 </tr>
               ) : logs.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="py-24 text-center">
                       <ScrollText className="w-16 h-16 text-indigo-50 dark:text-white/5 mx-auto mb-5" />
                       <p className="font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">No Logs Found</p>
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">No activity records found</p>
                    </td>
                 </tr>
               ) : (
                 logs.map((log) => {
                   const isExpanded = expandedRows.has(log.id);
                   const hasDetails = log.details && Object.keys(log.details).length > 0;
                   const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
                   const actorName = profile?.full_name || profile?.email || 'System Unknown';
                   const actorInitial = actorName.charAt(0).toUpperCase();

                   return (
                     <React.Fragment key={log.id}>
                       <tr className={`group transition-all hover:bg-gray-50/50 dark:hover:bg-white/5 ${isExpanded ? 'bg-indigo-50/30' : ''}`}>
                         <td className="px-4 py-5 font-black tabular-nums text-zinc-500">
                           {new Date(log.created_at).toLocaleString('en-GB', {
                             day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
                           })}
                         </td>
                         <td className="px-4 py-5">
                           <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-zinc-900 dark:text-zinc-50 font-black text-xs shrink-0 min-w-[44px] min-h-[44px]">
                               {actorInitial}
                             </div>
                             <div>
                               <p className="font-black text-zinc-900 dark:text-zinc-50 text-sm">{actorName}</p>
                               {profile?.role && <span className="text-[9px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50 opacity-60 block mt-1">{profile.role}</span>}
                             </div>
                           </div>
                         </td>
                         <td className="px-4 py-5">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse"></div>
                             <span className="font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                               {log.action.replace(/_/g, ' ')}
                             </span>
                           </div>
                         </td>
                         <td className="px-4 py-5 text-right">
                           {hasDetails ? (
                             <button 
                               onClick={() => toggleExpand(log.id)}
                               className={`h-9 px-5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isExpanded ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-white shadow-lg' : 'bg-white dark:bg-zinc-950 text-zinc-500 hover:text-zinc-900 dark:text-zinc-50 shadow-sm'}`}
                             >
                                <Eye className="w-3 h-3 inline mr-2" strokeWidth={1.25} /> {isExpanded ? 'Hide' : 'View'}
                             </button>
                           ) : (
                             <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">No Details</span>
                           )}
                         </td>
                       </tr>
                       {isExpanded && hasDetails && (
                         <tr className="bg-white/40 dark:bg-black/40">
                           <td colSpan={4} className="px-4 py-6 font-mono text-[11px] relative">
                             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"></div>
                             <div className="flex gap-4">
                                <FileJson className="w-5 h-5 text-zinc-900 dark:text-zinc-50 mt-1 shrink-0" strokeWidth={1.25} />
                                <pre className="p-4 rounded-2xl bg-[#0d0c13] text-indigo-300 overflow-x-auto w-full shadow-2xl border border-white/5 border-l-4 border-l-indigo-500/50">
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

        {/* ── Pagination ── */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30 dark:bg-white/5 border-t border-indigo-50 dark:border-white/5">
           <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Logs per page</span>
             <select 
               value={limit} 
               onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} 
               className="h-10 px-4 rounded-xl bg-white dark:bg-zinc-950 border-none shadow-sm text-[10px] font-black text-zinc-900 dark:text-zinc-50"
             >
               <option value={10}>10</option>
               <option value={20}>20</option>
               <option value={50}>50</option>
               <option value={100}>100</option>
             </select>
           </div>
           
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                 Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} — {Math.min(page * limit, totalCount)} <span className="mx-2 text-indigo-100">|</span> Total {totalCount}
              </span>
             <div className="flex gap-3">
                <button 
                  onClick={() => setPage(Math.max(1, page - 1))} 
                  disabled={page <= 1 || isPending}
                  className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-950 text-zinc-400 hover:text-zinc-900 dark:text-zinc-50 disabled:opacity-30 shadow-sm border-none flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-5 h-5" strokeWidth={1.25} />
                </button>
                <div className="w-11 h-11 flex items-center justify-center font-black text-xs text-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl shadow-lg shadow-indigo-500/20">
                  {page}
                </div>
                <button 
                  onClick={() => setPage(Math.min(totalPages, page + 1))} 
                  disabled={page >= totalPages || isPending}
                  className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-950 text-zinc-400 hover:text-zinc-900 dark:text-zinc-50 disabled:opacity-30 shadow-sm border-none flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-5 h-5" strokeWidth={1.25} />
                </button>
             </div>
           </div>
        </div>
      </PresenceCard>
    </div>
  );
}
