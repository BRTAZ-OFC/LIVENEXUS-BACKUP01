import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Folder, UploadCloud, CheckCircle2, AlertCircle, Loader2, X, RefreshCw, FileText, Trash2, Database, Eye, ExternalLink } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const ACCEPTED_MIME_TYPES = 'image/png,image/jpeg,image/webp,image/gif';

export default function ImageUploadTestSection() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string, details?: any }
  
  const [physicalFiles, setPhysicalFiles] = useState([]);
  const [registeredGallery, setRegisteredGallery] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingModalImage, setViewingModalImage] = useState(null);

  // Carregar dados de arquivos físicos e do galeria.json
  const loadData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/lab/image-upload');
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setPhysicalFiles(data.files || []);
          setRegisteredGallery(data.gallery || []);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados do laboratório:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setStatus({
        type: 'error',
        message: `Formato inválido (${ext}). Formatos permitidos: PNG, JPG/JPEG, WEBP, GIF.`,
      });
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (e) => {
    e?.preventDefault();
    if (!selectedFile) {
      setStatus({
        type: 'error',
        message: 'Por favor, selecione uma imagem antes de enviar.',
      });
      return;
    }

    setUploading(true);
    setStatus(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const fileData = await base64Promise;

      const response = await fetch('/api/admin/lab/image-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          fileData: fileData,
        }),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        setStatus({
          type: 'success',
          message: `Imagem salva e registrada com sucesso no galeria.json!`,
          details: result,
        });
        handleClearSelection();
        loadData(); // recarrega fisicos e galeria.json
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Erro ao realizar upload da imagem.',
        });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: `Erro na comunicação com o servidor: ${err.message || String(err)}`,
      });
    } finally {
      setUploading(false);
    }
  };

  // Exclusão definitiva sincronizada: Remove do galeria.json E do diretório físico /dashboard/Imagem/
  const handleDeleteImage = async (item) => {
    if (!item?.id) return;
    setDeletingId(item.id);
    try {
      const response = await fetch('/api/admin/lab/image-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete-image',
          id: item.id,
          filename: item.filename,
        }),
      });

      const result = await response.json();
      if (response.ok && result.ok) {
        // Recarregar os dados para confirmar atualização sincronizada do JSON e dos arquivos físicos
        await loadData();
      } else {
        alert(result.error || 'Erro ao excluir imagem.');
      }
    } catch (err) {
      alert(`Erro ao excluir imagem: ${err.message || String(err)}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Exclusão pontual de arquivo físico órfão (caso exista algum fora do JSON)
  const handleDeleteOrphanFile = async (filename) => {
    if (!filename) return;
    try {
      const response = await fetch('/api/admin/lab/image-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete-orphan-file',
          filename,
        }),
      });
      const result = await response.json();
      if (response.ok && result.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Erro ao remover arquivo órfão:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Contêiner Principal - Upload */}
      <div className="rounded-2xl border border-white/10 bg-[#0a0d15] p-6 md:p-8 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
              <ImageIcon size={24} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Teste de Upload & Registro no JSON</h3>
                <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/40">
                  LABORATÓRIO
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Formulário para carregar a imagem na pasta <code className="text-violet-300 bg-violet-950/40 px-1 py-0.5 rounded">/dashboard/Imagem/</code> e registrar o caminho de referência no arquivo <code className="text-violet-300 bg-violet-950/40 px-1 py-0.5 rounded">galeria.json</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="grid gap-3 sm:grid-cols-3 pt-1">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 flex items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20">
              <Folder size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-500">Pasta Física</span>
              <p className="text-xs font-mono font-semibold text-violet-200 truncate">/dashboard/Imagem/</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 flex items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <Database size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-500">Índice JSON</span>
              <p className="text-xs font-mono font-semibold text-emerald-200 truncate">galeria.json</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 flex items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
              <UploadCloud size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-500">Extensões</span>
              <p className="text-xs font-mono font-semibold text-blue-200">PNG, JPG, WEBP, GIF</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleUpload} className="space-y-5 pt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIME_TYPES}
            onChange={handleFileChange}
            className="hidden"
            id="lab-image-file-input"
          />

          {!selectedFile ? (
            <label
              htmlFor="lab-image-file-input"
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-violet-500/30 rounded-2xl bg-violet-500/[0.02] hover:bg-violet-500/[0.06] hover:border-violet-400/50 cursor-pointer transition group text-center"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-3 group-hover:scale-105 transition-transform">
                <UploadCloud size={24} />
              </div>
              <span className="text-sm font-semibold text-white group-hover:text-violet-200 transition">
                Clique para selecionar uma imagem
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Formatos aceitos: PNG, JPG, JPEG, WEBP, GIF
              </span>
            </label>
          ) : (
            <div className="rounded-2xl border border-violet-500/30 bg-[#0e1322] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                  Arquivo Selecionado
                </span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title="Remover seleção"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/40 rounded-xl p-3 border border-white/5">
                {filePreview && (
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/60 flex items-center justify-center">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-violet-400 shrink-0" />
                    <span className="text-sm font-semibold text-white truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Tamanho: <strong className="text-slate-200">{formatFileSize(selectedFile.size)}</strong></span>
                    <span>•</span>
                    <span className="uppercase text-[11px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-slate-300">
                      {selectedFile.name.split('.').pop()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/5 transition shrink-0"
                >
                  Trocar imagem
                </button>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
                !selectedFile || uploading
                  ? 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30 active:scale-95'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Enviando & Gravando no JSON...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Enviar Imagem</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Feedback de Upload */}
        {status && (
          <div
            className={`rounded-xl p-4 flex items-start gap-3 border transition-all ${
              status.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 flex-1 min-w-0">
              <h4 className="text-xs font-bold">
                {status.type === 'success' ? 'Sucesso no Processamento' : 'Falha no Processamento'}
              </h4>
              <p className="text-xs leading-relaxed">{status.message}</p>
              {status.details?.record && (
                <div className="pt-2 text-[10px] font-mono text-emerald-300/80 bg-black/35 rounded p-2 border border-emerald-500/20 space-y-1">
                  <div>ID do Registro: <strong className="text-white">{status.details.record.id}</strong></div>
                  <div>Nome do Arquivo: <strong className="text-white">{status.details.record.filename}</strong></div>
                  <div>URL de Referência: <strong className="text-white">{status.details.record.url}</strong></div>
                </div>
              )}
            </div>
            <button
              onClick={() => setStatus(null)}
              className="p-1 rounded text-white/40 hover:text-white/80 transition"
              title="Fechar aviso"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ÁREA SOLICITADA: TESTE DE LEITURA DO JSON */}
      <div className="rounded-2xl border border-white/10 bg-[#0a0d15] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <Eye size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                TESTE DE LEITURA DO JSON (<code className="text-emerald-300 lowercase font-mono">galeria.json</code>)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Exibe as imagens carregadas de forma 100% dinâmica a partir do arquivo de índice JSON.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loadingData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <RefreshCw size={13} className={loadingData ? 'animate-spin text-emerald-400' : ''} />
            <span>Recarregar JSON</span>
          </button>
        </div>

        {registeredGallery.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center text-slate-500 text-xs">
            Nenhum registro ativo em <code className="text-emerald-400 font-mono">galeria.json</code>.<br />
            Faça o upload de uma imagem acima para criar um registro real neste índice.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {registeredGallery.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col rounded-xl border border-white/10 bg-black/30 overflow-hidden hover:border-emerald-500/30 transition flex-1"
              >
                {/* Carregamento real da imagem usando o campo url registrado no JSON */}
                <div className="relative h-36 bg-black/60 border-b border-white/5 flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="h-full w-full object-contain group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23f43f5e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E";
                    }}
                  />
                  <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono font-bold uppercase bg-black/80 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 shadow">
                    JSON LINK
                  </span>
                </div>

                {/* Detalhes do Registro do JSON */}
                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate" title={item.filename}>
                      <FileText size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{item.filename}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 bg-white/[0.02] p-1.5 rounded border border-white/5 overflow-x-auto whitespace-nowrap no-scrollbar">
                      <span className="text-slate-500">URL:</span> {item.url}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                      <span>Tam: {formatFileSize(item.size)}</span>
                      <span className="font-mono text-[9px] text-slate-600">ID: {item.id.slice(0, 10)}...</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Botão ABRIR IMAGEM usando exatamente o campo url do galeria.json */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setViewingModalImage(item)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 text-[11px] font-bold text-emerald-300 transition shrink-0 active:scale-95 text-center"
                      title={`Abrir imagem usando a referência exata do JSON: ${item.url}`}
                    >
                      <ExternalLink size={12} className="text-emerald-400" />
                      <span>ABRIR IMAGEM</span>
                    </a>

                    {/* Botão de Exclusão Sincronizada: Remove do JSON e apaga arquivo físico */}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(item)}
                      disabled={deletingId === item.id}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/50 text-[11px] font-bold text-rose-300 transition shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Excluir imagem: remove o registro do galeria.json e apaga o arquivo físico de /dashboard/Imagem/ (sincronizados)"
                    >
                      {deletingId === item.id ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-rose-400" />
                          <span>Excluindo imagem...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={12} className="text-rose-400" />
                          <span>EXCLUIR IMAGEM</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visualizador de arquivos físicos para confirmação de persistência */}
      <div className="rounded-2xl border border-white/10 bg-[#0a0d15] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder size={15} className="text-violet-400" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Arquivos físicos salvos em /dashboard/Imagem/ ({physicalFiles.length})
            </h4>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            SINCRONIZAÇÃO 100% ATIVA
          </span>
        </div>

        {physicalFiles.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 text-center text-slate-500 text-xs">
            Nenhum arquivo físico encontrado.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {physicalFiles.map((f, i) => {
              const isRegistered = registeredGallery.some(item => item.filename === f.name);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon size={13} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-white truncate" title={f.name}>
                        {f.name}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono">{formatFileSize(f.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                      isRegistered 
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-950/60 text-amber-400 border border-amber-500/20'
                    }`}>
                      {isRegistered ? 'Registrado' : 'Sem Registro'}
                    </span>
                    {!isRegistered && (
                      <button
                        type="button"
                        onClick={() => handleDeleteOrphanFile(f.name)}
                        className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 text-[9px] transition"
                        title="Remover este arquivo físico órfão"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmação/abertura da imagem com base no item.url do galeria.json */}
      {viewingModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewingModalImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#0a0d15] border border-white/15 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono tracking-wider">
                  Referência do galeria.json
                </span>
                <h3 className="text-sm font-semibold text-white font-mono truncate max-w-md">
                  {viewingModalImage.url}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingModalImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                title="Fechar visualização"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative max-h-[60vh] bg-black/60 rounded-xl border border-white/10 flex items-center justify-center p-4 overflow-hidden">
              <img
                src={viewingModalImage.url}
                alt={viewingModalImage.filename}
                className="max-h-[50vh] max-w-full object-contain rounded"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
              <div className="text-slate-400 font-mono text-[11px] truncate">
                Carregada via: <strong className="text-emerald-300">{viewingModalImage.url}</strong>
              </div>
              <a
                href={viewingModalImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/30 shrink-0"
              >
                <ExternalLink size={14} />
                <span>Abrir URL Direta no Navegador</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
