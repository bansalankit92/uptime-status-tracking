import { useApi } from '../lib/hooks.js';
import { Card, CardBody } from '../components/Card.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Link } from 'react-router-dom';

interface MonitorSummary {
  id: number;
  name: string;
  type: string;
  currentStatus: string;
  lastCheckedAt: string | null;
  lastResponseTimeMs: number | null;
}

export function DashboardOverview() {
  const { data: monitors, loading } = useApi<MonitorSummary[]>('/monitors');

  const upCount = monitors?.filter((m) => m.currentStatus === 'up').length || 0;
  const downCount = monitors?.filter((m) => m.currentStatus === 'down').length || 0;
  const totalCount = monitors?.length || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardBody>
            <div className="text-sm text-gray-500">Total Monitors</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{totalCount}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-gray-500">Up</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{upCount}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-gray-500">Down</div>
            <div className="text-3xl font-bold text-red-600 mt-1">{downCount}</div>
          </CardBody>
        </Card>
      </div>

      {/* Monitors list */}
      <Card>
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Monitors</h2>
          <Link to="/monitors/new" className="text-sm text-blue-600 hover:text-blue-800">+ Add Monitor</Link>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : !monitors?.length ? (
          <div className="p-10 text-center text-gray-400">
            No monitors yet. <Link to="/monitors/new" className="text-blue-600">Create one</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {monitors.map((m) => (
              <Link
                key={m.id}
                to={`/monitors/${m.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={m.currentStatus} />
                  <span className="font-medium text-sm text-gray-900">{m.name}</span>
                  <span className="text-xs text-gray-400 uppercase">{m.type}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {m.lastResponseTimeMs != null && <span>{Math.round(m.lastResponseTimeMs)}ms</span>}
                  {m.lastCheckedAt && <span>{new Date(m.lastCheckedAt).toLocaleTimeString()}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
