'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, Clock, FileText, 
  Layers, BookOpen, User, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  PresenceCard, 
} from '@/components/PresenceUI';
import { setArticleStatusAction } from '../articles/actions';
import { setSequelStatusAction } from '../sequels/actions';
import { setBookStatusAction } from '../library/actions';

interface Submission {
  id: string;
  title: string;
  type: 'article' | 'sequel' | 'book' | 'guest';
  author: string;
  created_at: string;
  slug?: string;
  excerpt?: string;
  id_ref?: string; // id for internal items
}

export default function SubmissionsClient({ 
  staffItems, 
  guestItems 
}: { 
  staffItems: Submission[], 
  guestItems: Submission[] 
}) {
  const [activeTab, setActiveTab] = useState<'staff' | 'guest'>('staff');
  const [isPending, startTransition] = useTransition();

  const handlePublish = async (id: string, type: string) => {
    startTransition(async () => {
      let res;
      if (type === 'article') {
        res = await setArticleStatusAction(id, 'published');
      } else if (type === 'sequel') {
        res = await setSequelStatusAction(id, 'published');
      } else if (type === 'book') {
        res = await setBookStatusAction(id, 'published');
      } else {
        toast.error('Action not implemented yet for this type');
        return;
      }

      if (res?.success) {
        toast.success(`Successfully published ${type}`);
      } else {
        toast.error(res?.error || 'Failed to publish');
      }
    });
  };

  const renderItem = (item: Submission) => {
    const Icon = {
      article: FileText,
      sequel: Layers,
      book: BookOpen,
      guest: Mail
    }[item.type];

    return (
      <PresenceCard key={item.id} noPadding className="group overflow-hidden">
        <div className="flex items-stretch min-h-[100px]">
          <div className={`w-1.5 shrink-0 ${item.type === 'guest' ? 'bg-indigo-300' : 'bg-amber-400'}`} />
          
          <div className="flex-1 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-50 shrink-0">
                <Icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-lg tracking-tight truncate group-hover:text-indigo-600 transition-colors uppercase">{item.title}</h3>
                <div className="flex items-center justify-center md:justify-start gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <User className="w-3 h-3" /> {item.author}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${item.type === 'guest' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 'bg-amber-50 border-amber-100 text-amber-500'}`}>
                    {item.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link href={item.type === 'guest' ? `/admin/submissions/${item.id}` : `/admin/${item.type}s/${item.id}/edit`}>
                <button className="h-10 px-5 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-900 dark:text-zinc-50 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:text-white transition-all shadow-sm">
                  Review
                </button>
              </Link>
              
              {item.type !== 'guest' && (
                <button 
                  disabled={isPending}
                  onClick={() => handlePublish(item.id, item.type)}
                  className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </PresenceCard>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center p-1 bg-zinc-100 dark:bg-white/5 rounded-2xl w-max mx-auto md:mx-0">
        <button 
          onClick={() => setActiveTab('staff')}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'staff' ? 'bg-white dark:bg-zinc-900 shadow-sm text-indigo-600' : 'text-zinc-400'}`}
        >
          Staff Review ({staffItems.length})
        </button>
        <button 
          onClick={() => setActiveTab('guest')}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'guest' ? 'bg-white dark:bg-zinc-900 shadow-sm text-indigo-600' : 'text-zinc-400'}`}
        >
          Guest Pitch ({guestItems.length})
        </button>
      </div>

      <div className="space-y-4">
        {(activeTab === 'staff' ? staffItems : guestItems).length === 0 ? (
          <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
            <Clock className="w-16 h-16 mb-5 text-indigo-100" />
            <p className="font-black text-xl text-zinc-400 uppercase tracking-widest text-indigo-200">The queue is empty</p>
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-2">{activeTab === 'staff' ? 'No internal items waiting for review.' : 'No guest submissions found.'}</p>
          </PresenceCard>
        ) : (
          (activeTab === 'staff' ? staffItems : guestItems).map(renderItem)
        )}
      </div>
    </div>
  );
}
