import { useApi } from '../lib/hooks.js';
import { Card } from '../components/Card.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Button } from '../components/Button.js';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

interface MonitorItem {
  id: number;
  name: string;
  type: string;
  url: string | null;
  smtpHost: string | null;
  enabled: boolean;
  currentStatus: string;
  lastCheckedAt: string | null;
  lastResponseTimeMs: number | null;
  tags: { id: number; name: string; color: string | null }[];
}

export function MonitorsList() {
  const { data: monitors, loading, refetch } = useApi<MonitorItem[]>('/monitors');

  const toggleMonitor = async (id: number) => {
    await api.patch(`/monitors/${id}/toggle`);
    refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Monitors</h1>
        <Link to="/monitors/new">
          <Button>+ New Monitor</Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : !monitors?.length ? (
          <div className="p-10 text-center text-gray-400">
            No monitors configured. Create your first one.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {monitors.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <Link to={`/monitors/${m.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <StatusBadge status={m.enabled ? m.currentStatus : 'unknown'} />
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{m.name}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {m.type === 'http' ? m.url : `${m.smtpHost}`} &middot; {m.type.toUpperCase()}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-3 ml-4">
                  {m.tags.map((t) => (
                    <span key={t.id} className="inline-flex px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: `${t.color}20`, color: t.color || '#666' }}>
                      {t.name}
                    </span>
                  ))}
                  {m.lastResponseTimeMs != null && (
                    <span className="text-xs text-gray-500">{Math.round(m.lastResponseTimeMs)}ms</span>
                  )}
                  <button
                    onClick={() => toggleMonitor(m.id)}
                    className={`w-8 h-5 rounded-full transition-colors relative ${m.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    title={m.enabled ? 'Disable' : 'Enable'}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${m.enabled ? 'left-3.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
