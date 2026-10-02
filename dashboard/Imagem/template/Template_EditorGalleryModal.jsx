import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';

// The document is the catalog authority. Bundled assets only resolve the physical
// image for records that already ship with the frontend; uploads use their API URL.
const includedAssets = import.meta.glob('/dashboard/Imagem/template/**/*.{png,gif}', {
  eager: true, query: '?url', import: 'default',
});
const imageFor = record => includedAssets[`/dashboard/Imagem/template/${record.localPath}`] || record.url;

function CategoryNavigation({ categories, selected, onSelect }) {
  const outer = useRef(null);
  const viewport = useRef(null);
  const content = useRef(null);
  const [overflow, setOverflow] = useState(false);
  const [position, setPosition] = useState({ start: true, end: true });

  const updatePosition = () => {
    const el = viewport.current;
    if (el) setPosition({ start: el.scrollLeft < 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  };

  useEffect(() => {
    const container = outer.current;
    const inner = content.current;
    if (!container || !inner) return;
    const measure = () => {
      // Compare the full, unwrapped content to the width before reserving controls.
      setOverflow(inner.scrollWidth > container.clientWidth + 1);
      updatePosition();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(inner);
    measure();
    return () => observer.disconnect();
  }, [categories]);

  const navigate = direction => viewport.current?.scrollBy({ left: direction * Math.max(80, viewport.current.clientWidth * 0.7), behavior: 'smooth' });

  return (
    <div ref={outer} className="w-full min-w-0" aria-label="Categorias de templates">
      <div className="grid min-w-0 items-center" style={{ gridTemplateColumns: overflow ? '24px minmax(0, 1fr) 24px' : 'minmax(0, 1fr)', columnGap: overflow ? 3 : 0 }}>
        {overflow && <button type="button" aria-label="Categorias anteriores" onClick={() => navigate(-1)} disabled={position.start} className="h-8 w-6 rounded text-slate-300 hover:bg-white/10 active:bg-white/20 disabled:text-slate-500 disabled:hover:bg-transparent">{'<'}</button>}
        <div ref={viewport} onScroll={updatePosition} className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollBehavior: 'smooth' }}>
          <div ref={content} className="flex w-max min-w-full gap-2 py-1">
            {categories.map(category => <button key={category} type="button" onClick={() => onSelect(category)} aria-pressed={category === selected}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${category === selected ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
              {category}
            </button>)}
          </div>
        </div>
        {overflow && <button type="button" aria-label="Próximas categorias" onClick={() => navigate(1)} disabled={position.end} className="h-8 w-6 rounded text-slate-300 hover:bg-white/10 active:bg-white/20 disabled:text-slate-500 disabled:hover:bg-transparent">{'>'}</button>}
      </div>
    </div>
  );
}

export default function TemplateEditorGalleryModal({ open, onClose, onSelect }) {
  const { templateBranch, userId } = useNewUserDataCentral();
  const [records, setRecords] = useState([]);
  const [serverCategories, setServerCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setRecords([]);
    setServerCategories([]);
    setLoading(true);
    setError('');
    templateBranch('GET').then(res => {
      if (!active) return;
      if (Array.isArray(res)) {
        setRecords(res);
      } else if (res && typeof res === 'object') {
        setRecords(res.templates || []);
        if (Array.isArray(res.categories)) setServerCategories(res.categories);
      }
    }).catch(failure => {
      if (active) setError(failure.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [open, templateBranch, userId]);

  useEffect(() => {
    if (!open) return;
    const escape = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open, onClose]);

  const categories = useMemo(() => {
    const set = new Set([...serverCategories, ...records.map(item => item.category || 'Sem categoria')]);
    return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [records, serverCategories]);
  const activeCategory = categories.includes(category) ? category : (categories[0] || '');
  const visible = records.filter(item => (item.category || 'Sem categoria') === activeCategory);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label="Galeria de Templates" onClick={event => event.stopPropagation()}
        className="flex max-h-[88vh] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c101c] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div><h2 className="text-lg font-bold text-white">Templates</h2><p className="text-xs text-slate-400">Galeria de templates pré-montados</p></div>
          <button type="button" onClick={onClose} aria-label="Fechar galeria de Templates" className="rounded px-3 py-1 text-slate-300 hover:bg-white/10 hover:text-white">Fechar</button>
        </header>
        <div className="min-h-0 min-w-0 overflow-y-auto p-5">
          {loading && <p className="text-sm text-slate-300">Carregando templates…</p>}
          {error && <p role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
          {!loading && !error && !records.length && <p className="text-sm text-slate-400">Nenhum template disponível.</p>}
          {!!categories.length && <div className="space-y-4">
            <CategoryNavigation categories={categories} selected={activeCategory} onSelect={setCategory} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 max-h-[60vh] overflow-y-auto overflow-x-hidden p-1 pr-2 [scrollbar-width:thin]">
              {visible.map(item => (
                <button key={item.id} type="button" onClick={() => { onSelect({ ...item, imageUrl: imageFor(item) }); onClose(); }}
                  className="group relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left hover:border-fuchsia-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-400 transition shadow-md">
                  <div className="relative h-36 w-full bg-[#080c14] flex items-center justify-center p-2 overflow-hidden border-b border-white/5">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />
                    <img src={imageFor(item)} alt={item.name} loading="lazy" className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-fuchsia-300 border border-fuchsia-500/30 backdrop-blur-md">
                      {item.format}
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/30">
                    <span className="block truncate text-xs font-bold text-white group-hover:text-fuchsia-300 transition" title={item.name}>{item.name}</span>
                    <span className="block text-[10px] text-slate-400 capitalize mt-0.5">{item.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>}
        </div>
      </section>
    </div>, document.body
  );
}
