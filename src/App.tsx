import { HashRouter, Routes, Route, Navigate } from 'react-router'
import { Toaster } from 'sonner'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { CampaignListPage } from './components/campaign/CampaignListPage'
import { ImportPage } from './components/import/ImportPage'
import { SpotListPage } from './components/spots/SpotListPage'
import { SettingsPage } from './components/settings/SettingsPage'

export default function App() {
  return (
    <HashRouter>
      <Toaster position="top-right" richColors />
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/campaigns" element={<CampaignListPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/spots" element={<SpotListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}
