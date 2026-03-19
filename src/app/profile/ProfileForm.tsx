'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import Link from 'next/link';
import { 
  ShieldCheck, User, Check, 
  BookOpen, Bookmark, MessageSquare, 
  Quote, Highlighter, Lock, Eye, EyeOff, KeyRound,
  Globe, Monitor, Activity
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
    auditLogs: any[];
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

  // password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // password strength
  function getStrength(pw: string) {
    if (!pw) return { score: 0, label: '', color: '' };
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (s <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
    if (s <= 3) return { score: 3, label: 'Good', color: '#3b82f6' };
    return { score: 4, label: 'Strong', color: '#22c55e' };
  }
  const pwStrength = getStrength(newPassword);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    setPwLoading(true);
    // Re-authenticate first with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: '', // will be set from supabase session automatically
      password: currentPassword,
    });

    // Then update password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError || signInError) {
      setPwError(updateError?.message ?? 'Failed to update password. Check your current password.');
      setPwLoading(false);
      return;
    }

    setPwSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwLoading(false);
  }

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
    <div className="space-y-12 pb-[calc(var(--bottom-nav-height)+1rem)]">
      
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

      {/* ── SECURITY / CHANGE PASSWORD ── */}
      <section className="max-w-xl">
        <div className="mb-6">
          <h2 className="text-lg font-black text-[var(--color-text)] uppercase tracking-tight">Security</h2>
          <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mt-1">Update your login password</p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 bg-[var(--color-surface)] p-8 rounded-[2rem] border border-[var(--color-border)]">
          {pwError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
              <ShieldCheck className="w-4 h-4 shrink-0" />{pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[13px] flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
              <Check className="w-4 h-4 shrink-0" />Password updated successfully!
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)]">
              <Lock size={13} strokeWidth={2.5} /> Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                className="w-full h-12 pl-4 pr-12 rounded-2xl bg-[var(--color-surface-2)] border-none text-sm font-bold focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)]">
              <KeyRound size={13} strokeWidth={2.5} /> New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                className="w-full h-12 pl-4 pr-12 rounded-2xl bg-[var(--color-surface-2)] border-none text-sm font-bold focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength bar */}
            {newPassword.length > 0 && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-500"
                      style={{ backgroundColor: i <= pwStrength.score ? pwStrength.color : 'var(--color-border)' }} />
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: pwStrength.color }}>
                  {pwStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)]">
              <ShieldCheck size={13} strokeWidth={2.5} /> Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
              className="w-full h-12 pl-4 pr-4 rounded-2xl bg-[var(--color-surface-2)] border-none text-sm font-bold focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
              className="w-full h-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {pwLoading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <div className="flex items-center gap-2"><Lock size={14} strokeWidth={3} /> Update Password</div>
              }
            </Button>
          </div>

          <p className="text-[11px] font-bold text-[var(--color-muted)] text-center">
            Forgot your current password?{' '}
            <Link href="/forgot-password" className="text-[var(--color-primary)] hover:underline">
              Reset via email
            </Link>
          </p>
        </form>
      </section>

      {/* ── SECURITY HISTORY ── */}
      <section className="max-w-xl">
        <div className="mb-6">
          <h2 className="text-lg font-black text-[var(--color-text)] uppercase tracking-tight">Security History</h2>
          <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest mt-1">Recent account access events</p>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[2rem] border border-[var(--color-border)] overflow-hidden">
          {(!stats.auditLogs || stats.auditLogs.length === 0) ? (
            <div className="p-10 text-center italic text-sm text-[var(--color-muted)] opacity-60">
               No login history found.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {stats.auditLogs.map((log: any, i: number) => (
                <div key={i} className="p-5 flex items-start gap-4 hover:bg-[var(--color-surface-2)] transition-colors">
                   <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 min-w-[44px] min-h-[44px]">
                      <Activity size={18} strokeWidth={2.5} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                           {log.action?.replace('_', ' ') || 'Access'}
                         </span>
                         <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] opacity-50">
                           {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.created_at).toLocaleDateString()}
                         </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                         <div className="flex items-center gap-2">
                            <Globe size={11} className="text-[var(--color-muted)]" />
                            <span className="text-[11px] font-mono font-bold text-[var(--color-text)] opacity-80">{log.ip_address || 'Hidden'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Monitor size={11} className="text-[var(--color-muted)]" />
                           <span className="text-[11px] font-bold text-[var(--color-text)] opacity-80 truncate">{log.user_agent?.split(' ')[0] || 'Unknown'} Browser</span>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
