import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  RefreshCw, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileImage,
  Eye,
  ArrowRight
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(iso);
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export default function GeneralGallery({ onSwitchToPersonal = null }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados da Área de Upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  // Estados da Tabela e Ações
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fileInputRef = useRef(null);

  // Carrega a lista do Johnson CRUD da Galeria Geral
  const fetchGallery = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/general-gallery?action=get-gallery');
      if (!res.ok) {
        throw new Error(`Falha na requisição (${res.status})`);
      }
      const data = await res.json();
      if (data.ok && Array.isArray(data.gallery)) {
        setRecords(data.gallery);
      } else {
        throw new Error(data.error || 'Erro ao carregar registros da Galeria Geral');
      }
    } catch (err) {
      setError(err.message || 'Erro ao conectar à Galeria Geral');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Limpa mensagens após 5 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Validação e seleção de múltiplos arquivos
  const handleFileSelection = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setError('');
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
      setError('este arquivo viola as regras da plataforma, use somente png ou gif!');
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleInputChange = (e) => {
    handleFileSelection(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Envio múltiplo para dashboard/Imagem/ e registro no Johnson CRUD
  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || uploading) return;
    setUploading(true);
    setError('');
    setSuccessMessage('');
    setUploadProgress(`Preparando ${selectedFiles.length} arquivo(s)...`);

    try {
      const payloadFiles = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`Processando arquivo ${i + 1} de ${selectedFiles.length}: ${selectedFiles[i].name}...`);
        const base64Data = await readFileAsBase64(selectedFiles[i].file);
        payloadFiles.push({
          filename: selectedFiles[i].name,
          fileData: base64Data
        });
      }

      setUploadProgress(`Enviando para dashboard/Imagem/ e registrando no Johnson CRUD...`);
      const res = await fetch('/api/admin/general-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: payloadFiles })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao enviar imagens.');
      }

      // Sucesso: limpar fila, notificar e atualizar a tabela da Galeria Geral
      clearSelectedFiles();
      setSuccessMessage(`${data.records?.length || payloadFiles.length} imagem(ns) enviada(s) e registrada(s) com sucesso na Galeria Geral!`);
      if (Array.isArray(data.gallery)) {
        setRecords(data.gallery);
      } else {
        await fetchGallery();
      }
    } catch (err) {
      setError(err.message || 'Erro durante o envio.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // Exclusão de registro da Galeria Geral
  const handleDeleteRecord = async (record) => {
    if (!record || deletingId) return;
    const targetId = record.id;
    setDeletingId(targetId);
    setError('');
    try {
      const res = await fetch('/api/admin/general-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-image',
          id: targetId,
          filename: record.filename
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao excluir imagem.');
      }
      setConfirmDeleteId(null);
      if (Array.isArray(data.gallery)) {
        setRecords(data.gallery);
      } else {
        await fetchGallery();
      }
      setSuccessMessage(`Imagem "${record.filename}" excluída com sucesso!`);
    } catch (err) {
      setError(err.message || 'Erro ao excluir imagem.');
    } finally {
      setDeletingId(null);
    }
  };

  // Copiar URL para a área de transferência
  const copyUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }).catch(() => {});
  };

  // Filtragem de registros
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const q = searchTerm.toLowerCase();
    return records.filter(r => 
      (r.id && r.id.toLowerCase().includes(q)) ||
      (r.filename && r.filename.toLowerCase().includes(q)) ||
      (r.url && r.url.toLowerCase().includes(q))
    );
  }, [records, searchTerm]);

  return (
    <div className="space-y-6" id="central-general-gallery-container">
      {/* CABEÇALHO DA SEÇÃO */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/20 rounded-xl border border-violet-500/30 text-violet-300">
            <ImageIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Galeria Geral</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Johnson CRUD
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10">
                userId: null
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Arquivos físicos armazenados em <code className="text-violet-300 bg-black/40 px-1 py-0.5 rounded">dashboard/Imagem/</code> e registros no padrão <code className="text-violet-300 bg-black/40 px-1 py-0.5 rounded">galeria.json</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSwitchToPersonal && (
            <button
              type="button"
              onClick={onSwitchToPersonal}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Acessar Galeria Pessoal independente"
            >
              <span>Galeria Pessoal</span>
              <ArrowRight size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={fetchGallery}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-200 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Recarregar registros da Galeria Geral"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* MENSAGENS DE NOTIFICAÇÃO */}
      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-200">
            <X size={14} />
          </button>
        </div>
      )}

      {successMessage && (
        <div role="status" className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} className="ml-auto text-emerald-400 hover:text-emerald-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÁREA DE UPLOAD: UPLOAD GALERIA GERAL                                     */}
      {/* ========================================================================= */}
      <section 
        aria-label="Upload Galeria Geral" 
        id="area-upload-galeria-geral"
        className="rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-950/20 to-black/40 p-5 space-y-4 shadow-lg backdrop-blur-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload size={16} className="text-violet-400" />
              Upload Galeria Geral
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecione e envie múltiplas imagens (<strong className="text-violet-300">PNG</strong> e <strong className="text-violet-300">GIF</strong>) diretamente para a pasta <code className="text-violet-300">dashboard/Imagem/</code>
            </p>
          </div>
          <span className="text-[11px] text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
            Padrão de gravação: <strong className="text-white">Johnson CRUD Galeria Geral</strong>
          </span>
        </div>

        {/* Zona de Drop & Seleção de Arquivos */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
            isDragging 
              ? 'border-violet-400 bg-violet-600/15' 
              : 'border-white/15 bg-black/30 hover:border-violet-500/50 hover:bg-violet-600/5'
          }`}
        >
          <input
            ref={fileInputRef}
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
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Arquivos selecionados ({selectedFiles.length}):
              </span>
              <button
                type="button"
                onClick={clearSelectedFiles}
                disabled={uploading}
                className="text-slate-400 hover:text-white transition disabled:opacity-50"
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
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow opacity-80 group-hover:opacity-100 transition"
                      title="Remover da lista"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Ação de Disparo do Upload */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/5">
              <div className="text-xs text-slate-400">
                {uploadProgress ? (
                  <span className="text-violet-300 font-mono flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin" />
                    {uploadProgress}
                  </span>
                ) : (
                  <span>Pronto para enviar para <code>dashboard/Imagem/</code></span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={clearSelectedFiles}
                  disabled={uploading}
                  className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={uploading}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Enviar {selectedFiles.length} {selectedFiles.length === 1 ? 'imagem' : 'imagens'} para Galeria Geral</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* TABELA DA GALERIA GERAL                                                  */}
      {/* ========================================================================= */}
      <section 
        aria-label="Tabela da Galeria Geral" 
        id="tabela-galeria-geral-section"
        className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileImage size={16} className="text-violet-400" />
              Tabela da Galeria Geral
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Registros cadastrados no Johnson CRUD com identificação gerada a partir do nome da imagem
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'registro' : 'registros'}
            </span>

            {/* Barra de Pesquisa */}
            <div className="relative w-48 sm:w-60">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nome, ID ou URL..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Exibição da Tabela */}
        {loading && records.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Loader2 size={20} className="animate-spin text-violet-400" />
            <span>Carregando tabela da Galeria Geral...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-xl">
            {searchTerm ? 'Nenhum registro encontrado para o termo pesquisado.' : 'Nenhuma imagem cadastrada na Galeria Geral ainda.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3 w-16 text-center">Miniatura</th>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Usuário</th>
                  <th className="py-3 px-3">Arquivo</th>
                  <th className="py-3 px-3">Tamanho</th>
                  <th className="py-3 px-3">Data de Upload</th>
                  <th className="py-3 px-3">URL</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRecords.map((item, idx) => {
                  const id = item.id;
                  const isConfirming = confirmDeleteId === id;
                  const isDeleting = deletingId === id;

                  return (
                    <tr 
                      key={id || idx} 
                      className="hover:bg-white/[0.02] transition group"
                    >
                      {/* Miniatura */}
                      <td className="py-2.5 px-3 text-center">
                        <div 
                          onClick={() => setPreviewImage(item)}
                          className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 overflow-hidden cursor-pointer flex items-center justify-center mx-auto hover:border-violet-500 transition"
                          title="Clique para visualizar ampliado"
                        >
                          {item.url ? (
                            <img
                              src={item.url}
                              alt={item.filename || id}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <ImageIcon size={16} className="text-slate-600" />
                          )}
                        </div>
                      </td>

                      {/* ID gerado a partir do nome */}
                      <td className="py-2.5 px-3 font-mono font-medium text-violet-300">
                        <span className="bg-violet-950/40 border border-violet-800/40 px-2 py-0.5 rounded text-[11px]">
                          {id}
                        </span>
                      </td>

                      {/* userId: null */}
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-700/50">
                          {String(item.userId ?? 'null')}
                        </span>
                      </td>

                      {/* Filename */}
                      <td className="py-2.5 px-3 font-medium text-white max-w-[160px] truncate" title={item.filename}>
                        {item.filename || '—'}
                      </td>

                      {/* Size */}
                      <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                        {formatBytes(item.size)}
                      </td>

                      {/* Uploaded At */}
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {formatDate(item.uploadedAt)}
                      </td>

                      {/* URL */}
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-slate-400 font-mono text-[11px]" title={item.url}>
                            {item.url || '—'}
                          </span>
                          {item.url && (
                            <button
                              type="button"
                              onClick={() => copyUrl(item.url)}
                              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition shrink-0"
                              title="Copiar URL"
                            >
                              {copiedUrl === item.url ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-2.5 px-3 text-right">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1 bg-red-950/80 border border-red-500/40 p-1 rounded-lg">
                            <span className="text-[10px] text-red-200 px-1 font-medium">Excluir?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(item)}
                              disabled={isDeleting}
                              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition disabled:opacity-50 flex items-center gap-1"
                            >
                              {isDeleting ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                              <span>Sim</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isDeleting}
                              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] transition"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(item)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                              title="Visualizar imagem"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(id)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition cursor-pointer"
                              title="Excluir imagem e registro"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO AMPLIADA */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-zinc-950 border border-white/10 rounded-2xl max-w-2xl w-full p-5 space-y-4 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">{previewImage.filename}</h4>
                <p className="text-[11px] font-mono text-violet-300 mt-0.5">{previewImage.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-center bg-black/60 rounded-xl p-4 min-h-[220px] max-h-[400px] overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.filename}
                className="max-h-[360px] max-w-full object-contain"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-500 block uppercase text-[10px]">Tamanho</span>
                <span className="font-mono text-white">{formatBytes(previewImage.size)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-500 block uppercase text-[10px]">Usuário</span>
                <span className="font-mono text-zinc-300">{String(previewImage.userId ?? 'null')}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-500 block uppercase text-[10px]">Data</span>
                <span className="text-white truncate block">{formatDate(previewImage.uploadedAt)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-500 block uppercase text-[10px]">URL</span>
                <button
                  type="button"
                  onClick={() => copyUrl(previewImage.url)}
                  className="text-violet-300 hover:text-white font-mono truncate block text-left w-full flex items-center gap-1"
                >
                  <Copy size={11} />
                  <span className="truncate">{previewImage.url}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
