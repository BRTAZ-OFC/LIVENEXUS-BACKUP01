import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, RefreshCw, Trash2, Upload, ChevronLeft, ChevronRight, Edit2, Tag, FolderPlus } from 'lucide-react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';

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
  const [file, setFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('alerts');
  const [newCatInput, setNewCatInput] = useState('');
  const input = useRef(null);
  const owner = useRef(userId);
  owner.current = userId;

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

  const upload = async (event) => {
    event.preventDefault();
    if (busy || !file) return;
    if (!/\.(png|gif)$/i.test(file.name) || file.size > 10_000_000) {
      setError('este arquivo viola as regras da plataforma, use somente png ou gif!');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const fileData = await readImage(file);
      await templateBranch('POST', {
        payload: {
          action: 'upload',
          filename: file.name,
          fileData,
          name: uploadName || file.name.replace(/\.(png|gif)$/i, ''),
          category: uploadCategory
        }
      });
      setFile(null);
      setUploadName('');
      if (input.current) input.current.value = '';
      await refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
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
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
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
        <form onSubmit={upload} className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-3" aria-label="Upload administrativo de template">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Upload size={15} className="text-fuchsia-400" />
            Upload com Seleção de Pasta / Categoria
          </h3>
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
              Nome do Template
              <input
                value={uploadName}
                onChange={event => setUploadName(event.target.value)}
                maxLength={150}
                placeholder="Ex: Twitch Overlay Flame"
                className="block mt-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 w-full text-white text-xs"
              />
            </label>
          </div>
          <div>
            <input
              ref={input}
              aria-label="Arquivo PNG ou GIF"
              type="file"
              accept="image/png,image/gif,.png,.gif"
              onChange={event => setFile(event.target.files?.[0] || null)}
              className="text-xs text-slate-300 w-full block border border-white/10 rounded-lg p-1.5 bg-black/20"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy || !file}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50 transition"
          >
            Enviar Template para Pasta Selecionada
          </button>
        </form>
      </div>
    </section>
  );
}
