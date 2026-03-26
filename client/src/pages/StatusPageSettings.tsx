import { useState, useEffect, type FormEvent } from 'react';
import { useApi } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardBody } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Input, Select, FormField, Textarea } from '../components/Input.js';

interface StatusPageData {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  logoUrl: string | null;
  headerText: string | null;
  footerText: string | null;
  footerLinks: { label: string; url: string }[];
  footerLayout: string;
  theme: string;
  colorMode: string;
  fontFamily: string;
  uptimeBarStyle: string;
  customCss: string | null;
  uptimeDaysToShow: number;
  monitors: {
    id: number;
    monitorId: number;
    displayName: string | null;
    sortOrder: number;
    visible: boolean;
    monitorName: string;
    monitorType: string;
  }[];
}

interface MonitorItem {
  id: number;
  name: string;
  type: string;
}

const themes = [
  { id: 'minimal', name: 'Minimal', desc: 'Clean, whitespace-focused' },
  { id: 'modern', name: 'Modern SaaS', desc: 'Bold, contemporary' },
  { id: 'classic', name: 'Classic', desc: 'Traditional table layout' },
  { id: 'dark-tech', name: 'Dark Technical', desc: 'Terminal-inspired dark theme' },
];

export function StatusPageSettingsPage() {
  const { data: pageData, loading, refetch } = useApi<StatusPageData>('/status-page');
  const { data: allMonitors } = useApi<MonitorItem[]>('/monitors');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [footerLayout, setFooterLayout] = useState('simple');
  const [theme, setTheme] = useState('minimal');
  const [colorMode, setColorMode] = useState('light');
  const [fontFamily, setFontFamily] = useState('inter');
  const [uptimeBarStyle, setUptimeBarStyle] = useState('pill');
  const [uptimeDaysToShow, setUptimeDaysToShow] = useState(90);
  const [customCss, setCustomCss] = useState('');
  const [footerLinks, setFooterLinks] = useState<{ label: string; url: string }[]>([]);
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (pageData) {
      setTitle(pageData.title);
      setDescription(pageData.description || '');
      setSlug(pageData.slug);
      setLogoUrl(pageData.logoUrl || '');
      setHeaderText(pageData.headerText || '');
      setFooterText(pageData.footerText || '');
      setFooterLayout(pageData.footerLayout);
      setTheme(pageData.theme);
      setColorMode(pageData.colorMode);
      setFontFamily(pageData.fontFamily);
      setUptimeBarStyle(pageData.uptimeBarStyle);
      setUptimeDaysToShow(pageData.uptimeDaysToShow);
      setCustomCss(pageData.customCss || '');
      setFooterLinks(pageData.footerLinks || []);
      setSelectedMonitorIds(pageData.monitors.map((m) => m.monitorId));
    }
  }, [pageData]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/status-page', {
        title, description: description || null, slug, logoUrl: logoUrl || null,
        headerText: headerText || null, footerText: footerText || null,
        footerLayout, theme, colorMode, fontFamily, uptimeBarStyle,
        uptimeDaysToShow, customCss: customCss || null, footerLinks,
      });

      await api.put('/status-page/monitors', {
        monitors: selectedMonitorIds.map((id, i) => ({
          monitorId: id,
          sortOrder: i,
          visible: true,
        })),
      });

      setMessage('Settings saved successfully');
      refetch();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleMonitor = (id: number) => {
    setSelectedMonitorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addFooterLink = () => setFooterLinks([...footerLinks, { label: '', url: '' }]);
  const removeFooterLink = (i: number) => setFooterLinks(footerLinks.filter((_, idx) => idx !== i));

  if (loading) return <div className="p-10 text-center text-gray-400">Loading...</div>;

  const previewUrl = `/status/${slug}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Status Page Settings</h1>
        <a href={previewUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary">Preview Page &rarr;</Button>
        </a>
      </div>

      {message && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-3 ${message.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">

        {/* Theme Selection */}
        <Card>
          <CardHeader><h2 className="font-semibold">Theme / Design</h2></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    theme === t.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <FormField label="Color Mode">
                <Select value={colorMode} onChange={(e) => setColorMode(e.target.value)}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </Select>
              </FormField>
              <FormField label="Font">
                <Select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                  <option value="inter">Inter</option>
                  <option value="geist">Geist</option>
                  <option value="mono-jetbrains">JetBrains Mono</option>
                  <option value="system">System</option>
                </Select>
              </FormField>
              <FormField label="Uptime Bar Style">
                <Select value={uptimeBarStyle} onChange={(e) => setUptimeBarStyle(e.target.value)}>
                  <option value="pill">Rounded Pills</option>
                  <option value="block">Sharp Blocks</option>
                  <option value="line">Thin Line</option>
                  <option value="rounded">Rounded Blocks</option>
                </Select>
              </FormField>
              <FormField label="Days to Show">
                <Input type="number" min={7} max={365} value={uptimeDaysToShow} onChange={(e) => setUptimeDaysToShow(parseInt(e.target.value, 10))} />
              </FormField>
            </div>
          </CardBody>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader><h2 className="font-semibold">Branding</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Page Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormField>
              <FormField label="URL Slug">
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Description">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Current status of our services" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Logo URL">
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
              </FormField>
              <FormField label="Header Text">
                <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Override page title" />
              </FormField>
            </div>
          </CardBody>
        </Card>

        {/* Footer */}
        <Card>
          <CardHeader><h2 className="font-semibold">Footer</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Footer Text">
                <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Powered by Uptime Monitor" />
              </FormField>
              <FormField label="Footer Layout">
                <Select value={footerLayout} onChange={(e) => setFooterLayout(e.target.value)}>
                  <option value="simple">Simple (left/right)</option>
                  <option value="centered">Centered</option>
                  <option value="columns">Two Columns</option>
                  <option value="minimal">Minimal</option>
                </Select>
              </FormField>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Footer Links</span>
                <Button type="button" variant="ghost" size="sm" onClick={addFooterLink}>+ Add Link</Button>
              </div>
              {footerLinks.map((link, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Label" value={link.label} onChange={(e) => { const u = [...footerLinks]; u[i].label = e.target.value; setFooterLinks(u); }} className="flex-1" />
                  <Input placeholder="URL" value={link.url} onChange={(e) => { const u = [...footerLinks]; u[i].url = e.target.value; setFooterLinks(u); }} className="flex-1" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFooterLink(i)}>✕</Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Monitors */}
        <Card>
          <CardHeader><h2 className="font-semibold">Monitors on Status Page</h2></CardHeader>
          <CardBody>
            {!allMonitors?.length ? (
              <p className="text-sm text-gray-400">No monitors available</p>
            ) : (
              <div className="space-y-2">
                {allMonitors.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 py-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMonitorIds.includes(m.id)}
                      onChange={() => toggleMonitor(m.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{m.name}</span>
                    <span className="text-xs text-gray-400 uppercase">{m.type}</span>
                  </label>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Custom CSS */}
        <Card>
          <CardHeader><h2 className="font-semibold">Custom CSS (Advanced)</h2></CardHeader>
          <CardBody>
            <Textarea
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              placeholder="/* Custom CSS for your status page */"
              className="font-mono text-xs"
              rows={4}
            />
          </CardBody>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secondary">Preview</Button>
          </a>
        </div>
      </form>
    </div>
  );
}
