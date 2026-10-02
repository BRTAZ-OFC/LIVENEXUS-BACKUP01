// avatarStorageAdapter — camada isolada de avatar.
// Interface estável: uploadAvatar(file), setAvatarUrl(url), removeAvatar(), getAvatarUrl(), useAvatar().
// Perfil e Sidebar trabalham apenas com avatarUrl — não conhecem o storage subjacente.
//
// Etapa atual: preview LOCAL apenas (URL.createObjectURL). Sem backend, sem custo,
// sem upload remoto. O avatar existe apenas em memória durante a sessão.
//
// Futuro: substituir o corpo de uploadAvatar por upload para storage externo
// (Cloudflare R2, ImageKit, etc.). A interface permanece a mesma — Perfil e Sidebar não mudam.
import { useSyncExternalStore } from 'react';

const listeners = new Set();
let currentAvatarUrl = null;
// Indica se o blob URL atual foi criado por uploadAvatar (e portanto deve ser revogado ao trocar).
// URLs vindas da galeria pertencem ao mediaStorageAdapter e não devem ser revogadas aqui.
let ownsBlob = false;

function emit() { listeners.forEach(l => l()); }

function revokeOwned() {
  if (ownsBlob && currentAvatarUrl && currentAvatarUrl.startsWith('blob:')) {
    URL.revokeObjectURL(currentAvatarUrl);
  }
  ownsBlob = false;
}

export function getAvatarUrl() { return currentAvatarUrl; }

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Hook para componentes React lerem o avatar atual de forma reativa.
export function useAvatar() {
  return useSyncExternalStore(subscribe, getAvatarUrl);
}

// Gera preview local a partir de um File.
// Futuro: substituir por upload para storage externo, retornando a URL remota.
export async function uploadAvatar(file) {
  if (!file) return null;
  revokeOwned();
  const url = URL.createObjectURL(file);
  currentAvatarUrl = url;
  ownsBlob = true;
  emit();
  return url;
}

// Define o avatar diretamente a partir de uma URL (ex: imagem da galeria).
// O chamador é dono do ciclo de vida da URL — este adapter não a revoga.
export function setAvatarUrl(url) {
  revokeOwned();
  currentAvatarUrl = url || null;
  emit();
}

export function removeAvatar() {
  revokeOwned();
  currentAvatarUrl = null;
  emit();
}