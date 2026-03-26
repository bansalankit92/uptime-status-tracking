import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useApi } from '../lib/hooks.js';
import { Card, CardBody, CardHeader } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Input, Select, FormField } from '../components/Input.js';

export function MonitorForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: existing } = useApi<any>(isEdit ? `/monitors/${id}` : null);

  const [type, setType] = useState<'http' | 'smtp'>('http');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(25);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [timeoutMs, setTimeoutMs] = useState(10000);
  const [retryCount, setRetryCount] = useState(2);
  const [retryDelaySeconds, setRetryDelaySeconds] = useState(5);
  const [expectedStatusCodes, setExpectedStatusCodes] = useState('200');
  const [expectedBanner, setExpectedBanner] = useState('');
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setType(existing.type);
      setName(existing.name);
      setUrl(existing.url || '');
      setMethod(existing.method || 'GET');
      setSmtpHost(existing.smtpHost || '');
      setSmtpPort(existing.smtpPort || 25);
      setSmtpSecure(existing.smtpSecure || false);
      setIntervalSeconds(existing.intervalSeconds);
      setTimeoutMs(existing.timeoutMs);
      setRetryCount(existing.retryCount);
      setRetryDelaySeconds(existing.retryDelaySeconds);
      setExpectedBanner(existing.expectedBanner || '');
      setHeaders(existing.headers || []);
      if (existing.expectedStatusCodes) {
        try {
          setExpectedStatusCodes(JSON.parse(existing.expectedStatusCodes).join(','));
        } catch { /* ignore */ }
      }
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body: any = {
      type,
      name,
      intervalSeconds,
      timeoutMs,
      retryCount,
      retryDelaySeconds,
    };

    if (type === 'http') {
      body.url = url;
      body.method = method;
      body.expectedStatusCodes = expectedStatusCodes.split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean);
      body.headers = headers.filter((h) => h.key);
    } else {
      body.smtpHost = smtpHost;
      body.smtpPort = smtpPort;
      body.smtpSecure = smtpSecure;
      if (expectedBanner) body.expectedBanner = expectedBanner;
    }

    try {
      if (isEdit) {
        await api.put(`/monitors/${id}`, body);
      } else {
        await api.post('/monitors', body);
      }
      navigate('/monitors');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
  const removeHeader = (i: number) => setHeaders(headers.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, field: 'key' | 'value', val: string) => {
    const updated = [...headers];
    updated[i][field] = val;
    setHeaders(updated);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Monitor' : 'New Monitor'}
      </h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        <Card className="mb-4">
          <CardHeader><h2 className="font-semibold">Basic Settings</h2></CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Monitor Type" required>
              <Select value={type} onChange={(e) => setType(e.target.value as 'http' | 'smtp')}>
                <option value="http">HTTP / HTTPS</option>
                <option value="smtp">SMTP</option>
              </Select>
            </FormField>

            <FormField label="Name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Website" required />
            </FormField>

            {type === 'http' ? (
              <>
                <FormField label="URL" required>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required type="url" />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Method">
                    <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                      {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Expected Status Codes">
                    <Input value={expectedStatusCodes} onChange={(e) => setExpectedStatusCodes(e.target.value)} placeholder="200,201" />
                  </FormField>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="SMTP Host" required>
                    <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.example.com" required />
                  </FormField>
                  <FormField label="Port">
                    <Input type="number" value={smtpPort} onChange={(e) => setSmtpPort(parseInt(e.target.value, 10))} />
                  </FormField>
                </div>
                <FormField label="Expected Banner">
                  <Input value={expectedBanner} onChange={(e) => setExpectedBanner(e.target.value)} placeholder="Optional banner text to match" />
                </FormField>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} className="rounded border-gray-300" />
                  Use TLS
                </label>
              </>
            )}
          </CardBody>
        </Card>

        <Card className="mb-4">
          <CardHeader><h2 className="font-semibold">Timing</h2></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <FormField label="Interval (s)">
                <Input type="number" min={10} value={intervalSeconds} onChange={(e) => setIntervalSeconds(parseInt(e.target.value, 10))} />
              </FormField>
              <FormField label="Timeout (ms)">
                <Input type="number" min={1000} value={timeoutMs} onChange={(e) => setTimeoutMs(parseInt(e.target.value, 10))} />
              </FormField>
              <FormField label="Retries">
                <Input type="number" min={0} max={10} value={retryCount} onChange={(e) => setRetryCount(parseInt(e.target.value, 10))} />
              </FormField>
              <FormField label="Retry Delay (s)">
                <Input type="number" min={0} value={retryDelaySeconds} onChange={(e) => setRetryDelaySeconds(parseInt(e.target.value, 10))} />
              </FormField>
            </div>
          </CardBody>
        </Card>

        {type === 'http' && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Custom Headers</h2>
                <Button type="button" variant="ghost" size="sm" onClick={addHeader}>+ Add</Button>
              </div>
            </CardHeader>
            <CardBody>
              {headers.length === 0 ? (
                <p className="text-sm text-gray-400">No custom headers</p>
              ) : (
                <div className="space-y-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="Key" value={h.key} onChange={(e) => updateHeader(i, 'key', e.target.value)} className="flex-1" />
                      <Input placeholder="Value" value={h.value} onChange={(e) => updateHeader(i, 'value', e.target.value)} className="flex-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeHeader(i)}>✕</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update Monitor' : 'Create Monitor'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/monitors')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
