// authClient — cliente de autenticação nativo e portável do LiveNexus.
// Conecta-se diretamente aos endpoints da API do LiveNexus (/api/auth/...)
// e gerencia credenciais de sessão locais de forma limpa e desacoplada.
import { safeStorage } from './safeStorage';

const STORAGE_TOKEN_KEY = 'livenexus_access_token';
const STORAGE_USER_KEY = 'livenexus_current_user';

const API_BASE_URL = '';

export const authClient = {
  // Retorna o token atual armazenado
  getToken() {
    if (typeof window === 'undefined') return null;
    return safeStorage.getItem(STORAGE_TOKEN_KEY) || safeStorage.getItem('token');
  },

  // Define o token no storage
  setToken(token) {
    if (typeof window === 'undefined') return;
    if (token) {
      safeStorage.setItem(STORAGE_TOKEN_KEY, token);
      safeStorage.setItem('token', token);
    } else {
      safeStorage.removeItem(STORAGE_TOKEN_KEY);
      safeStorage.removeItem('token');
    }
  },

  // Retorna o cache local de dados do usuário (somente para leitura/exibição secundária)
  // NUNCA deve ser usado como prova ou autoridade de autenticação.
  getUserDataCache() {
    if (typeof window === 'undefined') return null;
    try {
      const cached = safeStorage.getItem(STORAGE_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },

  // Consulta os dados do usuário autenticado atual no backend.
  // O backend (/api/auth/me) é a ÚNICA autoridade para determinar sessão autenticada.
  async me() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {})
        }
      });

      if (res.ok) {
        const user = await res.json();
        if (typeof window !== 'undefined') {
          safeStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
        }
        return user;
      }

      // Resposta não-2xx (401, etc.): invalida cache local e lança erro de autenticação
      if (typeof window !== 'undefined') {
        safeStorage.removeItem(STORAGE_USER_KEY);
        safeStorage.removeItem(STORAGE_TOKEN_KEY);
        safeStorage.removeItem('token');
      }

      const err = new Error('Authentication required');
      err.status = res.status;
      throw err;
    } catch (err) {
      // Falhas de rede ou status 401: NÃO usa cache local como credencial de autenticação
      if (typeof window !== 'undefined') {
        safeStorage.removeItem(STORAGE_USER_KEY);
      }
      if (err.status) throw err;
      const netErr = new Error(err.message || 'Authentication check failed');
      netErr.status = 401;
      throw netErr;
    }
  },

  // Login por e-mail e senha
  async login({ email, password }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Erro do servidor: ${res.status}`);
    }

    const data = await res.json().catch(() => ({}));
    if (data.token || data.access_token) {
      this.setToken(data.token || data.access_token);
    }
    if (data.user && typeof window !== 'undefined') {
      safeStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  // Cadastro de nova conta
  async register({ email, password }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Falha no cadastro');
    }

    const data = await res.json().catch(() => ({}));
    return data;
  },

  // Verificação de código OTP
  async verifyOtp({ email, otpCode }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otpCode })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Código de verificação inválido');
    }

    const data = await res.json().catch(() => ({}));
    if (data.token || data.access_token) {
      this.setToken(data.token || data.access_token);
    }
    if (data.user && typeof window !== 'undefined') {
      safeStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  // Reenviar código OTP
  async resendOtp(email) {
    const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Falha ao reenviar o código');
    }

    return await res.json().catch(() => ({ success: true }));
  },

  // Atualiza dados do usuário autenticado
  async updateMe(updates = {}) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        const user = await res.json();
        if (typeof window !== 'undefined') {
          safeStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
        }
        return user;
      }
    } catch {
      // Ignora falha remota e aplica localmente apenas se houver usuário em cache
    }

    if (typeof window !== 'undefined') {
      const currentJson = safeStorage.getItem(STORAGE_USER_KEY);
      if (currentJson) {
        const user = JSON.parse(currentJson);
        const updated = { ...user, ...updates };
        safeStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
        return updated;
      }
    }
    return updates;
  },

  // Encerra sessão do usuário: invalida credenciais remotas e remove caches locais
  async logout(redirectUrl = '/login') {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {})
        }
      });
    } catch (e) {
      console.error('Logout error on server:', e);
    } finally {
      if (typeof window !== 'undefined') {
        safeStorage.removeItem(STORAGE_TOKEN_KEY);
        safeStorage.removeItem('token');
        safeStorage.removeItem(STORAGE_USER_KEY);
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      }
    }
  },

  // Deleta permanentemente a conta do usuário
  async deleteAccount() {
    const res = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {})
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Falha ao deletar conta');
    }

    if (typeof window !== 'undefined') {
      safeStorage.removeItem(STORAGE_TOKEN_KEY);
      safeStorage.removeItem('token');
      safeStorage.removeItem(STORAGE_USER_KEY);
      window.location.href = '/login';
    }
    return await res.json();
  }
};
