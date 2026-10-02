// mediaStorageAdapter — camada isolada de mídia do usuário ("Minha Galeria").
// Sincronizada com o Ramal da Galeria e o branch documental da Central de Dados (/api/admin/lab/user-gallery).
import { useSyncExternalStore } from 'react';
import { authClient } from '@dashboard/login/authClient';

let images = []; // [{ mediaId, id, userId, url, filename, mimeType, createdAt, title }]
let currentUserId = null;
let galleryBranch = null;
const listeners = new Set();

const STORAGE_PREFIX = 'livenexus:gallery';

function getStorageKey() {
  return currentUserId ? `${STORAGE_PREFIX}:${currentUserId}` : null;
}

function persistToStorage() {
  const key = getStorageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(images));
  } catch {}
}

function emit() {
  listeners.forEach(l => {
    try { l(); } catch (err) { console.error('Listener error in mediaStorageAdapter:', err); }
  });
}

export async function setUserId(userId, user) {
  if (userId !== currentUserId) {
    galleryBranch = null;
  }
  currentUserId = userId || null;
  const key = getStorageKey();
  if (key) {
    try {
      images = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      images = [];
    }
  } else {
    images = [];
  }
  emit();
  if (currentUserId) {
    await hydrateUserGallery();
  }
}

export async function hydrateUserGallery() {
  const userId = currentUserId;
  if (!userId) return;

  try {
    let items;
    if (galleryBranch) {
      items = await galleryBranch('GET');
    } else {
      const token = authClient?.getToken ? authClient.getToken() : null;
      const res = await fetch(`/api/admin/lab/user-gallery?userId=${encodeURIComponent(userId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        items = data.gallery;
      }
    }

    if (userId !== currentUserId) return;

    if (Array.isArray(items)) {
      images = items.map(item => ({
        mediaId: String(item.mediaId || item.id),
        id: String(item.id || item.mediaId),
        userId: item.userId || userId,
        url: item.url,
        title: item.title || item.name || item.filename || 'imagem',
        filename: item.filename || 'imagem',
        createdAt: item.createdAt || new Date().toISOString()
      }));
    } else {
      images = [];
    }

    persistToStorage();
    emit();
  } catch (err) {
    console.warn('Erro ao hidratar galeria de usuário:', err);
  }
}

export function refreshUserGallery() {
  return hydrateUserGallery();
}

export function removeGalleryImage(mediaId) {
  if (!mediaId) return;
  const targetId = String(mediaId);
  images = images.filter(i => String(i.mediaId) !== targetId && String(i.id) !== targetId);
  persistToStorage();
  emit();
}

export function connectGalleryBranch(branch) {
  galleryBranch = branch;
  if (branch && currentUserId) {
    hydrateUserGallery().catch(error => console.error('Erro ao carregar galeria via ramal:', error));
  }
}

export function listUserImages() {
  return images;
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Hook para componentes React lerem a galeria de forma reativa.
export function useUserGallery() {
  return useSyncExternalStore(subscribe, listUserImages);
}

export function getImageUrl(mediaId) {
  const targetId = String(mediaId);
  const img = images.find(i => (String(i.mediaId) === targetId || String(i.id) === targetId));
  return img ? img.url : null;
}

// Upload conectado ao Ramal da Galeria (/dashboard/Imagem)
export async function uploadUserImage(file) {
  if (!file) return null;
  if (!currentUserId) throw new Error('Usuário não autenticado.');
  
  const ext = file.name.split('.').pop().toLowerCase();
  const isPngOrGif = (ext === 'png' || ext === 'gif') && (file.type === 'image/png' || file.type === 'image/gif');
  
  if (!isPngOrGif) {
    throw new Error('este arquivo viola as regras da plataforma, use somente png ou gif!');
  }

  // Converte o arquivo para Base64 Data URL
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem'));
    reader.readAsDataURL(file);
  });

  let record;
  if (galleryBranch) {
    const res = await galleryBranch('POST', {
      payload: {
        action: 'upload',
        filename: file.name,
        fileData: base64Data
      }
    });
    record = (res && typeof res === 'object' && 'id' in res) ? res : (res?.record || res);
  } else {
    const token = authClient?.getToken ? authClient.getToken() : null;
    const res = await fetch(`/api/admin/lab/user-gallery?userId=${encodeURIComponent(currentUserId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        action: 'upload',
        filename: file.name,
        fileData: base64Data
      })
    });
    const data = await res.json();
    record = data.record;
  }

  const mediaId = String(record?.id || record?.mediaId || `img_${Date.now()}`);
  const url = record?.url || `/dashboard/Imagem/${record?.filename || file.name}`;

  const image = {
    mediaId,
    id: mediaId,
    userId: currentUserId,
    url,
    title: record?.title || file.name,
    filename: record?.filename || file.name || 'imagem',
    mimeType: file.type || 'image/*',
    createdAt: new Date().toISOString(),
  };

  images = [image, ...images.filter(i => (String(i.mediaId) !== mediaId && String(i.id) !== mediaId))];
  persistToStorage();
  emit();
  return image;
}

// Exclusão conectada ao Ramal da Galeria
export async function deleteUserImage(mediaId) {
  if (!mediaId) return;
  const targetId = String(mediaId);
  const img = images.find(i => (String(i.mediaId) === targetId || String(i.id) === targetId));

  // Remoção otimista instantânea do estado local e cache
  removeGalleryImage(targetId);

  if (galleryBranch) {
    try {
      await galleryBranch('DELETE', { id: targetId });
    } catch (err) {
      console.error('Erro ao deletar via branch:', err);
    }
  } else if (currentUserId) {
    const token = authClient?.getToken ? authClient.getToken() : null;
    try {
      await fetch(`/api/admin/lab/user-gallery?userId=${encodeURIComponent(currentUserId)}&id=${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
    } catch (err) {
      console.error('Erro ao deletar via API:', err);
    }
  }

  await hydrateUserGallery();
}
