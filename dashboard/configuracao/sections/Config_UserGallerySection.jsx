// UserGallerySection — "Minha Galeria" do usuário na área de Perfil.
// Upload direto para Cloudinary (unsigned preset). Sem backend, sem Worker.
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@dashboard/login/AuthContext';
import { useUserGallery, uploadUserImage, deleteUserImage, hydrateUserGallery } from '@dashboard/painel-admin/Gallery_mediaStorageAdapter';
import { useAvatar, setAvatarUrl, getAvatarUrl } from '@dashboard/configuracao/avatar/Config_avatarStorageAdapter';
import { Trash2, Check, Image as ImageIcon, Loader2, UserCircle2, AlertTriangle, X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    hydrateUserGallery();
  }, [user?.id]);
  const selectedId = images.find(i => i.url === avatarUrl)?.mediaId || null;

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleFileSelection = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError('');
    setSuccessMessage('');

    const newFiles = [];
    let hasInvalid = false;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const isPngOrGif = ext === '.png' || ext === '.gif' || file.type === 'image/png' || file.type === 'image/gif';

      if (!isPngOrGif) {
        hasInvalid = true;
        continue;
      }

      newFiles.push({
        file,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file)
      });
    }

    if (hasInvalid) {
      setUploadError('este arquivo viola as regras da plataforma, use somente png ou gif!');
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleInputChange = (e) => {
    handleFileSelection(e.target.files);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => {
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearSelectedFiles = () => {
    selectedFiles.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setSelectedFiles([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || uploading) return;
    setUploading(true);
    setUploadError('');
    setSuccessMessage('');
    setUploadProgress(`Preparando ${selectedFiles.length} arquivo(s)...`);

    const failed = [];
    let uploadedCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      setUploadProgress(`Enviando ${i + 1} de ${selectedFiles.length}: ${item.name}...`);
      try {
        await uploadUserImage(item.file);
        uploadedCount++;
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      } catch (err) {
        failed.push({ item, error: err.message || 'Falha no envio.' });
      }
    }

    await hydrateUserGallery();

    if (failed.length === 0) {
      setSelectedFiles([]);
      if (fileRef.current) fileRef.current.value = '';
      setSuccessMessage(`${uploadedCount} imagem(ns) enviada(s) com sucesso para sua galeria!`);
    } else {
      setSelectedFiles(failed.map(f => f.item));
      const errMsg = failed.map(f => `${f.item.name}: ${f.error}`).join(' | ');
      setUploadError(errMsg);
      if (uploadedCount > 0) {
        setSuccessMessage(`${uploadedCount} imagem(ns) enviada(s) com sucesso. ${failed.length} falharam.`);
      }
    }

    setUploading(false);
    setUploadProgress('');
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

      {/* Notificações de Erro e Sucesso */}
      {uploadError && (
        <div role="alert" className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError('')} className="ml-auto text-red-400 hover:text-red-200 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {successMessage && (
        <div role="status" className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} className="ml-auto text-emerald-400 hover:text-emerald-200 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Zona de Drop & Seleção de Múltiplos Arquivos */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 mb-4 ${
          isDragging 
            ? 'border-violet-400 bg-violet-600/15' 
            : 'border-white/15 bg-black/30 hover:border-violet-500/50 hover:bg-violet-600/5'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".png,.gif,image/png,image/gif"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
          <Upload size={22} />
        </div>

        <div>
          <p className="text-xs font-semibold text-white">
            Clique para selecionar ou arraste arquivos aqui
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Formatos obrigatórios: <strong className="text-violet-300">.png</strong> e <strong className="text-violet-300">.gif</strong> · Suporta seleção múltipla
          </p>
        </div>
      </div>

      {/* Lista de Arquivos Selecionados / Fila de Upload */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3 mb-6 p-4 rounded-xl bg-black/40 border border-violet-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              Arquivos selecionados ({selectedFiles.length}):
            </span>
            <button
              type="button"
              onClick={clearSelectedFiles}
              disabled={uploading}
              className="text-slate-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              Limpar seleção
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-56 overflow-y-auto p-1">
            {selectedFiles.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="relative group p-2 rounded-xl bg-black/50 border border-white/10 flex flex-col items-center text-center"
              >
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-16 h-16 object-contain rounded bg-black/40 mb-1.5"
                />
                <p className="text-[11px] font-medium text-white truncate w-full" title={item.name}>
                  {item.name}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatBytes(item.size)}
                </span>

                {!uploading && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeSelectedFile(index); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow opacity-80 group-hover:opacity-100 transition cursor-pointer"
                    title="Remover da lista"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={uploading || selectedFiles.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold transition disabled:opacity-50 shadow-md cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{uploadProgress || 'Enviando...'}</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>Enviar {selectedFiles.length} imagem(ns) para Minha Galeria</span>
              </>
            )}
          </button>
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