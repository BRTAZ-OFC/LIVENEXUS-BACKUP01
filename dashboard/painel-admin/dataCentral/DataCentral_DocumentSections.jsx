import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Edit3, RefreshCw, Trash2, Check, X, Plus, Minus, User, UserCheck } from 'lucide-react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import { removeGalleryImage, hydrateUserGallery } from '@dashboard/painel-admin/Gallery_mediaStorageAdapter';

const titles = { scenarios: 'Cenários', overlays: 'Overlays', gallery: 'Galeria', library: 'Biblioteca' };
const libraryKinds = { songs: 'song', albums: 'album', artists: 'artist', playlists: 'playlist' };

const editableFields = {
  scenarios: ['name', 'description'],
  overlays: ['name', 'description'],
  gallery: ['title', 'name', 'description', 'caption'],
  library: ['name', 'title', 'description'],
};

const labels = {
  id: 'ID', mediaId: 'ID da mídia', videoId: 'ID do vídeo', userId: 'Usuário',
  name: 'Nome', title: 'Título', description: 'Descrição', caption: 'Legenda',
  mode: 'Modo', category: 'Categoria', type: 'Tipo', background: 'Background',
  thumbnail: 'Miniatura', cover: 'Capa', image: 'Imagem', url: 'Endereço',
  localPath: 'Caminho', filename: 'Arquivo', source: 'Origem',
  instances: 'Elementos', subcenarios: 'Subcenários', visualizerSize: 'Tamanho',
  gridSettings: 'Grade', activeSubcenarioId: 'Subcenário ativo',
};

const label = field => labels[field] || field.replace(/([a-z])([A-Z])/g, '$1 $2');
const itemId = record => record?.id || record?.mediaId || record?.videoId;

const rowsFor = (domain, data) => domain === 'library'
  ? Object.entries(libraryKinds).flatMap(([field, kind]) =>
    (Array.isArray(data?.[field]) ? data[field] : []).map(record => ({ record, kind })))
  : (Array.isArray(data) ? data : []).map(record => ({ record }));

const imageFor = (domain, record) => {
  if (!record) return null;
  if (domain === 'scenarios') return record.thumbnail || record.background?.image || record.subcenarios?.[0]?.background?.image;
  if (domain === 'overlays') return record.thumbnail || record.preview || record.background?.image;
  if (domain === 'gallery') return record.url || record.thumbnail;
  return record.thumbnail || record.cover || record.image;
};

const titleFor = record => record?.name || record?.title || record?.filename || (record ? itemId(record) : 'Item');

function Preview({ src, alt, large = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const size = large ? 'w-full h-44' : 'w-full h-24';
  return src && !failed
    ? <img src={src} alt={alt} onError={() => setFailed(true)} className={`${size} object-contain bg-black/40 rounded-lg max-w-full`} />
    : <div role="img" aria-label="Sem miniatura disponível" className={`${size} bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-xs text-slate-500`}>Sem miniatura</div>;
}

function Field({ name, value }) {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) return (
    <details className="rounded-lg border border-white/10 bg-black/20 p-3">
      <summary className="cursor-pointer text-xs text-violet-200">{label(name)} · {value.length} {value.length === 1 ? 'item' : 'itens'}</summary>
      <div className="space-y-2 mt-3">
        {value.map((item, index) => <Field key={index} name={item?.name || item?.title || `Item ${index + 1}`} value={item} />)}
      </div>
    </details>
  );
  if (typeof value === 'object') return (
    <details className="rounded-lg border border-white/10 bg-black/20 p-3">
      <summary className="cursor-pointer text-xs text-violet-200">{label(name)}</summary>
      <div className="grid gap-2 mt-3">{Object.entries(value).map(([key, nested]) =>
        <Field key={key} name={key} value={nested} />)}</div>
    </details>
  );
  return <div className="rounded-lg border border-white/10 bg-black/20 p-3 min-w-0">
    <p className="text-[10px] uppercase tracking-wide text-slate-500">{label(name)}</p>
    <p className="text-xs text-slate-200 break-all mt-1">{String(value)}</p>
  </div>;
}

