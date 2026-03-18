import { redirect } from 'next/navigation';

export default function BannerVideosRedirect() {
  redirect('/admin/manage?tab=banner');
}
