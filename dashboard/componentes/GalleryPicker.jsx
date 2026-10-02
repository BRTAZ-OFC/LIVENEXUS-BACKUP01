// GalleryPicker — seletor reutilizável da Minha Galeria.
// Mostra SOMENTE imagens do usuário autenticado (filtradas por userId no adapter).
// Seleção usa referência existente — SEM novo upload, SEM Cloudinary, SEM backend.
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUserGallery, hydrateUserGallery } from '@dashboard/painel-admin/Gallery_mediaStorageAdapter';
import { X, ImagePlus, Check } from 'lucide-react';

export default function GalleryPicker({ open, onClose, onSelect, title = 'Minha Galeria' }) {
  const images = useUserGallery();

  useEffect(() => {
    if (open) {
      hydrateUserGallery();
    }
  }, [open]);

  if (!open) return null;

  const handleSelect = (img) => {
    onSelect(img.url);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md pointer-events-auto p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0c101c] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <ImagePlus size={18} className="text-violet-300" /> {title}
          </h3>
          <button 
            onClick={onClose} 
            className="rounded-xl bg-white/5 p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white group active:scale-95"
            title="Fechar Galeria"
          >
            <X size={20} className="transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImagePlus size={32} className="mb-2 text-slate-600" />
            <p className="text-sm text-slate-500">Nenhuma imagem na galeria. Envie uma imagem pelo Perfil para começar.</p>
          </div>
        ) : (
          <div className="grid max-h-[60vh] grid-cols-4 gap-3 overflow-y-auto custom-scrollbar sm:grid-cols-5">
            {images.map(img => (
              <button
                key={img.mediaId}
                onClick={() => handleSelect(img)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/20 transition hover:border-violet-500/50 hover:ring-2 hover:ring-violet-500/30"
              >
                <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <Check size={20} className="text-white" />
                </div>
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-center text-[11px] text-slate-500">
          Selecione uma imagem existente — sem reenviar.
        </p>
      </div>
    </div>,
    document.body
  );
}