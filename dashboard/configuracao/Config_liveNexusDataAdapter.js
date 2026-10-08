// liveNexusDataAdapter — Camada de Repositório e Adaptador de Dados do LiveNexus.
//
// Arquitetura:
// COMPONENTES / MÓDULOS
//         ↓
// CENTRAL / SERVIÇOS LIVENEXUS
//         ↓
// liveNexusDataAdapter (REPOSITÓRIOS AGNOSTICOS)
//         ↓
// CAMADA DE TRANSPORTE / BACKEND API OU PERSISTÊNCIA NATIVA
//
// Não acopla a nenhum provedor proprietário (D1, Postgres, Supabase ou Cloudflare).
// A portabilidade da infraestrutura fica 100% preservada.

import { authClient } from '@dashboard/login/authClient';
import { vodsRamal } from '@dashboard/conexao/ramal/Config_VodsRamal';
import { messagesRamal } from '@dashboard/conexao/ramal/Config_MessagesRamal';
import { reviewsRamal } from '@dashboard/conexao/ramal/Review_Ramal';

// Repositório de Sessões de Live (Live Sessions / VODs)
export const liveSessionRepository = {
  async list(filter = {}, sortField = '-created_date', limit = 50) {
    const query = new URLSearchParams({ limit: String(limit), sort: sortField });
    if (filter.vodStatus) query.set('vodStatus', filter.vodStatus);
    return vodsRequest(`/api/live-sessions?${query}`);
  },

  async get(id) {
    return vodsRequest(`/api/live-sessions?id=${encodeURIComponent(id)}`);
  },

  async create(data = {}) {
    return vodsRequest('/api/live-sessions', 'POST', data);
  },

  async update(id, changes = {}) {
    return vodsRequest(`/api/live-sessions?id=${encodeURIComponent(id)}`, 'PATCH', changes);
  },

  async delete(id) {
    return vodsRequest(`/api/live-sessions?id=${encodeURIComponent(id)}`, 'DELETE');
  }
};

async function vodsRequest(url, method = 'GET', body) {
  const res = await fetch(url, {
    method, credentials: 'include',
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.headers.get('content-type')?.includes('application/json')) throw new Error('API de VODs indisponível neste ambiente.');
  const response = await res.json();
  if (!res.ok || !response.ok) throw new Error(response.error || `Erro HTTP ${res.status}`);
  return vodsRamal(response);
}

// Repositório de Avaliações / Depoimentos (Reviews)
export const reviewRepository = {
  async list(sortField = '-created_date', limit = 500) {
    return reviewsRequest(`/api/reviews?limit=${limit}&sort=${encodeURIComponent(sortField)}`);
  },

  async create(data = {}) {
    return reviewsRequest('/api/reviews', 'POST', data);
  },

  async update(id, changes = {}) {
    return reviewsRequest(`/api/reviews?id=${encodeURIComponent(id)}`, 'PATCH', changes);
  },

  async delete(id) {
    return reviewsRequest(`/api/reviews?id=${encodeURIComponent(id)}`, 'DELETE');
  }
};

async function reviewsRequest(url, method = 'GET', body) {
  const res = await fetch(url, {
    method, credentials: 'include',
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'POST' && authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.headers.get('content-type')?.includes('application/json')) throw new Error('API de Avaliações indisponível neste ambiente.');
  const response = await res.json();
  if (!res.ok || !response.ok) throw new Error(response.error || `Erro HTTP ${res.status}`);
  return reviewsRamal(response);
}

// Repositório de Contatos / Mensagens (Contact)
export const contactRepository = {
  async list(sortField = '-created_date', limit = 500) {
    return messagesRequest(`/api/contacts?limit=${limit}&sort=${encodeURIComponent(sortField)}`);
  },

  async create(data = {}) {
    return messagesRequest('/api/contacts', 'POST', data);
  },

  async update(id, changes = {}) {
    return messagesRequest(`/api/contacts?id=${encodeURIComponent(id)}`, 'PATCH', changes);
  },

  async delete(id) {
    return messagesRequest(`/api/contacts?id=${encodeURIComponent(id)}`, 'DELETE');
  }
};

async function messagesRequest(url, method = 'GET', body) {
  const res = await fetch(url, {
    method, credentials: 'include',
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'POST' && authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.headers.get('content-type')?.includes('application/json')) throw new Error('API de Mensagens indisponível neste ambiente.');
  const response = await res.json();
  if (!res.ok || !response.ok) throw new Error(response.error || `Erro HTTP ${res.status}`);
  return messagesRamal(response);
}

// Repositório de Vidas Públicas (Public Lives)
export const publicLivesRepository = {
  async getPublicLives() {
    try {
      const res = await fetch('/api/public-lives');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { ok: true, lives: [] };
  }
};

export const plataformasRepository = {
  async list() {
    return plataformasRequest('/api/plataformas');
  },
  async get(id) {
    return plataformasRequest(`/api/plataformas?id=${encodeURIComponent(id)}`);
  },
  async create(data = {}) {
    return plataformasRequest('/api/plataformas', 'POST', data);
  },
  async update(id, changes = {}) {
    return plataformasRequest(`/api/plataformas?id=${encodeURIComponent(id)}`, 'PATCH', changes);
  },
  async delete(id) {
    return plataformasRequest(`/api/plataformas?id=${encodeURIComponent(id)}`, 'DELETE');
  }
};

async function plataformasRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {}),
    },
    credentials: 'include',
    ...(body ? { body: JSON.stringify(body) } : {})
  };
  const res = await fetch(new URL(url, window.location.origin), options);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export const liveNexusDataAdapter = {
  liveSession: liveSessionRepository,
  review: reviewRepository,
  contact: contactRepository,
  plataformas: plataformasRepository,
  publicLives: publicLivesRepository
};
