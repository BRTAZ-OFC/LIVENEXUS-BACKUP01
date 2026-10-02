// appParams — parâmetros de configuração limpos do LiveNexus.
// Totalmente desacoplado de qualquer SDK externo.
import { safeStorage } from './safeStorage';

const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
  !isNode && new URLSearchParams(window.location.search).get('clear_access_token') === 'true';

const clearStoredAccessToken = () => {
  if (isNode) return;
  safeStorage.removeItem('livenexus_access_token');
  safeStorage.removeItem('token');
};

const getAppParams = () => {
  if (isClearAccessTokenRequested()) {
    clearStoredAccessToken();
  }
  const token = !isNode ? (safeStorage.getItem('livenexus_access_token') || safeStorage.getItem('token')) : null;
  return {
    appId: import.meta.env.VITE_LIVENEXUS_APP_ID || 'livenexus',
    token,
    appBaseUrl: import.meta.env.VITE_LIVENEXUS_APP_BASE_URL || '',
  };
};

export const appParams = {
  ...getAppParams(),
};