export default function DocumentSections({ domain, adminMode = true }) {
  const { userId, scenarioBranch, overlayBranch, galleryBranch, libraryBranch, documentRtcRegistry, isTemplateAdmin } = useNewUserDataCentral();
  const branch = { scenarios: scenarioBranch, overlays: overlayBranch, gallery: galleryBranch, library: libraryBranch }[domain];
  
  const isAdmin = adminMode || isTemplateAdmin;

  // Estados de Usuários para o Painel Admin
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changes, setChanges] = useState({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [detailConfirmDelete, setDetailConfirmDelete] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUsersExpanded, setIsUsersExpanded] = useState(false);

  // Carrega todos os usuários cadastrados no Johnson
  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/document-users');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.users)) {
          setUsersList(json.users);
          return json.users;
        }
      }
    } catch (err) {
      console.error('[DocumentSections] Erro ao carregar usuários:', err);
    }
    return [];
  }, []);

  // Carrega registros para um usuário específico
  const loadForUser = useCallback(async (targetUser) => {
    if (!targetUser || !branch) return;
    setLoading(true);
    setError('');
    try {
      const targetId = targetUser.id;
      // Carrega registros do ramal com fallback para dados em cache do usuário
      let rawData = null;
      try {
        rawData = await branch('GET', { targetUserId: targetId });
      } catch {
        // Se falhar a requisição pontual, utiliza os dados já pré-carregados do usuário
        if (domain === 'scenarios') rawData = targetUser.scenarios;
        else if (domain === 'overlays') rawData = targetUser.overlays;
        else if (domain === 'gallery') rawData = targetUser.gallery;
        else if (domain === 'library') rawData = targetUser.library;
      }
      setRows(rowsFor(domain, rawData || []));
    } catch (failure) {
      setError(failure.message || 'Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  }, [domain, branch]);

  // Inicialização
  useEffect(() => {
    setRows([]);
    setSelected(null);
    setEditing(false);
    setConfirmDeleteId(null);
    setDetailConfirmDelete(false);
    setIsExpanded(false);
    setError('');

    if (isAdmin) {
      loadUsers().then(users => {
        if (users.length > 0) {
          // Mantém o usuário selecionado ou seleciona o primeiro
          setSelectedUser(prev => {
            const found = prev ? users.find(u => u.id === prev.id) : null;
            const chosen = found || users[0];
            loadForUser(chosen);
            return chosen;
          });
        }
      });
    } else {
      // Usuário autenticado
      if (userId && branch) {
        setLoading(true);
        branch('GET').then(data => {
          setRows(rowsFor(domain, data));
        }).catch(err => {
          setError(err.message || 'Erro ao carregar.');
        }).finally(() => {
          setLoading(false);
        });
      }
    }
  }, [domain, isAdmin, userId, branch, loadUsers, loadForUser]);

  // Troca de usuário selecionado
  const handleSelectUser = (userItem) => {
    setSelectedUser(userItem);
    setSelected(null);
    setEditing(false);
    setIsExpanded(false);
    loadForUser(userItem);
  };

  const open = async (record, kind, startEditing = false) => {
    setError('');
    setConfirmDeleteId(null);
    setDetailConfirmDelete(false);
    try {
      const targetId = itemId(record);
      const targetUserId = selectedUser?.id || userId;
      const result = await branch('GET', { id: targetId, kind, targetUserId });
      const docRecord = result || record;
      setSelected({ record: docRecord, kind });
      setChanges({});
      setEditing(startEditing);
    } catch {
      setSelected({ record, kind });
      setChanges({});
      setEditing(startEditing);
    }
  };

  const save = async () => {
    if (!selected || busy) return;
    const allowed = editableFields[domain] || [];
    const payload = Object.fromEntries(
      Object.entries(changes).filter(([field, value]) =>
        allowed.includes(field) && typeof value === 'string' && value !== (selected.record[field] ?? '')
      )
    );
    if (!Object.keys(payload).length) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const targetId = itemId(selected.record);
      const targetUserId = selectedUser?.id || userId;
      const updated = await branch('PATCH', {
        id: targetId,
        kind: selected.kind,
        payload: { changes: payload },
        targetUserId
      });
      const nextRecord = updated || { ...selected.record, ...payload };
      setSelected({ ...selected, record: nextRecord });
      setEditing(false);
      setChanges({});
      if (selectedUser) {
        await loadForUser(selectedUser);
        loadUsers();
      }
      if (domain === 'gallery') {
        hydrateUserGallery().catch(() => {});
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const removeSelected = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    try {
      const targetId = itemId(selected.record);
      const targetUserId = selectedUser?.id || userId;
      await branch('DELETE', { id: targetId, kind: selected.kind, targetUserId });
      if (domain === 'gallery') {
        removeGalleryImage(targetId);
      }
      setSelected(null);
      setEditing(false);
      setDetailConfirmDelete(false);
      if (selectedUser) {
        await loadForUser(selectedUser);
        loadUsers();
      }
      if (domain === 'gallery') {
        hydrateUserGallery().catch(() => {});
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const removeDirect = async (record, kind, e) => {
    if (e) e.stopPropagation();
    if (busy) return;
    const targetId = itemId(record);
    const targetUserId = selectedUser?.id || userId;
    setBusy(true);
    setError('');
    try {
      await branch('DELETE', { id: targetId, kind, targetUserId });
      if (domain === 'gallery') {
        removeGalleryImage(targetId);
      }
      setConfirmDeleteId(null);
      if (selected && itemId(selected.record) === targetId) {
        setSelected(null);
        setEditing(false);
      }
      if (selectedUser) {
        await loadForUser(selectedUser);
        loadUsers();
      }
      if (domain === 'gallery') {
        hydrateUserGallery().catch(() => {});
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label={titles[domain]} id="central-document-sections" className="space-y-4">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Documentos do Johnson de {titles[domain]}</h2>
          <p className="text-xs text-slate-400">
            {isAdmin ? 'Visualização de todos os usuários guardados no banco de dados.' : 'Documentos cadastrados da conta atual.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isAdmin && selectedUser) {
              loadUsers();
              loadForUser(selectedUser);
            } else if (branch) {
              branch('GET').then(data => setRows(rowsFor(domain, data)));
            }
          }}
          disabled={loading}
          className="text-xs text-violet-300 disabled:opacity-50 flex items-center gap-1 hover:text-violet-200 transition"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {error && <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}

      {/* SELEÇÃO DE USUÁRIOS NO PAINEL ADMIN: Mostra Todos os Usuários com o Nome Real */}
      {isAdmin && !selected && usersList.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Usuários cadastrados ({usersList.length})
            </span>
            <span className="text-[11px] text-slate-500">Clique para abrir todos os {titles[domain].toLowerCase()} do usuário</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-w-full overflow-hidden">
            {(isUsersExpanded ? usersList : usersList.slice(0, 4)).map((u) => {
              const isSelected = selectedUser?.id === u.id;
              const itemCount = u.totalItems?.[domain] ?? (
                domain === 'library'
                  ? (u.library?.songs?.length || 0) + (u.library?.albums?.length || 0)
                  : (u[domain]?.length || 0)
              );

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  className={`flex flex-col p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-violet-600/25 border-violet-500 text-white shadow-md'
                      : 'bg-black/30 border-white/10 hover:border-violet-500/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                      {isSelected ? <UserCheck size={14} className="text-violet-300 shrink-0" /> : <User size={14} className="text-slate-400 shrink-0" />}
                      <span className="truncate">{u.name}</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold shrink-0">
                      {itemCount}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono truncate">{u.id}</span>
                </button>
              );
            })}
          </div>

          {usersList.length > 4 && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setIsUsersExpanded(!isUsersExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-xs font-medium transition shadow-sm cursor-pointer"
              >
                {isUsersExpanded ? (
                  <>
                    <Minus size={13} />
                    <span>Recolher usuários</span>
                  </>
                ) : (
                  <>
                    <Plus size={13} />
                    <span>Mais usuários ({usersList.length - 4})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ÁREA DE MINIATURAS DO USUÁRIO SELECIONADO */}
      {!selected && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-white font-semibold flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <span>{titles[domain]} de:</span>
                    <span className="text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-md font-bold">
                      {selectedUser?.name || 'Usuário'}
                    </span>
                  </>
                ) : (
                  <span>Meus Documentos de {titles[domain]}</span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exibindo registros da conta. Clique em uma miniatura para abrir os detalhes ou use as ações nos cartões.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {rows.length} {rows.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {loading && !rows.length && <p className="text-xs text-slate-400 py-4 text-center">Carregando documentos…</p>}
          {!loading && !error && !rows.length && (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-xl">
              Nenhum item cadastrado para este usuário neste domínio.
            </div>
          )}

          {/* GRID COM 4 FAIXAS LATERAIS E BOTÃO + PARA ESTENDER */}
          {rows.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-full overflow-hidden">
                {(isExpanded ? rows : rows.slice(0, 4)).map(({ record, kind }, index) => {
                  const id = itemId(record);
                  const isConfirming = confirmDeleteId === id;

                  return (
                    <div
                      key={`${kind || domain}:${id || index}`}
                      className="group relative min-w-0 p-3 rounded-xl border border-white/10 bg-black/40 hover:border-violet-500/50 transition flex flex-col justify-between"
                    >
                      <div className="cursor-pointer" onClick={() => open(record, kind)}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-violet-300 uppercase bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                            {selectedUser?.name || `Usuário ${index + 1}`}
                          </span>
                          {kind && <span className="text-[10px] text-slate-400">{kind}</span>}
                        </div>
                        <Preview src={imageFor(domain, record)} alt={titleFor(record)} />
                        <p className="text-xs font-medium text-white truncate mt-2 group-hover:text-violet-300 transition">
                          {titleFor(record)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{id}</p>
                      </div>

                      {/* Ações da miniatura: Editar e Excluir */}
                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between gap-1">
                        {isConfirming ? (
                          <div className="w-full flex items-center justify-between gap-1 bg-red-950/60 p-1.5 rounded-lg border border-red-500/30">
                            <span className="text-[10px] text-red-200 font-medium">Excluir?</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => removeDirect(record, kind, e)}
                                disabled={busy}
                                title="Confirmar exclusão"
                                className="bg-red-600 hover:bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-medium disabled:opacity-50 transition flex items-center gap-0.5"
                              >
                                <Check size={10} /> Sim
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                className="bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] px-2 py-0.5 rounded transition flex items-center gap-0.5"
                              >
                                <X size={10} /> Não
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => open(record, kind, true)}
                              className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-violet-600/30 text-violet-300 text-xs font-medium flex items-center justify-center gap-1 transition"
                              title="Editar metadados"
                            >
                              <Edit3 size={12} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(id); }}
                              disabled={busy}
                              className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-red-600/30 text-red-300 text-xs font-medium flex items-center justify-center gap-1 transition disabled:opacity-50"
                              title="Excluir miniatura"
                            >
                              <Trash2 size={12} /> Excluir
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão de expansão (+) / recolhimento (-) */}
              {rows.length > 4 && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs font-medium transition shadow-sm cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <Minus size={14} /> Recolher caixa (mostrar 4 faixas)
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Ver mais itens (+{rows.length - 4})
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VISÃO DETALHADA DO DOCUMENTO SELECIONADO */}
      {selected && (
        <div className="rounded-xl border border-violet-500/30 bg-white/5 p-4 space-y-4" aria-label="Detalhes do documento">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setSelected(null); setEditing(false); setDetailConfirmDelete(false); }}
                className="text-violet-300 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
                aria-label="Voltar às miniaturas"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 className="text-white font-semibold break-all text-base">{titleFor(selected.record)}</h3>
                <span className="text-[11px] text-slate-400">
                  {selectedUser ? `Usuário: ${selectedUser.name}` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!editing && !detailConfirmDelete && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-xs bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 size={13} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailConfirmDelete(true)}
                    disabled={busy}
                    className="text-xs bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </>
              )}

              {detailConfirmDelete && (
                <div className="flex items-center gap-2 bg-red-950/70 border border-red-500/40 p-1.5 rounded-lg">
                  <span className="text-xs text-red-200 font-medium">Excluir este item?</span>
                  <button
                    type="button"
                    onClick={removeSelected}
                    disabled={busy}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs px-2.5 py-1 rounded font-medium disabled:opacity-50 transition"
                  >
                    Sim, excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailConfirmDelete(false)}
                    className="bg-white/10 hover:bg-white/20 text-slate-300 text-xs px-2.5 py-1 rounded transition"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Preview src={imageFor(domain, selected.record)} alt={titleFor(selected.record)} large />

            <div className="space-y-3">
              {editing ? (
                <div className="space-y-3">
                  {(editableFields[domain] || []).map((field) => (
                    <div key={field}>
                      <label className="block text-[11px] uppercase tracking-wide text-slate-400 mb-1">{label(field)}</label>
                      <input
                        type="text"
                        value={changes[field] !== undefined ? changes[field] : (selected.record[field] ?? '')}
                        onChange={(e) => setChanges({ ...changes, [field]: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
                      />
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={save}
                      disabled={busy}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                    >
                      Salvar alterações
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditing(false); setChanges({}); }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 text-xs rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(selected.record).map(([k, v]) => (
                    <Field key={k} name={k} value={v} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
