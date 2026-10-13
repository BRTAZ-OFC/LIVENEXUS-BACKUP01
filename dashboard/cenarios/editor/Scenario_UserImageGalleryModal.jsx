import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Check, User, Globe } from 'lucide-react';
import { useUserGallery, hydrateUserGallery, setUserId } from '@dashboard/painel-admin/Gallery_mediaStorageAdapter';
import { authClient } from '@dashboard/login/authClient';

function getImageCategory(img) {
  const filename = String(img.filename || '').toLowerCase();
  const url = String(img.url || '').toLowerCase();
  const mimeType = String(img.mimeType || '').toLowerCase();

  // 1. Categoria imagen-gif: somente imagens .gif
  if (
    mimeType === 'image/gif' ||
    filename.endsWith('.gif') ||
    url.split('?')[0].endsWith('.gif') ||
    url.startsWith('data:image/gif')
  ) {
    return 'imagen-gif';
  }

  // 2. Categoria imagen-png: somente imagens .png
  if (
    mimeType === 'image/png' ||
    filename.endsWith('.png') ||
    url.split('?')[0].endsWith('.png') ||
    url.startsWith('data:image/png')
  ) {
    return 'imagen-png';
  }
  return null;
}

export default function ScenarioUserImageGalleryModal({ open, onClose, onSelect }) {
  const [activeMainTab, setActiveMainTab] = useState('personal'); // 'personal' | 'general'
  const [activeCategory, setActiveCategory] = useState('imagen-png'); // 'imagen-png' | 'imagen-gif'
  const [loading, setLoading] = useState(false);
  const [directImages, setDirectImages] = useState([]);
  const [generalImages, setGeneralImages] = useState([]);
  const adapterImages = useUserGallery();

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);

    const loadGalleries = async () => {
      try {
        let user = authClient.getUser();
        if (!user || !user.id) {
          user = await authClient.me().catch(() => null);
        }
        const userId = user?.id || null;
        if (userId) {
          await setUserId(userId, user);
          await hydrateUserGallery();
          const token = authClient.getToken ? authClient.getToken() : null;
          const res = await fetch(`/api/admin/lab/user-gallery?userId=${encodeURIComponent(userId)}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (active && Array.isArray(data.gallery)) {
              setDirectImages(data.gallery);
            }
          }
        } else {
          await hydrateUserGallery();
        }

        // Fetch general gallery
        const genRes = await fetch('/api/gallery/general');
        if (genRes.ok) {
          const genData = await genRes.json();
          if (active && Array.isArray(genData.gallery)) {
            setGeneralImages(genData.gallery);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar galerias:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGalleries();

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const personalCombinedImages = useMemo(() => {
    const map = new Map();
    (adapterImages || []).forEach(img => {
      const id = String(img.id || img.mediaId);
      map.set(id, img);
    });
    (directImages || []).forEach(img => {
      const id = String(img.id || img.mediaId);
      if (!map.has(id)) {
        map.set(id, {
          mediaId: id,
          id,
          userId: img.userId,
          url: img.url,
          title: img.title || img.name || img.filename || 'Imagem',
          filename: img.filename || 'Imagem',
          mimeType: img.mimeType,
          createdAt: img.createdAt
        });
      }
    });
    return Array.from(map.values());
  }, [adapterImages, directImages]);

  const generalCombinedImages = useMemo(() => {
    const map = new Map();
    (generalImages || []).forEach(img => {
      const id = String(img.id || img.mediaId);
      map.set(id, {
        mediaId: id,
        id,
        userId: null,
        url: img.url,
        title: img.title || img.name || img.filename || 'Imagem',
        filename: img.filename || 'Imagem',
        mimeType: img.mimeType,
        createdAt: img.createdAt || img.uploadedAt
      });
    });
    return Array.from(map.values());
  }, [generalImages]);

  const activeImageList = activeMainTab === 'personal' ? personalCombinedImages : generalCombinedImages;

  const pngImages = useMemo(() => {
    return activeImageList.filter(img => getImageCategory(img) === 'imagen-png');
  }, [activeImageList]);

  const gifImages = useMemo(() => {
    return activeImageList.filter(img => getImageCategory(img) === 'imagen-gif');
  }, [activeImageList]);

  const visibleImages = activeCategory === 'imagen-gif' ? gifImages : pngImages;

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Galeria de Imagens"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c101c] shadow-2xl"
      >
        {/* Cabeçalho */}
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Galeria de Imagens</h2>
              <p className="text-xs text-slate-400">Escolha entre Galeria Pessoal e Galeria Geral</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar galeria"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* 2 Menus Principais no topo e Categorias (submenus) logo abaixo */}
        <div className="flex flex-col border-b border-white/10 bg-[#080c14]">
          {/* Menu Principal */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
            <button
              type="button"
              onClick={() => setActiveMainTab('personal')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeMainTab === 'personal'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Galeria Pessoal</span>
              <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-mono">
                {personalCombinedImages.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('general')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeMainTab === 'general'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Galeria Geral</span>
              <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-mono">
                {generalCombinedImages.length}
              </span>
            </button>
          </div>

          {/* Categorias / Submenus abaixo: imagen-png e imagen-gif */}
          <div className="flex items-center gap-2 px-5 py-2.5 bg-black/20">
            <span className="text-[11px] font-medium text-slate-400 mr-2">Categoria:</span>
            <button
              type="button"
              onClick={() => setActiveCategory('imagen-png')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeCategory === 'imagen-png'
                  ? 'bg-violet-600/80 text-white border border-violet-500/50 shadow-md'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>imagen-png</span>
              <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-mono">
                {activeMainTab === 'personal'
                  ? personalCombinedImages.filter(img => getImageCategory(img) === 'imagen-png').length
                  : generalCombinedImages.filter(img => getImageCategory(img) === 'imagen-png').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('imagen-gif')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeCategory === 'imagen-gif'
                  ? 'bg-violet-600/80 text-white border border-violet-500/50 shadow-md'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>imagen-gif</span>
              <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-mono">
                {activeMainTab === 'personal'
                  ? personalCombinedImages.filter(img => getImageCategory(img) === 'imagen-gif').length
                  : generalCombinedImages.filter(img => getImageCategory(img) === 'imagen-gif').length}
              </span>
            </button>
          </div>
        </div>

        {/* Conteúdo com imagens */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-5 custom-scrollbar">
          {loading && visibleImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-500 border-t-transparent mb-3" />
              <p className="text-xs text-slate-400">Carregando galeria…</p>
            </div>
          ) : visibleImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ImageIcon className="mb-2 h-10 w-10 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">
                Nenhuma imagem encontrada em {activeMainTab === 'personal' ? 'Galeria Pessoal' : 'Galeria Geral'} ({activeCategory})
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {activeMainTab === 'personal'
                  ? `Envie imagens ${activeCategory === 'imagen-gif' ? '.gif' : '.png'} pelo Perfil ou Painel para usar no Cenário.`
                  : `Nenhuma imagem ${activeCategory === 'imagen-gif' ? '.gif' : '.png'} na Galeria Geral.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {visibleImages.map((img) => (
                <button
                  key={img.mediaId || img.id}
                  type="button"
                  onClick={() => {
                    onSelect(img);
                    onClose();
                  }}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition hover:border-violet-500/70 hover:shadow-lg hover:shadow-violet-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
                >
                  <div className="relative flex h-36 w-full items-center justify-center overflow-hidden border-b border-white/5 bg-[#080c14] p-2">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
                    <img
                      src={img.url}
                      alt={img.title || img.filename || 'Imagem'}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300 border border-violet-500/30 backdrop-blur-md">
                      {activeCategory === 'imagen-gif' ? 'GIF' : 'PNG'}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center bg-violet-900/40 opacity-0 transition group-hover:opacity-100">
                      <span className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                        <Check className="h-3.5 w-3.5" /> Inserir
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-black/30">
                    <span
                      className="block truncate text-xs font-bold text-white group-hover:text-violet-300 transition"
                      title={img.title || img.filename}
                    >
                      {img.title || img.filename || 'Imagem'}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-400 capitalize">
                      {activeMainTab === 'personal' ? 'Pessoal' : 'Geral'} • {activeCategory}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
