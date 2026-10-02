// UserGallerySection — "Minha Galeria" do usuário na área de Perfil.
// Upload direto para Cloudinary (unsigned preset). Sem backend, sem Worker.
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@dashboard/login/AuthContext';
import { useUserGallery, uploadUserImage, deleteUserImage, hydrateUserGallery } from '@dashboard/painel-admin/Gallery_mediaStorageAdapter';
import { useAvatar, setAvatarUrl, getAvatarUrl } from '@dashboard/configuracao/avatar/Config_avatarStorageAdapter';
import { ImagePlus, Trash2, Check, Image as ImageIcon, Loader2, UserCircle2, AlertTriangle, X } from 'lucide-react';

// Verifica se uma URL está referenciada em avatar.
function checkImageReferences(url) {
  const refs = [];
  if (getAvatarUrl() === url) refs.push('avatar do perfil');
  return refs;
}

export default function UserGallerySection() {
  const { user, updateUser } = useAuth();
  const images = useUserGallery();
  const avatarUrl = useAvatar();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    hydrateUserGallery();
  }, [user?.id]);
  const selectedId = images.find(i => i.url === avatarUrl)?.mediaId || null;

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      await uploadUserImage(file);
    } catch (e) {
      setUploadError(e.message || 'Falha no upload.');
    }
    setUploading(false);
  };

  const handleDeleteClick = (mediaId) => {
    const img = images.find(i => i.mediaId === mediaId);
    if (!img) return;
    const refs = checkImageReferences(img.url);
    if (refs.length > 0) {
      setPendingDelete({ mediaId, refs });
      return;
    }
    doDelete(mediaId);
  };

  const doDelete = async (mediaId) => {
    const img = images.find(i => i.mediaId === mediaId);
    if (img && img.url === avatarUrl) setAvatarUrl(null);
    await deleteUserImage(mediaId);
    setPendingDelete(null);
  };

  const handleSetAsAvatar = async (mediaId) => {
    const url = images.find(i => i.mediaId === mediaId)?.url;
    if (!url) return;
    setAvatarUrl(url);
    try {
      const newData = { ...(user.data || {}), avatar_url: url };
      await fetch('/api/auth/update-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: newData }),
      });
      updateUser({ data: newData });
    } catch (e) {
      console.error('Avatar save failed:', e);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <ImageIcon size={18} className="text-violet-300" />
        <h3 className="text-lg font-semibold text-white">Minha Galeria</h3>
        <span className="ml-auto text-xs text-slate-500">{images.length} imagem(ns)</span>
      </div>

      <p className="mb-4 text-xs text-slate-500">
        Biblioteca pessoal de imagens. Reutilizada por avatar — sem reenviar.
      </p>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 px-4 py-3 text-sm text-violet-300 transition hover:bg-violet-500/10 disabled:opacity-50"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        Enviar imagem
        <input ref={fileRef} type="file" accept=".png, .gif" className="hidden" onChange={e => { handleUpload(e.target.files?.[0]); e.target.value = ''; }} />
      </button>

      {uploadError && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {uploadError}
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <UserCircle2 size={32} className="mb-2 text-slate-600" />
          <p className="text-sm text-slate-500">Nenhuma imagem na galeria. Envie uma imagem para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map(img => (
            <div key={img.mediaId} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => handleSetAsAvatar(img.mediaId)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white transition hover:bg-violet-600" title="Usar como avatar">
                  <Check size={14} />
                </button>
                <button onClick={() => handleDeleteClick(img.mediaId)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600" title="Excluir imagem">
                  <Trash2 size={14} />
                </button>
              </div>
              {selectedId === img.mediaId && (
                <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg">
                  <Check size={12} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c101c] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-400" />
              <h4 className="text-sm font-semibold text-white">Excluir imagem?</h4>
              <button onClick={() => setPendingDelete(null)} className="ml-auto rounded-lg bg-white/5 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-400">Esta imagem está sendo utilizada em:</p>
            <ul className="mb-4 space-y-1">
              {pendingDelete.refs.map((ref, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {ref}
                </li>
              ))}
            </ul>
            <p className="mb-4 text-xs text-slate-500">Excluir a imagem pode quebrar essas referências. Deseja continuar?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPendingDelete(null)} className="rounded-lg bg-white/5 px-4 py-2 text-xs text-slate-300 hover:bg-white/10">Cancelar</button>
              <button onClick={() => doDelete(pendingDelete.mediaId)} className="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600">Excluir mesmo assim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}