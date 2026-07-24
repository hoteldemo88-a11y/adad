import { FolderOpenIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  message?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ElementType;
}

export default function EmptyState({ message = 'No data found', action, icon: Icon = FolderOpenIcon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{message}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">There's nothing to show here right now.</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
