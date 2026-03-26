import { useApi } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import { Card, CardHeader } from '../components/Card.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Button } from '../components/Button.js';
import { Select } from '../components/Input.js';
import { useState } from 'react';

interface Incident {
  id: number;
  title: string;
  status: string;
  cause: string | null;
  startedAt: string;
  resolvedAt: string | null;
  monitorName: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  investigating: { label: 'Investigating', color: 'text-red-600' },
  identified: { label: 'Identified', color: 'text-orange-600' },
  monitoring: { label: 'Monitoring', color: 'text-yellow-600' },
  resolved: { label: 'Resolved', color: 'text-green-600' },
};

export function IncidentsPage() {
  const { data: incidents, loading, refetch } = useApi<Incident[]>('/incidents');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/incidents/${id}`, { status });
      refetch();
    } finally {
      setUpdatingId(null);
    }
  };

  const active = incidents?.filter((i) => i.status !== 'resolved') || [];
  const resolved = incidents?.filter((i) => i.status === 'resolved') || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Incidents</h1>

      {/* Active incidents */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Active Incidents ({active.length})</h2>
        </CardHeader>
        {loading ? (
          <div className="p-6 text-center text-gray-400">Loading...</div>
        ) : !active.length ? (
          <div className="p-6 text-center text-gray-400 text-sm">No active incidents</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {active.map((inc) => (
              <div key={inc.id} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{inc.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className={statusMap[inc.status]?.color || ''}>{statusMap[inc.status]?.label || inc.status}</span>
                      {' '}&middot; {inc.monitorName} &middot; Started {new Date(inc.startedAt).toLocaleString()}
                    </div>
                    {inc.cause && <div className="text-xs text-gray-500 mt-1">{inc.cause}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={inc.status}
                      onChange={(e) => updateStatus(inc.id, e.target.value)}
                      disabled={updatingId === inc.id}
                      className="text-xs w-32"
                    >
                      <option value="investigating">Investigating</option>
                      <option value="identified">Identified</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="resolved">Resolved</option>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Resolved incidents */}
      {resolved.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Resolved ({resolved.length})</h2>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {resolved.slice(0, 20).map((inc) => (
              <div key={inc.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-900">{inc.title}</span>
                  <span className="text-gray-400 ml-2">{inc.monitorName}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : '—'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
