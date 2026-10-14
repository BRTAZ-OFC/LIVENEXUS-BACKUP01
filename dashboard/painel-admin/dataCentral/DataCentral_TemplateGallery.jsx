import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, RefreshCw, Trash2, Upload, ChevronLeft, ChevronRight, Edit2, Tag, FolderPlus, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const defaultCategories = ['all', 'alerts', 'webcam', 'chat', 'banners', 'tickers', 'events', 'badges', 'overlays', 'widgets', 'animations', 'other'];

const includedAssets = import.meta.glob('/dashboard/Imagem/template/**/*.{png,gif}', { eager: true, query: '?url', import: 'default' });
const imageFor = record => includedAssets[`/dashboard/Imagem/template/${record.localPath}`] || record.url;

function TemplatePreview({ record, large = false }) {
  const [failed, setFailed] = useState(false);
  const src = imageFor(record);
  useEffect(() => setFailed(false), [src]);
  return src && !failed
    ? <div className={`w-full ${large ? 'h-64' : 'h-36'} flex items-center justify-center p-2 bg-[#080c14] border-b border-white/5 relative overflow-hidden group`}>
        {/* Transparent checkerboard background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />
        <img src={src} alt={record.name} onError={() => setFailed(true)} className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 z-10" loading="lazy" />
        <span className="absolute top-2 left-2 z-20 text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-fuchsia-300 border border-fuchsia-500/30 backdrop-blur-md">
          {record.format}
        </span>
      </div>
    : <div className={`w-full ${large ? 'h-64' : 'h-36'} grid place-items-center bg-white/5 text-xs text-slate-500`}>Sem miniatura</div>;
}

function CategoryCarousel({ categories, selected, onSelect, itemCounts }) {
  const outerRef = useRef(null);
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const [showControls, setShowControls] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setShowControls(hasOverflow);
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    checkScroll();
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [categories, checkScroll]);

  const scroll = (direction) => {
    const el = viewportRef.current;
    if (!el) return;
    const amount = Math.max(120, el.clientWidth * 0.6);
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <div ref={outerRef} className="w-full relative min-w-0 bg-black/30 p-2 rounded-xl border border-white/10">
      <div className="flex items-center gap-1 min-w-0">
        {showControls && (
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            aria-label="Categoria anterior"
            className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-white/5"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Carousel Viewport - Zero horizontal scrollbar */}
        <div
          ref={viewportRef}
          onScroll={checkScroll}
          className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div ref={contentRef} className="flex w-max min-w-full gap-2 py-0.5">
            {categories.map((cat) => {
              const isSelected = cat === selected;
              const count = itemCounts[cat] || 0;
              const label = cat === 'all' ? 'Todas' : cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelect(cat)}
                  aria-pressed={isSelected}
                  className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-lg shadow-fuchsia-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  <span className="capitalize">{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-black/40 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {showControls && (
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            aria-label="Próxima categoria"
            className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-white/5"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export default function TemplateGallery() {
  const { userId, isTemplateAdmin, templateBranch } = useNewUserDataCentral();
  const [records, setRecords] = useState([]);
  const [serverCategories, setServerCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('alerts');
  const [newCatInput, setNewCatInput] = useState('');
  const input = useRef(null);
  const owner = useRef(userId);
  owner.current = userId;

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const refresh = useCallback(async () => {
    if (!isTemplateAdmin) return;
    const current = userId;
    setLoading(true);
    setError('');
    try {
      const result = await templateBranch('GET');
      if (owner.current === current) {
        if (Array.isArray(result)) {
          setRecords(result);
        } else if (result && typeof result === 'object') {
          setRecords(result.templates || []);
          if (Array.isArray(result.categories)) setServerCategories(result.categories);
        }
      }
    } catch (failure) {
      if (owner.current === current) setError(failure.message);
    } finally {
      if (owner.current === current) setLoading(false);
    }
  }, [isTemplateAdmin, templateBranch, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Contagem de itens por categoria
  const itemCounts = useMemo(() => {
    const counts = { all: records.length };
    for (const r of records) {
      const cat = r.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [records]);

  // Categorias disponíveis únicas (incluindo diretórios físicos do servidor)
  const allCategoryList = useMemo(() => {
    const set = new Set(['all', ...defaultCategories, ...serverCategories]);
    for (const r of records) {
      if (r.category) set.add(r.category);
    }
    return [...set].sort((a, b) => (a === 'all' ? -1 : b === 'all' ? 1 : a.localeCompare(b, 'pt-BR')));
  }, [records, serverCategories]);

  // Handler para criar nova categoria / pasta
  const handleCreateCategory = async (event) => {
    event.preventDefault();
    if (busy || !newCatInput.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await templateBranch('POST', {
        payload: {
          action: 'create_category',
          categoryName: newCatInput.trim()
        }
      });
      const createdCategory = res?.category || newCatInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      setNewCatInput('');
      setUploadCategory(createdCategory);
      setSelectedCategory(createdCategory);
      await refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  // Registros filtrados pela categoria selecionada
  const filteredRecords = useMemo(() => {
    if (selectedCategory === 'all') return records;
    return records.filter(r => (r.category || 'other') === selectedCategory);
  }, [records, selectedCategory]);

  const handleQuickCategoryChange = async (record, newCategory) => {
    if (busy || record.category === newCategory) return;
    setBusy(true);
    setError('');
    try {
      await templateBranch('PATCH', {
        id: record.id,
        payload: { changes: { category: newCategory } }
      });
      await refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!editing || busy) return;
    setBusy(true);
    setError('');
    try {
      await templateBranch('PATCH', {
        id: editing.id,
        payload: { changes: { name: editing.name, category: editing.category, description: editing.description || '' } }
      });
      setEditing(null);
      setSelected(null);
      await refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (record) => {
    if (busy || !record) return;
    setBusy(true);
    setError('');
    try {
      await templateBranch('DELETE', { id: record.id });
      setSelected(null);
      setEditing(null);
      await refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  // Validação e seleção de múltiplos arquivos para templates
  const handleFileSelection = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setError('');
    setSuccessMessage('');

    const newFiles = [];
    let hasInvalid = false;

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      const isPngOrGif = ext === '.png' || ext === '.gif' || f.type === 'image/png' || f.type === 'image/gif';

      if (!isPngOrGif) {
        hasInvalid = true;
        continue;
      }

      newFiles.push({
        file: f,
        name: f.name,
        size: f.size,
        previewUrl: URL.createObjectURL(f)
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
    if (input.current) input.current.value = '';
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
    if (input.current) input.current.value = '';
  };

  const upload = async (event) => {
    if (event) event.preventDefault();
    if (busy || selectedFiles.length === 0) return;
    setBusy(true);
    setError('');
    setSuccessMessage('');
    setUploadProgress(`Preparando ${selectedFiles.length} template(s)...`);

    const failed = [];
    let uploadedCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      setUploadProgress(`Enviando template ${i + 1} de ${selectedFiles.length}: ${item.name}...`);
      try {
        const fileData = await readImage(item.file);
        const templateName = (selectedFiles.length === 1 && uploadName.trim())
          ? uploadName.trim()
          : item.name.replace(/\.(png|gif)$/i, '');

        await templateBranch('POST', {
          payload: {
            action: 'upload',
            filename: item.name,
            fileData,
            name: templateName,
            category: uploadCategory
          }
        });

        uploadedCount++;
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      } catch (err) {
        failed.push({ item, error: err.message || 'Falha no envio.' });
      }
    }

    await refresh();

    if (failed.length === 0) {
      setSelectedFiles([]);
      setUploadName('');
      if (input.current) input.current.value = '';
      setSuccessMessage(`${uploadedCount} template(s) enviado(s) com sucesso para a pasta "${uploadCategory}"!`);
    } else {
      setSelectedFiles(failed.map(f => f.item));
      const errMsg = failed.map(f => `${f.item.name}: ${f.error}`).join(' | ');
      setError(errMsg);
      if (uploadedCount > 0) {
        setSuccessMessage(`${uploadedCount} template(s) enviado(s) com sucesso. ${failed.length} falharam.`);
      }
    }

    setBusy(false);
    setUploadProgress('');
  };

  if (!isTemplateAdmin) return null;

  return (
    <section aria-label="Galeria Pública de Templates" id="central-template-gallery" className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ImageIcon size={18} className="text-fuchsia-400" />
            Galeria Pública de Templates ({records.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acervo de overlays em PNG transparente e GIF animado agrupado por pastas de categorias.
          </p>
        </div>
        <button
          type="button"
          aria-label="Atualizar templates"
          disabled={loading || busy}
          onClick={refresh}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Atualizar</span>
        </button>
      </header>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-200 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {successMessage && (
        <div role="status" className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} className="ml-auto text-emerald-400 hover:text-emerald-200 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navegação Horizontal por Categorias com Botões < > sem Scrollbar Horizontal */}
      <CategoryCarousel
        categories={allCategoryList}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        itemCounts={itemCounts}
      />

      {loading && !records.length && (
        <div className="p-8 text-center text-xs text-slate-400">Carregando acervo de templates…</div>
      )}

      {!loading && !records.length && !error && (
        <div className="p-8 text-center text-xs text-slate-400">Nenhum template cadastrado no momento.</div>
      )}

      {/* Caixa de Miniaturas com Auto Vertical Scroll (overflow-y-auto) e Sem Scrollbar Horizontal (overflow-x-hidden) */}
      {records.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Categoria ativa: <strong className="text-fuchsia-300 capitalize">{selectedCategory === 'all' ? 'Todas' : selectedCategory}</strong></span>
            <span>Exibindo <strong>{filteredRecords.length}</strong> {filteredRecords.length === 1 ? 'item' : 'itens'}</span>
          </div>

          <div className="max-h-[580px] overflow-y-auto overflow-x-hidden p-1 pr-2 space-y-4 [scrollbar-width:thin] [scrollbar-color:#3b0764_#0f172a]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRecords.map((record) => (
                <article key={record.id} className="bg-[#0b0f19] rounded-xl border border-white/10 overflow-hidden min-w-0 hover:border-fuchsia-500/40 transition flex flex-col justify-between shadow-lg">
                  <div>
                    <button
                      type="button"
                      onClick={() => { setSelected(record); setEditing(null); }}
                      aria-label={`Detalhes de ${record.name}`}
                      className="block w-full text-left"
                    >
                      <TemplatePreview record={record} />
                    </button>
                    <div className="p-3 space-y-2 text-xs min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-white font-bold truncate text-xs" title={record.name}>{record.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 shrink-0">
                          {record.format}
                        </span>
                      </div>

                      {/* Seletor rápido de Categoria direto no card para troca em 1 clique */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/5 p-1.5 rounded-lg border border-white/5">
                        <Tag size={12} className="text-fuchsia-400 shrink-0" />
                        <select
                          value={record.category || 'other'}
                          disabled={busy}
                          onChange={(e) => handleQuickCategoryChange(record, e.target.value)}
                          className="bg-transparent text-slate-200 font-semibold text-[11px] w-full focus:outline-none cursor-pointer capitalize"
                          aria-label={`Alterar categoria de ${record.name}`}
                        >
                          {allCategoryList.filter(c => c !== 'all').map(c => (
                            <option key={c} value={c} className="bg-slate-900 text-white capitalize">{c}</option>
                          ))}
                        </select>
                      </div>

                      <p className="text-[10px] text-slate-400 truncate" title={record.localPath}>
                        Pasta: <code className="text-slate-300">{record.localPath}</code>
                      </p>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1 flex items-center justify-between border-t border-white/5 text-xs">
                    <button
                      type="button"
                      onClick={() => { setSelected(record); setEditing(null); }}
                      className="text-violet-300 hover:text-violet-100 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      Ver detalhes
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelected(record); setEditing({ ...record }); }}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10"
                      title="Editar detalhes"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal / Painel de Detalhes e Edição Completa pelo Admin */}
      {selected && (
        <section aria-label="Detalhes do template" className="rounded-2xl border border-violet-500/30 bg-[#0c101c] p-4 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Tag size={16} className="text-fuchsia-400" />
              {selected.name}
            </h3>
            <button
              type="button"
              onClick={() => { setSelected(null); setEditing(null); }}
              className="text-xs bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1 rounded-lg"
            >
              Fechar
            </button>
          </div>

          <TemplatePreview record={selected} large />

          {!editing ? (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">ID do Template</p>
                  <p className="text-slate-200 break-all font-mono text-[11px]">{selected.id}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Categoria</p>
                  <p className="text-fuchsia-300 font-bold capitalize">{selected.category || 'Outra'}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Caminho do Arquivo</p>
                  <p className="text-slate-200 break-all font-mono text-[11px]">{selected.localPath}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Formato / Tamanho</p>
                  <p className="text-slate-200">{selected.format} · {(selected.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs pt-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditing({ ...selected })}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Edit2 size={14} /> Editar Categoria e Nome
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(selected)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-2 rounded-xl font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Excluir Template
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={save} className="border border-violet-500/30 rounded-xl p-4 space-y-3 bg-black/40" aria-label="Editar template">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Editar Informações do Template</h4>
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">
                  Nome do Template
                  <input
                    value={editing.name}
                    onChange={event => setEditing({ ...editing, name: event.target.value })}
                    maxLength={150}
                    required
                    className="block mt-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 w-full text-white text-xs focus:border-fuchsia-500 focus:outline-none"
                  />
                </label>
                <label className="block text-xs text-slate-300">
                  Categoria
                  <select
                    value={editing.category}
                    onChange={event => setEditing({ ...editing, category: event.target.value })}
                    className="block mt-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 w-full text-white text-xs focus:border-fuchsia-500 focus:outline-none capitalize"
                  >
                    {allCategoryList.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c} className="capitalize">{c}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-slate-300">
                  Descrição
                  <textarea
                    value={editing.description || ''}
                    onChange={event => setEditing({ ...editing, description: event.target.value })}
                    maxLength={1000}
                    rows={2}
                    className="block mt-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 w-full text-white text-xs focus:border-fuchsia-500 focus:outline-none"
                  />
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={busy} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs px-4 py-1.5 rounded-lg font-bold disabled:opacity-50">
                  Salvar Alterações
                </button>
                <button type="button" onClick={() => setEditing(null)} className="text-xs text-slate-300 hover:text-white px-3 py-1.5">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Formulários Administrativos: Criar Categoria/Pasta e Upload com Seleção de Pasta */}
      <div className="border-t border-white/10 pt-4 grid md:grid-cols-2 gap-4">
        {/* 1. Criar Nova Categoria / Pasta */}
        <form onSubmit={handleCreateCategory} className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-3" aria-label="Criar nova categoria ou pasta">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FolderPlus size={15} className="text-fuchsia-400" />
            Criar Nova Categoria / Pasta
          </h3>
          <p className="text-[11px] text-slate-400">
            Cria uma nova pasta no sistema (com arquivo .gitkeep) para agrupar templates.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCatInput}
              onChange={e => setNewCatInput(e.target.value)}
              placeholder="Ex: alertas_animados"
              maxLength={50}
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white w-full focus:border-fuchsia-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={busy || !newCatInput.trim()}
              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 shrink-0 transition"
            >
              Criar Pasta
            </button>
          </div>
        </form>

        {/* 2. Upload com Seleção de Pasta / Categoria */}
        <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-3" aria-label="Upload administrativo de template">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Upload size={15} className="text-fuchsia-400" />
              Upload com Seleção de Pasta / Categoria
            </h3>
            <span className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
              Destino: <strong className="text-fuchsia-300 capitalize">{uploadCategory}</strong>
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <label className="text-[11px] text-slate-300">
              Pasta / Categoria Destino
              <select
                value={uploadCategory}
                onChange={event => setUploadCategory(event.target.value)}
                className="block mt-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 w-full text-white text-xs capitalize"
              >
                {allCategoryList.filter(c => c !== 'all').map(c => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-slate-300">
              Nome do Template {selectedFiles.length > 1 ? '(múltiplos usam nomes originais)' : ''}
              <input
                value={uploadName}
                onChange={event => setUploadName(event.target.value)}
                maxLength={150}
                placeholder={selectedFiles.length > 1 ? 'Nomes individuais preservados' : 'Ex: Twitch Overlay Flame'}
                disabled={selectedFiles.length > 1}
                className="block mt-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 w-full text-white text-xs disabled:opacity-50"
              />
            </label>
          </div>

          {/* Zona de Drop & Seleção de Múltiplos Arquivos */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => input.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              isDragging 
                ? 'border-fuchsia-400 bg-fuchsia-600/15' 
                : 'border-white/15 bg-black/30 hover:border-fuchsia-500/50 hover:bg-fuchsia-600/5'
            }`}
          >
            <input
              ref={input}
              type="file"
              multiple
              accept="image/png,image/gif,.png,.gif"
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="w-10 h-10 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-300">
              <Upload size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                Clique para selecionar ou arraste templates aqui
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Formatos obrigatórios: <strong className="text-fuchsia-300">.png</strong> e <strong className="text-fuchsia-300">.gif</strong> · Suporta seleção múltipla
              </p>
            </div>
          </div>

          {/* Lista de Templates Selecionados / Fila de Upload */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 p-3 rounded-xl bg-black/40 border border-fuchsia-500/30 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  Templates selecionados ({selectedFiles.length}):
                </span>
                <button
                  type="button"
                  onClick={clearSelectedFiles}
                  disabled={busy}
                  className="text-slate-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
                >
                  Limpar seleção
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                {selectedFiles.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="relative group p-2 rounded-xl bg-black/50 border border-white/10 flex flex-col items-center text-center"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-14 h-14 object-contain rounded bg-black/40 mb-1"
                    />
                    <p className="text-[11px] font-medium text-white truncate w-full" title={item.name}>
                      {item.name}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatBytes(item.size)}
                    </span>

                    {!busy && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeSelectedFile(index); }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow opacity-80 group-hover:opacity-100 transition cursor-pointer"
                        title="Remover da lista"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={upload}
            disabled={busy || selectedFiles.length === 0}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{uploadProgress || 'Enviando...'}</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>
                  {selectedFiles.length === 0 
                    ? 'Selecione imagens para enviar' 
                    : `Enviar ${selectedFiles.length} Template(s) para "${uploadCategory}"`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
