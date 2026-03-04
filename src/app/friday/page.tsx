import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function FridayPage() {
  const supabase = await createClient();

  const { data: message, error } = await supabase
    .from('friday_messages')
    .select('title, image_url, message_text, created_at')
    .eq('is_published', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching friday message:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Friday Reflections
        </h1>
        <p className="mt-4 text-xl text-gray-500">
          Weekly words of wisdom and spiritual reminders.
        </p>
      </div>

      {!message ? (
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No message available yet</h3>
          <p className="text-gray-500">Check back later for our new weekly update.</p>
        </div>
      ) : (
        <article className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl">
          {message.image_url && (
            <div className="relative w-full h-64 md:h-96">
              <img 
                src={message.image_url} 
                alt={message.title || 'Friday Message'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              {message.title && (
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                    {message.title}
                  </h2>
                </div>
              )}
            </div>
          )}
          
          <div className="p-8 md:p-12">
            {!message.image_url && message.title && (
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                {message.title}
              </h2>
            )}
            
            <div className="prose prose-lg md:prose-xl prose-indigo max-w-none text-gray-700 whitespace-pre-wrap font-serif leading-relaxed text-center">
              <p>{message.message_text}</p>
            </div>
            
            <div className="mt-12 flex items-center justify-center">
              <span className="h-px w-16 bg-indigo-200"></span>
              <span className="mx-4 text-indigo-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
              <span className="h-px w-16 bg-indigo-200"></span>
            </div>
          </div>
        </article>
      )}

      <div className="mt-12 text-center">
        <Link 
          href="/"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
