import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import { Card, CardBody, CardHeader } from '../components/Card.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Button } from '../components/Button.js';
import { useState } from 'react';

interface MonitorDetail {
  id: number;
  name: string;
  type: string;
  url: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  enabled: boolean;
  currentStatus: string;
  intervalSeconds: number;
  timeoutMs: number;
  retryCount: number;
  retryDelaySeconds: number;
  lastCheckedAt: string | null;
  lastResponseTimeMs: number | null;
  lastError: string | null;
  consecutiveFailures: number;
  createdAt: string;
  headers: { key: string; value: string }[];
  tags: { id: number; name: string; color: string | null }[];
}

interface CheckResult {
  id: number;
  status: string;
  responseTimeMs: number | null;
  statusCode: number | null;
  error: string | null;
  checkedAt: string;
}

interface UptimeData {
  uptimePercentage: number;
  days: number;
  dailyRollups: {
    date: string;
    uptimePercentage: number;
    dominantStatus: string;
    avgResponseTimeMs: number | null;
  }[];
}

export function MonitorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: monitor, loading, refetch } = useApi<MonitorDetail>(`/monitors/${id}`);
  const { data: results } = useApi<CheckResult[]>(`/monitors/${id}/results?limit=20`);
  const { data: uptime } = useApi<UptimeData>(`/monitors/${id}/uptime?days=30`);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this monitor? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/monitors/${id}`);
      navigate('/monitors');
    } catch {
      setDeleting(false);
    }
  };

  const handleToggle = async () => {
    await api.patch(`/monitors/${id}/toggle`);
    refetch();
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading...</div>;
  if (!monitor) return <div className="p-10 text-center text-gray-400">Monitor not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/monitors" className="text-sm text-gray-500 hover:text-gray-700">&larr; Monitors</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{monitor.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleToggle}>
            {monitor.enabled ? 'Pause' : 'Resume'}
          </Button>
          <Link to={`/monitors/${id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            Delete
          </Button>
        </div>
      </div>

      {/* Status + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="text-sm text-gray-500 mb-2">Status</div>
            <StatusBadge status={monitor.currentStatus} />
            {monitor.lastError && (
              <p className="mt-2 text-xs text-red-600 break-all">{monitor.lastError}</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-gray-500 mb-1">Response Time</div>
            <div className="text-2xl font-bold text-gray-900">
              {monitor.lastResponseTimeMs != null ? `${Math.round(monitor.lastResponseTimeMs)}ms` : '—'}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-gray-500 mb-1">Uptime (30d)</div>
            <div className="text-2xl font-bold text-gray-900">
              {uptime ? `${uptime.uptimePercentage.toFixed(2)}%` : '—'}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Config */}
      <Card className="mb-6">
        <CardHeader><h2 className="font-semibold text-gray-900">Configuration</h2></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Type</div>
              <div className="font-medium">{monitor.type.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-gray-500">Target</div>
              <div className="font-medium truncate">{monitor.url || `${monitor.smtpHost}:${monitor.smtpPort}`}</div>
            </div>
            <div>
              <div className="text-gray-500">Interval</div>
              <div className="font-medium">{monitor.intervalSeconds}s</div>
            </div>
            <div>
              <div className="text-gray-500">Timeout</div>
              <div className="font-medium">{monitor.timeoutMs}ms</div>
            </div>
            <div>
              <div className="text-gray-500">Retries</div>
              <div className="font-medium">{monitor.retryCount}</div>
            </div>
            <div>
              <div className="text-gray-500">Failures</div>
              <div className="font-medium">{monitor.consecutiveFailures}</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recent checks */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Recent Checks</h2></CardHeader>
        {!results?.length ? (
          <div className="p-6 text-center text-gray-400 text-sm">No check results yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  {r.statusCode && <span className="text-gray-500">HTTP {r.statusCode}</span>}
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  {r.responseTimeMs != null && <span>{Math.round(r.responseTimeMs)}ms</span>}
                  <span>{new Date(r.checkedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
