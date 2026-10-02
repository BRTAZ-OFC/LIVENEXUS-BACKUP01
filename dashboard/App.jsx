import React from 'react';
import { Toaster } from "@dashboard/componentes/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@dashboard/configuracao/lib/Config_query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from "@dashboard/configuracao/Config_PageNotFound";
import { AuthProvider, useAuth } from '@dashboard/login/AuthContext';
import UserNotRegisteredError from '@dashboard/login/UserNotRegisteredError';
import ScrollToTop from '@dashboard/componentes/ScrollToTop';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@dashboard/login/ProtectedRoute';
import { StreamingProvider } from '@dashboard/configuracao/Config_StreamingContext';
import { NewUserDataCentralProvider } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import Home from '@dashboard/configuracao/Config_Home';
import AllReviews from '@dashboard/painel-admin/Review_AllReviews';
import Dashboard from '@dashboard/dashboard';
import DashboardErrorBoundary from '@dashboard/componentes/DashboardErrorBoundary';
import Login from '@dashboard/login/Login';
import Register from '@dashboard/login/Register';
import LiveScenarioViewer from '@dashboard/cenarios/Scenario_LiveScenarioViewer';
// Add page imports here

const AuthenticatedApp = () => {
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically — exceto na rota pública inicial "/"
      // (Home é pública; o login só é exigido pelas áreas protegidas via ProtectedRoute)
      if (location.pathname !== '/') {
        navigateToLogin();
        return null;
      }
    }
  }

  // Render the main app
  return (
    <NewUserDataCentralProvider>
      <StreamingProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cenario/receiver/:scenarioId" element={<LiveScenarioViewer />} />
          <Route path="/cenario/:scenarioId" element={<LiveScenarioViewer />} />
          <Route path="/" element={<Home />} />
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            <Route path="/avaliacoes" element={<AllReviews />} />
            <Route path="/dashboard" element={<DashboardErrorBoundary><Dashboard /></DashboardErrorBoundary>} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </StreamingProvider>
    </NewUserDataCentralProvider>
  );
};


function AppShell() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <AppShell />
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App