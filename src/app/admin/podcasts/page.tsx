import { redirect } from 'next/navigation';

export default function PodcastsRedirect() {
  redirect('/admin/manage?tab=podcast');
}
