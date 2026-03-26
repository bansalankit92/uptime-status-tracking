import clsx from 'clsx';

const statusConfig = {
  up: { label: 'Operational', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  down: { label: 'Down', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  degraded: { label: 'Degraded', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  unknown: { label: 'Unknown', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.bg, config.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
