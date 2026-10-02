import React, { useState } from 'react';
import MusicGallery from '@dashboard/biblioteca/Library_MusicGallery';
import MusicQueue from '@dashboard/biblioteca/Library_MusicQueue';
import MusicHistory from '@dashboard/biblioteca/Library_MusicHistory';
import UserLibraryView from '@dashboard/biblioteca/Library_UserLibraryView';
import LibraryHeader from '@dashboard/biblioteca/Library_Header';
import FilterChips from '@dashboard/biblioteca/Library_FilterChips';
import BottomNav from '@dashboard/biblioteca/Library_BottomNav';

export default function PlayerBuster() {
  const [view, setView] = useState('home');
  // Busca global (cabeçalho fixo): query = texto do input; submitted = termo disparado.
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [filter, setFilter] = useState(null);

  const handleSearch = (term) => {
    const t = (term || '').trim();
    setQuery(term || '');
    setSubmitted(t);
    setFilter(null);
    if (t) setView('home'); // a galeria (home) mostra os resultados
  };

  return (
    <div className="min-h-full bg-transparent text-white safe-top">
      <LibraryHeader
        onUserLibrary={() => setView((v) => (v === 'userLibrary' ? 'home' : 'userLibrary'))}
        onHistory={() => setView((v) => (v === 'history' ? 'home' : 'history'))}
        activeView={view}
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={handleSearch}
      />

      {view === 'home' && (
        <FilterChips
          active={filter}
          onPick={(key) => {
            setFilter((prev) => (prev === key ? null : key));
            setSubmitted('');
            setQuery('');
            setView('home');
          }}
        />
      )}

      <main className="px-4 pb-28 pt-2">
        {/* home e search renderizam a galeria principal */}
        {(view === 'home' || view === 'search') && (
          <MusicGallery externalQuery={submitted} onSearch={handleSearch} filter={filter} />
        )}
        {/* Biblioteca Pessoal: userId -> D1 -> Central Global -> Interface */}
        {view === 'userLibrary' && (
          <UserLibraryView onBack={() => setView('home')} />
        )}
        {/* Histórico: reprodução real -> IndexedDB -> Interface */}
        {view === 'history' && (
          <Panel title="Histórico de Reprodução" subtitle="Músicas tocadas recentemente nesta máquina">
            <MusicHistory />
          </Panel>
        )}
        {view === 'queue' && (
          <Panel title="Fila de Reprodução" subtitle="Próximas faixas">
            <MusicQueue />
          </Panel>
        )}
      </main>

      <BottomNav active={view} onChange={setView} />
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="text-xs text-[#B3B3B3]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}