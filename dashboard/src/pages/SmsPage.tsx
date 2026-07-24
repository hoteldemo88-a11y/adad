import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { useSms } from '../hooks/useSms';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const typeBadge: Record<string, { bg: string; text: string; label: string }> = {
  received: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Received' },
  sent: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Sent' },
};

export default function SmsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useSms({ page, search, type: typeFilter, startDate: startDate || undefined, endDate: endDate || undefined });
  const messages = data?.data || [];

  const exportCSV = () => {
    setDownloading(true);
    const headers = ['Sender', 'Recipient', 'Message', 'Type', 'Date'];
    const rows = messages.map((m) => [m.sender, m.recipient, m.body, m.type, m.timestamp]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sms-messages.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SMS messages exported');
    setTimeout(() => setDownloading(false), 1000);
  };

  const columns = [
    {
      key: 'sender',
      header: 'Contact',
      sortable: true,
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">{item.sender?.charAt(0) || '?'}</span>
          </div>
          <span className="font-medium">{item.sender}</span>
        </div>
      ),
    },
    { key: 'body', header: 'Message', render: (item: any) => <span className="text-gray-600 dark:text-gray-400 truncate max-w-xs block">{item.body}</span> },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (item: any) => {
        const badge = typeBadge[item.type] || typeBadge.received;
        return <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', badge.bg, badge.text)}>{badge.label}</span>;
      },
    },
    { key: 'timestamp', header: 'Date', sortable: true, render: (item: any) => format(new Date(item.timestamp), 'MMM d, yyyy HH:mm') },
  ];

  return (
    <div>
      <PageHeader
        title="SMS Messages"
        subtitle={`${data?.total || 0} messages`}
        actions={
          <button onClick={exportCSV} disabled={downloading} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            <ArrowDownTrayIcon className="w-4 h-4" />
            {downloading ? 'Exporting...' : 'Export CSV'}
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Types</option>
          <option value="received">Received</option>
          <option value="sent">Sent</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <DataTable
        columns={columns}
        data={messages}
        isLoading={isLoading}
        totalItems={data?.total || 0}
        currentPage={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search messages..."
        keyExtractor={(item) => item.id}
        emptyMessage="No SMS messages found"
      />
    </div>
  );
}
