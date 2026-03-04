export default function Loading() {
  return (
    <main className="max-w-5xl mx-auto p-6 md:p-10 font-sans min-h-screen">
      {/* Page Header Skeleton */}
      <div className="animate-pulse mb-12">
        <div className="h-10 bg-gray-200 rounded-lg w-2/3 md:w-1/3 mb-4"></div>
        <div className="h-5 bg-gray-100 rounded-md w-full max-w-lg"></div>
        <div className="h-5 bg-gray-100 rounded-md w-3/4 max-w-sm mt-3"></div>
      </div>

      {/* Hero / Featured Article Skeleton */}
      <div className="w-full h-64 md:h-96 bg-gray-200 rounded-3xl animate-pulse mb-16 shadow-sm"></div>

      {/* Grid Header */}
      <div className="animate-pulse flex items-center justify-between mb-8 border-b-2 border-gray-100 pb-2">
        <div className="h-8 bg-gray-200 rounded-md w-32"></div>
        <div className="h-5 bg-gray-100 rounded-md w-20"></div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col bg-white rounded-xl border border-gray-100 p-4 shadow-sm h-full animate-pulse">
            {/* Image placeholder */}
            <div className="w-full h-40 bg-gray-200 rounded-lg mb-4"></div>
            
            {/* Title placeholder */}
            <div className="h-6 bg-gray-200 rounded-md w-full mb-2.5"></div>
            <div className="h-6 bg-gray-200 rounded-md w-4/5 mb-4"></div>
            
            {/* Excerpt lines */}
            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3 mt-auto"></div>
          </div>
        ))}
      </div>
    </main>
  );
}
