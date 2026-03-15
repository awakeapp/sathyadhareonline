'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  ShieldCheck, User, Check, 
  BookOpen, Bookmark, MessageSquare, 
  Quote, Highlighter
} from 'lucide-react';
import ReadingStreak from '@/components/ReadingStreak';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ProfileFormProps {
  profile: {
    id: string;
    full_name: string | null;
    role: string;
    avatar_url: string | null;
    bio: string | null;
    reading_streak: number;
  };
  stats: {
    articlesRead: number;
    bookmarks: number;
    comments: number;
    highlights: number;
  };
  userEmail?: string;
}

export default function ProfileForm({ profile: initialProfile, stats }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [isPending, startTransition] = useTransition();

  const [profile, setProfile] = useState(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.full_name || '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  // Use a generated avatar from DiceBear
  const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: fullName,
        bio: bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      setProfile(prev => ({ ...prev, full_name: fullName, bio: bio }));
      router.refresh();
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-12 pb-20">
      
      {/* ── PROFILE HEADER & STREAK ── */}
      <section className="flex flex-col items-center sm:flex-row sm:items-end gap-6 mb-12">
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={avatarUrl} 
            alt={profile.full_name || 'User'} 
            className="w-32 h-32 rounded-[2.5rem] bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-sm object-cover"
          />
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
          <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight truncate w-full">{profile.full_name || 'Reader'}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap justify-center sm:justify-start">
            <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
              <ShieldCheck size={10} strokeWidth={3} />
              {profile.role}
            </div>
            <ReadingStreak streak={profile.reading_streak || 0} />
          </div>
        </div>
      </section>

      {/* ── STATS GRID ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/profile/history" className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center text-center hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group active:scale-95">
          <BookOpen className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-xl font-black text-[var(--color-text)]">{stats.articlesRead}</span>
          <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-widest mt-1">History</span>
        </Link>
        <Link href="/saved" className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center text-center hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group active:scale-95">
          <Bookmark className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-xl font-black text-[var(--color-text)]">{stats.bookmarks}</span>
          <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-widest mt-1">Saved</span>
        </Link>
        <Link href="/profile/comments" className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center text-center hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all group active:scale-95">
          <MessageSquare className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-xl font-black text-[var(--color-text)]">{stats.comments}</span>
          <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-widest mt-1">Comments</span>
        </Link>
        <Link href="/highlights" className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center text-center hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-orange-500/5 transition-all group active:scale-95">
          <Highlighter className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-xl font-black text-[var(--color-text)]">{stats.highlights}</span>
          <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-widest mt-1">Highlights</span>
        </Link>
      </section>

      {/* ── EDIT FORM ── */}
      <section className="max-w-xl">
        <div className="mb-6">
          <h2 className="text-lg font-black text-[var(--color-text)] uppercase tracking-tight">Account Settings</h2>
          <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mt-1">Manage your identity and bio</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6 bg-[var(--color-surface)] p-8 rounded-[2rem] border border-[var(--color-border)]">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 mb-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)]">
              <User size={13} strokeWidth={2.5} /> Full Name
            </Label>
            <Input 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Display Name"
              className="h-14 rounded-2xl bg-[var(--color-surface-2)] border-none text-sm font-bold focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 mb-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)]">
              <Quote size={13} strokeWidth={2.5} /> Short Bio
            </Label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full p-4 rounded-2xl bg-[var(--color-surface-2)] border-none text-sm font-bold focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none resize-none"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <Button 
              type="submit" 
              disabled={isSaving}
              className="w-full flex-[2] h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-[var(--color-text)] text-[var(--color-surface)] hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-[var(--color-surface)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Check size={16} strokeWidth={3} />
                  Save Changes
                </div>
              )}
            </Button>
            <Button asChild variant="outline" className="w-full flex-1 h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]">
              <Link href="/profile/analytics">
                Analytics
              </Link>
            </Button>
          </div>
        </form>
      </section>

    </div>
  );
}
