import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  RefreshCw, 
  Search, 
  Layers, 
  BookOpen, 
  Star, 
  MessageSquare, 
  Image as ImageIcon, 
  ChevronRight, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Key, 
  X
} from 'lucide-react';
import { authClient } from '@dashboard/login/authClient';

export default function AdminDatabaseExplorer() {
  const [tables, setTables] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTableKey, setActiveTableKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCRUD, setNewCRUD] = useState({ name: '', id: '', fields: [] });
  const [editingCRUD, setEditingCRUD] = useState(null);
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [editRecordJSON, setEditRecordJSON] = useState('');

  // Sincronizar o estado do formulário com o CRUD que está sendo editado
  useEffect(() => {
    if (editingCRUD) {
      setNewCRUD({
        name: editingCRUD.name || '',
        id: editingCRUD.id || activeTableKey || '',
        fields: editingCRUD.fields || []
      });
    } else {
      setNewCRUD({ name: '', id: '', fields: [] });
    }
  }, [editingCRUD, activeTableKey]);

  // Sincronizar o JSON editável do registro selecionado
  useEffect(() => {
    if (selectedRecord) {
      setEditRecordJSON(JSON.stringify(selectedRecord, null, 2));
      setIsEditingRecord(false);
    } else {
      setEditRecordJSON('');
      setIsEditingRecord(false);
    }
  }, [selectedRecord]);

  const handleDeleteRecord = async (recordId) => {
    if (!recordId) return;
    if (!confirm(`Deseja realmente excluir este registro permanentemente de ${tables[activeTableKey]?.name || ''}?`)) return;
    try {
      const res = await fetch(`/api/admin/database-record-admin?tableId=${activeTableKey}&recordId=${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
        headers: {
          ...(authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {})
        }
      });
      const data = await res.json();
      if (data.ok) {
        setSelectedRecord(null);
        await fetchDatabase();
      } else {
        alert(data.error || 'Erro ao excluir o registro.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDuplicateRecord = async (recordId) => {
    if (!recordId) return;
    try {
      const res = await fetch(`/api/admin/database-record-admin?tableId=${activeTableKey}&recordId=${encodeURIComponent(recordId)}`, {
        method: 'POST',
        headers: {
          ...(authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {})
        }
      });
      const data = await res.json();
      if (data.ok) {
        setSelectedRecord(null);
        await fetchDatabase();
      } else {
        alert(data.error || 'Erro ao duplicar o registro.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveRecordEdit = async (recordId) => {
    if (!recordId) return;
    try {
      const parsed = JSON.parse(editRecordJSON);
      const res = await fetch(`/api/admin/database-record-admin?tableId=${activeTableKey}&recordId=${encodeURIComponent(recordId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {})
        },
         body: JSON.stringify({ updatedRecord: parsed })
      });
      const data = await res.json();
      if (data.ok) {
        setIsEditingRecord(false);
        setSelectedRecord(parsed);
        await fetchDatabase();
      } else {
        alert(data.error || 'Erro ao salvar alterações do registro.');
      }
    } catch (err) {
      alert('Erro de sintaxe JSON: ' + err.message);
    }
  };

  const fetchDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/database-inspect', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          ...(authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setTables(data.tables || {});
        const keys = Object.keys(data.tables || {});
        if (keys.length > 0 && (!activeTableKey || !data.tables[activeTableKey])) {
          setActiveTableKey(keys[0]);
        }
      } else {
        setError(data.error || 'Erro ao carregar dados do banco.');
      }
    } catch (err) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const generateId = (name) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const handleCreateCRUD = async () => {
    try {
      const res = await fetch('/api/admin/database-create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {})
        },
        body: JSON.stringify(newCRUD)
      });
      const data = await res.json();
      if (data.ok) {
        setIsCreateModalOpen(false);
        setNewCRUD({ name: '', id: '', fields: [] });
        await fetchDatabase();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Erro ao criar CRUD: ' + err.message);
    }
  };

  const handleActionCRUD = async (action, id, payload = {}) => {
      if (action === 'delete' && !confirm('Excluir este CRUD permanentemente?')) return;
      
      let url = `/api/admin/database-admin?id=${id}`;
      let method = 'PATCH';
      
      if (action === 'delete') {
        method = 'DELETE';
      } else if (action === 'duplicate') {
        url = '/api/admin/database-admin/duplicate';
        method = 'POST';
      }

      try {
        const res = await fetch(url, {
            method: method,
            headers: { 
              'Content-Type': 'application/json', 
              ...(authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {}) 
            },
            body: action !== 'delete' ? JSON.stringify(payload) : null
        });
        const data = await res.json();
        if (data.ok) { 
          await fetchDatabase(); 
          setEditingCRUD(null); 
        } else {
          alert(data.error); 
        }
      } catch (err) { 
        alert(err.message); 
      }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  const currentTable = tables[activeTableKey] || null;

  // Filtrar registros com base no termo de busca
  const filteredRecords = useMemo(() => {
    if (!currentTable || !currentTable.records) return [];
    if (!searchTerm.trim()) return currentTable.records;
    const term = searchTerm.toLowerCase();
    return currentTable.records.filter(rec => {
      return Object.values(rec).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [currentTable, searchTerm]);

  // Derivar colunas dinâmicas a partir das chaves dos registros reais
  const columns = useMemo(() => {
    if (!filteredRecords || filteredRecords.length === 0) return ['id', 'userId', 'updatedAt', 'created_date'];
    const keysSet = new Set(['id', 'userId']);
    // Prioriza chaves comuns no início
    const priority = ['id', 'userId', 'name', 'title', 'email', 'mode', 'rating', 'category', 'rtcId'];
    
    filteredRecords.slice(0, 10).forEach(rec => {
      Object.keys(rec).forEach(k => keysSet.add(k));
    });

    const allKeys = Array.from(keysSet);
    return allKeys.sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    }).slice(0, 7); // Limita a 7 colunas principais na tabela para não estourar
  }, [filteredRecords]);

  const getTableIcon = (key) => {
    switch (key) {
      case 'cenarios': return Layers;
      case 'overlays': return Layers;
      case 'biblioteca': return BookOpen;
      case 'rtcIdentity': return Key;
      case 'reviews': return Star;
      case 'contacts': return MessageSquare;
      case 'templates': return ImageIcon;
      case 'userGalleries': return ImageIcon;
      default: return Database;
    }
  };

  const formatCellValue = (val) => {
    if (val === null || val === undefined) return <span className="text-slate-600 italic">null</span>;
    if (typeof val === 'boolean') return <span className={val ? 'text-emerald-400 font-mono text-xs' : 'text-rose-400 font-mono text-xs'}>{val ? 'true' : 'false'}</span>;
    if (typeof val === 'object') {
      const str = JSON.stringify(val);
      if (str.length > 30) {
        return <span className="text-violet-400 font-mono text-xs bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-800/40">{Array.isArray(val) ? `Array (${val.length})` : 'Object {...}'}</span>;
      }
      return <span className="text-slate-300 font-mono text-xs">{str}</span>;
    }
    const strVal = String(val);
    if (strVal.length > 40) {
      return <span title={strVal}>{strVal.slice(0, 40)}...</span>;
    }
    return strVal;
  };

  return (
    <div className="flex h-full bg-[#080b12] text-slate-200 overflow-hidden">
      {/* Coluna Lateral - Tabelas/CRUDs */}
      <aside className="w-72 bg-[#0b0f19] border-r border-white/10 flex flex-col shrink-0 select-none">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="text-violet-400" size={20} />
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">BANCO DE DADOS</h2>
              <p className="text-[10px] text-slate-400">Inspeção Real (Fase 1)</p>
            </div>
          </div>
          <button 
            onClick={fetchDatabase}
            disabled={loading}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition"
            title="Atualizar dados"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Tabelas Reais</span>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="text-[10px] bg-violet-600/30 text-violet-300 px-2 py-0.5 rounded border border-violet-500/30 hover:bg-violet-600/50 transition flex items-center gap-1"
            >
              <Plus size={10} /> Criar CRUD
            </button>
          </div>

          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
            {Object.entries(tables).map(([key, tbl]) => {
              const IconComp = getTableIcon(key);
              const isActive = activeTableKey === key;
              const count = tbl.records ? tbl.records.length : 0;
              const hasError = Boolean(tbl.error);

              return (
                <button
                  key={key}
                  onClick={() => { setActiveTableKey(key); setSearchTerm(''); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive 
                      ? 'bg-violet-600/20 text-white border border-violet-500/40 shadow-sm' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <IconComp size={15} className={isActive ? 'text-violet-400' : 'text-slate-500'} />
                    <span className="truncate">{tbl.name || key}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasError ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500" title="Erro ao consultar" />
                    ) : (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isActive ? 'bg-violet-500/30 text-violet-200' : 'bg-white/5 text-slate-400'}`}>
                        {count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-3 bg-black/20 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Modo Observabilidade</span>
          <span className="text-violet-400 font-mono">Leitura & Escrita</span>
        </div>
      </aside>

      {/* Área Principal - Registros / Tabela */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080b12] relative overflow-hidden">
        {loading && !currentTable ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <RefreshCw className="animate-spin text-violet-400" size={32} />
            <p className="text-sm text-slate-400">Consultando fontes reais de dados...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 p-6 text-center">
            <AlertCircle className="text-rose-400" size={36} />
            <h3 className="font-bold text-white text-base">Falha ao carregar banco de dados</h3>
            <p className="text-xs text-rose-300 max-w-md">{error}</p>
            <button onClick={fetchDatabase} className="mt-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition">Tentar novamente</button>
          </div>
        ) : currentTable ? (
          <>
            {/* Cabeçalho da Tabela */}
            <header className="p-4 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400">
                  {React.createElement(getTableIcon(activeTableKey), { size: 20 })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-base text-white">{currentTable.name}</h1>
                    <span className="text-[11px] font-mono bg-white/5 px-2 py-0.5 rounded text-slate-400 border border-white/5">{currentTable.path}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentTable.records.length} {currentTable.records.length === 1 ? 'registro encontrado' : 'registros encontrados'}
                    {currentTable.error && <span className="text-rose-400 ml-2">({currentTable.error})</span>}
                  </p>
                </div>
              </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Filtrar registros..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900/80 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition w-60"
                  />
                </div>
                {/* Ações de CRUD Dinâmico */}
                {activeTableKey && (
                    <div className="flex gap-2">
                        <button onClick={() => setEditingCRUD(tables[activeTableKey])} className="text-[11px] bg-sky-600/20 text-sky-300 px-2 py-1 rounded">Editar</button>
                        <button onClick={() => handleActionCRUD('duplicate', activeTableKey, { originalId: activeTableKey, newId: `${activeTableKey}-copy`, newName: `${currentTable.name} (Copy)` })} className="text-[11px] bg-amber-600/20 text-amber-300 px-2 py-1 rounded">Duplicar</button>
                        <button onClick={() => handleActionCRUD('delete', activeTableKey)} className="text-[11px] bg-rose-600/20 text-rose-300 px-2 py-1 rounded">Excluir</button>
                    </div>
                )}
                <button
                  onClick={fetchDatabase}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 transition"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  Atualizar
                </button>
              </div>
            </header>

            {/* Conteúdo / Tabela de Registros */}
            <div className="flex-1 overflow-auto p-4">
              {currentTable.records.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#0b0f19]/40 rounded-xl border border-white/5">
                  <Database className="text-slate-600 mb-2" size={40} />
                  <h3 className="font-semibold text-slate-300 text-sm">CRUD Vazio</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">Nenhum registro foi encontrado nesta fonte de dados no momento.</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#0b0f19]/40 rounded-xl border border-white/5">
                  <Search className="text-slate-600 mb-2" size={32} />
                  <h3 className="font-semibold text-slate-300 text-sm">Nenhum resultado para "{searchTerm}"</h3>
                  <p className="text-xs text-slate-500 mt-1">Tente buscar por outro termo.</p>
                </div>
              ) : (
                <div className="bg-[#0b0f19] rounded-xl border border-white/10 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        {columns.map(col => (
                          <th key={col} className="py-3 px-4">{col}</th>
                        ))}
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredRecords.map((record, idx) => (
                        <tr 
                          key={record.id || idx} 
                          onClick={() => setSelectedRecord(record)}
                          className="hover:bg-white/[0.04] transition cursor-pointer group"
                        >
                          <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                          {columns.map(col => (
                            <td key={col} className="py-3 px-4 font-mono text-slate-300 truncate max-w-[220px]">
                              {formatCellValue(record[col])}
                            </td>
                          ))}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedRecord(record); }}
                              className="px-2.5 py-1 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 rounded border border-violet-500/30 transition text-[11px] font-medium flex items-center gap-1 ml-auto"
                            >
                              Detalhes <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>

      {/* Modal de Criação ou Edição de CRUD */}
      {(isCreateModalOpen || editingCRUD) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0b0f19] border border-white/10 rounded-xl p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-4">
              {editingCRUD ? `Editar CRUD: ${editingCRUD.name || activeTableKey}` : 'Criar Novo CRUD'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome de Exibição</label>
                <input 
                  type="text" 
                  placeholder="Ex: Minha Tabela" 
                  value={newCRUD.name} 
                  onChange={e => setNewCRUD({...newCRUD, name: e.target.value, id: editingCRUD ? newCRUD.id : generateId(e.target.value)})} 
                  className="w-full bg-slate-900 rounded p-2 text-sm border border-slate-800 text-white focus:outline-none focus:border-violet-500" 
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Identificador Técnico</label>
                <input 
                  type="text" 
                  placeholder="Ex: minha-tabela" 
                  value={newCRUD.id} 
                  disabled={Boolean(editingCRUD)}
                  onChange={e => setNewCRUD({...newCRUD, id: e.target.value})} 
                  className="w-full bg-slate-900 rounded p-2 text-sm border border-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-violet-500" 
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Configuração de Campos</label>
                {newCRUD.fields.map((f, i) => (
                    <div key={i} className="flex gap-2 mt-2">
                        <input 
                          placeholder="Nome do campo" 
                          value={f.name} 
                          onChange={e => { const fs = [...newCRUD.fields]; fs[i].name = e.target.value; setNewCRUD({...newCRUD, fields: fs}); }} 
                          className="bg-slate-800 rounded p-1.5 text-xs w-full text-white border border-slate-700" 
                        />
                        <select 
                          value={f.type} 
                          onChange={e => { const fs = [...newCRUD.fields]; fs[i].type = e.target.value; setNewCRUD({...newCRUD, fields: fs}); }} 
                          className="bg-slate-800 rounded p-1.5 text-xs text-white border border-slate-700"
                        >
                            {['texto', 'número', 'boolean', 'data', 'objeto', 'array'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button 
                          onClick={() => setNewCRUD({...newCRUD, fields: newCRUD.fields.filter((_, idx) => idx !== i)})} 
                          className="text-rose-400 hover:text-rose-300 p-1 font-bold text-sm"
                        >
                          X
                        </button>
                    </div>
                ))}
                <button 
                  onClick={() => setNewCRUD({...newCRUD, fields: [...newCRUD.fields, {name: '', type: 'texto'}]})} 
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold mt-2.5 block"
                >
                  + Adicionar campo
                </button>
              </div>
              <button 
                onClick={editingCRUD ? () => handleActionCRUD('patch', activeTableKey, newCRUD) : handleCreateCRUD} 
                className="w-full bg-violet-600 hover:bg-violet-500 text-white p-2.5 rounded-lg text-sm font-bold mt-2 shadow-lg transition-all"
              >
                {editingCRUD ? 'Salvar Alterações' : 'Criar'}
              </button>
              <button 
                onClick={() => { setIsCreateModalOpen(false); setEditingCRUD(null); }} 
                className="w-full bg-white/5 hover:bg-white/10 border border-slate-800 text-white p-2.5 rounded-lg text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Painel de Detalhes do Registro (Drawer / Modal) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#0b0f19] border-l border-white/10 h-full flex flex-col shadow-2xl animate-slideLeft">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-2">
                <FileText className="text-violet-400" size={18} />
                <div>
                  <h3 className="font-bold text-sm text-white">Detalhes do Registro</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {selectedRecord.id || 'N/A'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Metadados Principais */}
              <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Tabela / CRUD</span>
                  <p className="text-xs font-bold text-white mt-0.5">{currentTable?.name}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">ID do Registro</span>
                  <p className="text-xs font-mono text-violet-300 mt-0.5">{selectedRecord.id || 'N/A'}</p>
                </div>
                {selectedRecord.userId && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">User ID</span>
                    <p className="text-xs font-mono text-emerald-300 mt-0.5">{selectedRecord.userId}</p>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Status de Persistência</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-emerald-400 text-xs">
                    <CheckCircle2 size={13} /> Persistido na Fonte Real
                  </div>
                </div>
              </div>

              {/* JSON Completo Organizado */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documento JSON Completo</span>
                  <div className="flex items-center gap-1.5">
                    {isEditingRecord ? (
                      <>
                        <button
                          onClick={() => handleSaveRecordEdit(selectedRecord.id)}
                          className="text-[11px] bg-emerald-600/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-600/50 transition font-bold"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setIsEditingRecord(false)}
                          className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-700 transition"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditingRecord(true)}
                          className="text-[11px] bg-sky-600/20 text-sky-300 px-2.5 py-0.5 rounded border border-sky-500/30 hover:bg-sky-600/40 transition font-bold"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDuplicateRecord(selectedRecord.id)}
                          className="text-[11px] bg-amber-600/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-500/30 hover:bg-amber-600/40 transition font-bold"
                        >
                          Duplicar
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(selectedRecord.id)}
                          className="text-[11px] bg-rose-600/20 text-rose-300 px-2.5 py-0.5 rounded border border-rose-500/30 hover:bg-rose-600/40 transition font-bold"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedRecord, null, 2))}
                      className="text-[11px] text-slate-400 hover:text-white transition ml-2"
                    >
                      Copiar JSON
                    </button>
                  </div>
                </div>
                {isEditingRecord ? (
                  <textarea
                    value={editRecordJSON}
                    onChange={(e) => setEditRecordJSON(e.target.value)}
                    className="w-full h-96 bg-[#05070c] p-4 rounded-xl border border-violet-500/40 text-xs font-mono text-violet-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                ) : (
                  <pre className="bg-[#05070c] p-4 rounded-xl border border-white/10 text-xs font-mono text-violet-200 overflow-x-auto max-h-[450px]">
                    {JSON.stringify(selectedRecord, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/30 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
