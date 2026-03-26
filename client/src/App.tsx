import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth.js';
import { Layout } from './components/Layout.js';
import { LoginPage } from './pages/Login.js';
import { DashboardOverview } from './pages/DashboardOverview.js';
import { MonitorsList } from './pages/MonitorsList.js';
import { MonitorDetailPage } from './pages/MonitorDetail.js';
import { MonitorForm } from './pages/MonitorForm.js';
import { IncidentsPage } from './pages/Incidents.js';
import { NotificationsPage } from './pages/Notifications.js';
import { StatusPageSettingsPage } from './pages/StatusPageSettings.js';

const basename = import.meta.env.PROD ? '/dashboard' : '/';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="monitors" element={<MonitorsList />} />
            <Route path="monitors/new" element={<MonitorForm />} />
            <Route path="monitors/:id" element={<MonitorDetailPage />} />
            <Route path="monitors/:id/edit" element={<MonitorForm />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="status-page" element={<StatusPageSettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
