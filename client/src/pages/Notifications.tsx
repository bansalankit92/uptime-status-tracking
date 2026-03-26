import { useState, type FormEvent } from 'react';
import { useApi } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardBody } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Input, Select, FormField } from '../components/Input.js';

interface Channel {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
  slackWebhookUrl: string | null;
  emailAddresses: string | null;
  notifyOnDown: boolean;
  notifyOnRecovery: boolean;
  cooldownMinutes: number;
}

export function NotificationsPage() {
  const { data: channels, loading, refetch } = useApi<Channel[]>('/notifications');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [type, setType] = useState<'slack' | 'email'>('slack');
  const [name, setName] = useState('');
  const [slackUrl, setSlackUrl] = useState('');
  const [emails, setEmails] = useState('');
  const [notifyDown, setNotifyDown] = useState(true);
  const [notifyRecovery, setNotifyRecovery] = useState(true);
  const [cooldown, setCooldown] = useState(5);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setType('slack');
    setName('');
    setSlackUrl('');
    setEmails('');
    setNotifyDown(true);
    setNotifyRecovery(true);
    setCooldown(5);
    setEditId(null);
    setError('');
  };

  const openEdit = (ch: Channel) => {
    setType(ch.type as 'slack' | 'email');
    setName(ch.name);
    setSlackUrl(ch.slackWebhookUrl || '');
    if (ch.emailAddresses) {
      try { setEmails(JSON.parse(ch.emailAddresses).join(', ')); } catch { setEmails(''); }
    }
    setNotifyDown(ch.notifyOnDown);
    setNotifyRecovery(ch.notifyOnRecovery);
    setCooldown(ch.cooldownMinutes);
    setEditId(ch.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body: any = { type, name, notifyOnDown: notifyDown, notifyOnRecovery: notifyRecovery, cooldownMinutes: cooldown };
    if (type === 'slack') body.slackWebhookUrl = slackUrl;
    if (type === 'email') body.emailAddresses = emails.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      if (editId) {
        await api.put(`/notifications/${editId}`, body);
      } else {
        await api.post('/notifications', body);
      }
      setShowForm(false);
      resetForm();
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this notification channel?')) return;
    await api.delete(`/notifications/${id}`);
    refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notification Channels</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>+ New Channel</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><h2 className="font-semibold">{editId ? 'Edit Channel' : 'New Channel'}</h2></CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Name" required>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production Alerts" required />
                </FormField>
                <FormField label="Type" required>
                  <Select value={type} onChange={(e) => setType(e.target.value as 'slack' | 'email')}>
                    <option value="slack">Slack Webhook</option>
                    <option value="email">Email</option>
                  </Select>
                </FormField>
              </div>

              {type === 'slack' ? (
                <FormField label="Webhook URL" required>
                  <Input value={slackUrl} onChange={(e) => setSlackUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." required type="url" />
                </FormField>
              ) : (
                <FormField label="Email Addresses (comma-separated)" required>
                  <Input value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="alert@example.com, ops@example.com" required />
                </FormField>
              )}

              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={notifyDown} onChange={(e) => setNotifyDown(e.target.checked)} className="rounded border-gray-300" />
                  Notify on Down
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={notifyRecovery} onChange={(e) => setNotifyRecovery(e.target.checked)} className="rounded border-gray-300" />
                  Notify on Recovery
                </label>
                <FormField label="Cooldown (min)">
                  <Input type="number" min={0} value={cooldown} onChange={(e) => setCooldown(parseInt(e.target.value, 10))} />
                </FormField>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="p-6 text-center text-gray-400">Loading...</div>
        ) : !channels?.length ? (
          <div className="p-6 text-center text-gray-400 text-sm">No notification channels configured</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {channels.map((ch) => (
              <div key={ch.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-gray-900">{ch.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {ch.type.toUpperCase()} &middot; Cooldown: {ch.cooldownMinutes}m
                    {ch.notifyOnDown && ' · Down'}
                    {ch.notifyOnRecovery && ' · Recovery'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(ch)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(ch.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
