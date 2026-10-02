// Ponte de ciclo de vida para o Publisher RTC Automático
// Conecta a Central (runtimeId) e o StreamingProvider ao WebRTC P2P
import { useLocation } from 'react-router-dom';
import { useAuth } from '@dashboard/login/AuthContext';
import { useRtcPublisher } from './useRtcPublisher.js';

export function RtcAutoPublisherBridge() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // O Publisher automático SÓ deve ser ativado na área autenticada do streamer (/dashboard)
  // NUNCA em rotas de visualização pública ou receiver (/cenario, /login, /register, etc.)
  const isStreamerDashboard = Boolean(isAuthenticated && location.pathname.startsWith('/dashboard'));

  useRtcPublisher({ enabled: isStreamerDashboard });
  return null;
}

