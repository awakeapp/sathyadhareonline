import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function approveComment(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const supabase = await createClient();
  await supabase.from('comments').update({ status: 'approved' }).eq('id', id);
  revalidatePath('/admin/comments');
  redirect('/admin/comments');
}

async function rejectComment(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const supabase = await createClient();
  await supabase.from('comments').update({ status: 'rejected' }).eq('id', id);
  revalidatePath('/admin/comments');
  redirect('/admin/comments');
}

async function deleteComment(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const supabase = await createClient();
  await supabase.from('comments').delete().eq('id', id);
  revalidatePath('/admin/comments');
  redirect('/admin/comments');
}

export default async function AdminCommentsPage() {
  const supabase = await createClient();

  const { data: comments, error } = await supabase
    .from('comments')
    .select('id, article_id, guest_name, user_id, content, status, created_at')
    .order('created_at', { ascending: false });

  if (error) console.error(error);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Comment Moderation</h1>

      {!comments?.length ? (
        <p style={{ color: '#888' }}>No comments found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
              <th style={th}>Author</th>
              <th style={th}>Article ID</th>
              <th style={th}>Content</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((c) => (
              <tr key={c.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={td}>{c.guest_name || c.user_id || '—'}</td>
                <td style={{ ...td, fontSize: 12, color: '#888', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.article_id}</td>
                <td style={{ ...td, maxWidth: 260 }}>{c.content}</td>
                <td style={td}>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: c.status === 'approved' ? '#d1fae5' : c.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                    color: c.status === 'approved' ? '#065f46' : c.status === 'rejected' ? '#991b1b' : '#713f12',
                  }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  {c.status === 'pending' && (
                    <>
                      <form action={approveComment} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" style={btnGreen}>Approve</button>
                      </form>
                      <form action={rejectComment} style={{ display: 'inline', marginLeft: 6 }}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" style={btnGray}>Reject</button>
                      </form>
                    </>
                  )}
                  <form action={deleteComment} style={{ display: 'inline', marginLeft: 6 }}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" style={btnRed}>Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '10px 14px', fontSize: 14, verticalAlign: 'top' };
const btnGreen: React.CSSProperties = { padding: '4px 10px', borderRadius: 6, border: 'none', background: '#d1fae5', color: '#065f46', fontWeight: 600, cursor: 'pointer', fontSize: 12 };
const btnGray: React.CSSProperties = { padding: '4px 10px', borderRadius: 6, border: 'none', background: '#e5e7eb', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 12 };
const btnRed: React.CSSProperties = { padding: '4px 10px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#991b1b', fontWeight: 600, cursor: 'pointer', fontSize: 12 };
