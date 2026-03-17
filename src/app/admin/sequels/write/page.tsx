import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SequelBundleEditor from '@/components/admin/SequelBundleEditor';
import { saveSequelBundleAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminSequelWritePage() {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // 2. Profile / Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  const role = profile?.role || 'reader';

  if (!['admin', 'super_admin', 'editor'].includes(role)) {
    redirect('/');
  }

  // 3. Fetch categories (Article vs Sequel)
  const { data: articleCategories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'article')
    .order('name');

  const { data: sequelCategories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'sequel')
    .order('name');

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-background)] overflow-y-auto">
      <SequelBundleEditor 
        categories={articleCategories || []}
        sequelCategories={sequelCategories || []}
        role={role as any}
        onSave={saveSequelBundleAction}
        onBack={() => {}} // Component handles back internally or via useRouter
        initialData={{
          title: '',
          description: '',
          bannerUrl: '',
          categoryId: '',
          publishDate: new Date().toISOString(),
          articles: []
        }}
      />
    </div>
  );
}
