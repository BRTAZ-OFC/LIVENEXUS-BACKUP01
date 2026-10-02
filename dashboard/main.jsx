import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/css/index.css'
import { DiagnosticProvider } from '@dashboard/painel-admin/Admin_DiagnosticContext'
import GlobalDiagnosticBoundary from '@dashboard/painel-admin/Admin_GlobalDiagnosticBoundary'

ReactDOM.createRoot(document.getElementById('root')).render(
  <DiagnosticProvider>
    <GlobalDiagnosticBoundary>
      <App />
    </GlobalDiagnosticBoundary>
  </DiagnosticProvider>
)
