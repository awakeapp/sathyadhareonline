'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ShieldCheck, Mail, User, UserCircle, Upload, Check } from 'lucide-react';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at?: string;
}

interface Props {
  profile: Profile;
  userEmail?: string;
}

export function ProfileForm({ profile: initialProfile, userEmail }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${profile.id}-${Math.random()}.${fileExt}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('article-images') // Reusing article-images bucket since it's already configured
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${new Date().getTime()}`;
      setPreview(avatarUrl);
      
      // Update the profile immediately with the new avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      toast.success('Profile picture updated!');
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      toast.error('Error uploading avatar: ' + msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      toast.error('Error updating profile: ' + msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Avatar Section */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] p-8 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)] mb-6">Profile Picture</h2>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="relative group w-32 h-32">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-[var(--color-background)] bg-gradient-to-br from-[var(--color-primary)] to-amber-400 shadow-xl flex items-center justify-center">
              {preview || profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={preview || profile.avatar_url || ''} 
                  alt={profile.full_name || 'Profile'} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <UserCircle className="w-20 h-20 text-black/60" />
              )}
            </div>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center border-2 border-[var(--color-background)] hover:scale-110 active:scale-95 transition-all shadow-lg shadow-black/20 disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <h3 className="font-bold text-[var(--color-text)]">Change Photo</h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed max-w-[240px]">
              Better an original version of yourself than a copy of someone else. 
              JPG, PNG or GIF. Max size 2MB.
            </p>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleAvatarUpload}
              className="hidden" 
            />
          </div>
        </div>
      </section>

      {/* Basic Info */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] p-8 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)] mb-8">Personal Details</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <User className="w-3.5 h-3.5" /> Full Name
              </Label>
              <Input 
                value={profile.full_name || ''} 
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Janme Jayaswal"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </Label>
              <Input 
                value={userEmail || ''} 
                disabled 
                className="opacity-60 bg-black/5"
              />
              <p className="text-[10px] text-[var(--color-muted)] mt-1.5 font-semibold px-1">
                Email address is derived from your account and cannot be changed here.
              </p>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Account Role
              </Label>
              <div className="inline-flex items-center px-4 py-2 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text)] opacity-80">
                  {profile.role?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                User ID
              </Label>
              <code className="block w-full p-3 bg-black/10 rounded-2xl text-[10px] text-[var(--color-muted)] font-mono break-all border border-[var(--color-border)]/50">
                {profile.id}
              </code>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              disabled={loading}
              variant="primary"
              className="h-12 px-8 rounded-2xl text-black font-bold shadow-lg shadow-[var(--color-primary)]/10"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Save Changes
                </div>
              )}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
