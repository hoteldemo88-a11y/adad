import clsx from 'clsx';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'chart' | 'stat';
  count?: number;
}

export default function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps) {
  const shimmer = 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%]';

  if (type === 'stat') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count || 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className={clsx(shimmer, 'h-4 w-24 rounded mb-3')} />
            <div className={clsx(shimmer, 'h-8 w-16 rounded mb-2')} />
            <div className={clsx(shimmer, 'h-3 w-32 rounded')} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className={clsx(shimmer, 'h-10 w-64 rounded-lg')} />
        </div>
        {Array.from({ length: count || 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className={clsx(shimmer, 'w-8 h-8 rounded-full')} />
            <div className="flex-1 space-y-2">
              <div className={clsx(shimmer, 'h-4 w-40 rounded')} />
              <div className={clsx(shimmer, 'h-3 w-24 rounded')} />
            </div>
            <div className={clsx(shimmer, 'h-6 w-16 rounded-full')} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className={clsx(shimmer, 'h-5 w-32 rounded mb-4')} />
        <div className={clsx(shimmer, 'h-48 w-full rounded-lg')} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count || 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className={clsx(shimmer, 'h-12 w-12 rounded-lg mb-4')} />
          <div className={clsx(shimmer, 'h-5 w-32 rounded mb-2')} />
          <div className={clsx(shimmer, 'h-4 w-full rounded mb-2')} />
          <div className={clsx(shimmer, 'h-4 w-3/4 rounded')} />
        </div>
      ))}
    </div>
  );
}
