import React, { useState } from 'react';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';
import RecordDetailModal from '@dashboard/painel-admin/dataCentral/DataCentral_RecordDetailModal';
import DocumentSections from '@dashboard/painel-admin/dataCentral/DataCentral_DocumentSections';
import TemplateGallery from '@dashboard/painel-admin/dataCentral/DataCentral_TemplateGallery';
import { 
  Database, 
  Video, 
  Star, 
  MessageSquare, 
  RefreshCw, 
  Radio, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  Trash2,
  Edit3,
  HardDrive,
  Search,
  AlertCircle,
  Layers,
  Image as ImageIcon,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAutoScroll } from '@dashboard/componentes/useAutoScroll';

export default function DataCentralPage({ initialDetail = null }) {
  const { ref: mainContentRef } = useAutoScroll({ speedMultiplier: 1.5 });
  const { ref: sidebarScrollRef } = useAutoScroll({ speedMultiplier: 1.5 });

  const documentTabs = [
    { key: 'scenarios', title: 'Cenários', icon: Layers },
    { key: 'overlays', title: 'Overlays', icon: Layers },
    { key: 'gallery', title: 'Galeria', icon: ImageIcon },
    { key: 'library', title: 'Biblioteca', icon: BookOpen },
    { key: 'templates', title: 'Templates', icon: ImageIcon },
    { key: 'reviews', title: 'Avaliações', icon: Star },
  ];
  const { 
    sessions, 
    reviews, 
    reviewsError,
    contacts, 
    rtcSession, 
    isLoading, 
    refreshAll,
    globalCache,
    clearCache,
    saveSession,
    deleteSession,
    saveReview,
    deleteReview,
    saveContact,
    deleteContact
  } = useNewUserDataCentral();

  const [selectedView, setSelectedView] = useState('db'); // 'db' | 'cache'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeDetail, setActiveDetail] = useState(initialDetail); // null = visão geral | 'sessions' | 'reviews' | 'contacts'
  const [activeDocument, setActiveDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedJsonId, setExpandedJsonId] = useState(null);

  // Estados de gestão administrativa de registros reais
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalType, setModalType] = useState(null); // 'sessions' | 'reviews' | 'contacts'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenEdit = (type, record) => {
    setSelectedRecord(record);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (payload) => {
    try {
      if (modalType === 'sessions') {
        await saveSession(payload.id, payload);
      } else if (modalType === 'reviews') {
        await saveReview(payload.id, payload);
      } else if (modalType === 'contacts') {
        await saveContact(payload.id, payload);
      }
      setSelectedRecord(payload);
    } catch (err) {
      console.error('Erro ao salvar registro:', err);
      throw err;
    }
  };

  const handleDeleteRecord = async (type, record) => {
    const id = record.id;
    try {
      if (type === 'sessions') {
        await deleteSession(id);
      } else if (type === 'reviews') {
        await deleteReview(id);
      } else if (type === 'contacts') {
        await deleteContact(id);
      }
      setIsModalOpen(false);
      setSelectedRecord(null);
    } catch (err) {
      console.error('Erro ao excluir registro:', err);
    }
  };

  const displaySessions = selectedView === 'db' ? sessions : (globalCache.sessions || []);
  const displayReviews = selectedView === 'db' ? reviews : (globalCache.reviews || []);
  const displayContacts = selectedView === 'db' ? contacts : (globalCache.contacts || []);

  const stats = [
    { 
      id: 'sessions', 
      label: 'Sessões/VODs', 
      count: displaySessions.length, 
      icon: Video, 
      color: 'text-emerald-400', 
      items: displaySessions 
    },
    { 
      id: 'reviews', 
      label: 'Avaliações', 
      count: displayReviews.length, 
      icon: Star, 
      color: 'text-amber-400', 
      items: displayReviews 
    },
    { 
      id: 'contacts', 
      label: 'Mensagens', 
      count: displayContacts.length, 
      icon: MessageSquare, 
      color: 'text-purple-400', 
      items: displayContacts 
    }
  ];

  const formatDate = (iso) => {
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
  };

  const term = searchTerm.toLowerCase();

  return (
    <div className="flex h-full w-full overflow-hidden" id="data-central-page-container">
      {/* Área Principal da Central */}
      <div ref={mainContentRef} className="flex-1 flex flex-col h-full space-y-6 overflow-y-auto pr-6 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        
        {/* Header Principal da Central */}
        <header className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/20 rounded-xl border border-violet-500/30">
              <Database className="text-violet-400" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Central de Dados</h1>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  selectedView === 'db' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {selectedView === 'db' ? 'Banco de Dados' : 'Armazenamento Local'}
                </span>
                {activeDetail && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-300 border border-violet-500/30">
                    Visão Detalhada
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualização dos documentos e do estado disponível nesta sessão
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedView === 'db' ? (
              <button 
                onClick={() => refreshAll(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white transition disabled:opacity-50 cursor-pointer shadow-sm"
                id="sync-db-btn"
                title="Sincronizar registros do banco"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-400' : ''} />
                Sincronizar Banco
              </button>
            ) : (
              <button 
                onClick={clearCache}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
                id="clear-cache-btn"
                title="Limpar todos os dados em cache"
              >
                <Trash2 size={14} />
                Limpar Cache
              </button>
            )}
          </div>
        </header>

        {/* ========================================================================= */}
        {/* CASO 1: VISÃO GERAL DA CENTRAL DE DADOS (Quando nenhum card foi expandido) */}
        {/* ========================================================================= */}
        {activeDocument ? (
          <div className="space-y-4" id="central-document-workspace">
            <header className="flex items-center gap-3 border-b border-white/10 pb-3">
              <button type="button" onClick={() => setActiveDocument(null)} className="text-xs text-violet-300 hover:text-white flex items-center gap-1"><ArrowLeft size={14} /> Visão Geral</button>
              <h2 className="text-lg text-white font-semibold">{documentTabs.find(tab => tab.key === activeDocument)?.title}</h2>
            </header>
            {activeDocument === 'templates' ? <TemplateGallery /> : <DocumentSections domain={activeDocument} adminMode={true} />}
          </div>
        ) : !activeDetail ? (
          <div className="space-y-6">
            
            {/* Grid de Cards de Resumo da Central */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
              {stats.map((stat) => (
                <motion.div 
                  key={stat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl flex flex-col justify-between transition group"
                  id={`stat-card-${stat.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">{stat.label}</p>
                      <p className="text-3xl font-bold text-white mt-1">{stat.count}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/5 ${stat.color} group-hover:scale-105 transition-transform`}>
                      <stat.icon size={26} />
                    </div>
                  </div>

                  {/* Ação discreta "Ver mais" */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {stat.count === 1 ? '1 registro' : `${stat.count} registros`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDetail(stat.id);
                        setSearchTerm('');
                      }}
                      className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1 transition cursor-pointer py-0.5 px-1.5 rounded hover:bg-violet-500/10"
                      id={`ver-mais-btn-${stat.id}`}
                    >
                      Ver mais
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Seções de Apoio da Visão Geral: Status RTC e Informações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
              {/* Status RTC */}
              <section className="bg-white/5 border border-white/5 rounded-xl p-6 flex flex-col space-y-4" id="rtc-status-section">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                    <Radio size={16} className="text-red-400" />
                    Sessão RTC Ativa
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    rtcSession.isRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {rtcSession.isRunning ? 'Running' : 'Idle'}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-[11px]">
                  <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                    <p className="text-slate-500 mb-1">Runtime ID:</p>
                    <p className="text-violet-300 break-all">{rtcSession.runtimeId || 'Nenhum'}</p>
                  </div>
                  {rtcSession.stats && (
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                      <p className="text-slate-500 mb-1">Peer Connections:</p>
                      <p className="text-white">{rtcSession.stats?.activeConnections || 0}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Informações da Infraestrutura */}
              <section className="bg-white/5 border border-white/5 rounded-xl p-6 flex flex-col space-y-4 overflow-hidden" id="sync-logs-section">
                <h2 className="text-sm font-bold text-white uppercase tracking-tight">Logs de Sincronização</h2>
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-[11px] text-slate-400">
                    <p>[INFO] Visualização selecionada: <strong className="text-violet-300 uppercase">{selectedView === 'db' ? 'Banco de Dados' : 'Armazenamento Local'}</strong></p>
                    <p className="mt-1">Disponibilidade dos ramais documentais: consulte o resultado de leitura em cada área acima.</p>
                  </div>
                  {selectedView === 'cache' && (
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-[11px] text-slate-400">
                      <p>[CACHE] Timestamp de Criação: <strong className="text-amber-400">{globalCache.timestamp ? new Date(globalCache.timestamp).toLocaleTimeString() : 'Nulo/Limpo'}</strong></p>
                      <p className="mt-1">A leitura do cache não renova sua validade.</p>
                    </div>
                  )}
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-[11px] text-slate-400">
                    <p>[INFO] Persistência D1/SQL não verificada nesta tela.</p>
                  </div>
                </div>
              </section>
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* CASO 2: VISÃO DETALHADA DENTRO DA CENTRAL (Ao clicar em "Ver mais")      */
          /* ========================================================================= */
          <div className="space-y-4 flex-1 flex flex-col min-h-0" id="central-detailed-view-container">
            
            {/* Barra de Retorno e Identificação da Categoria */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/5 border border-white/5 rounded-xl shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveDetail(null)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer border border-white/10 shadow-sm"
                  id="voltar-visao-geral-btn"
                >
                  <ArrowLeft size={14} />
                  Voltar à visão geral da Central
                </button>
                
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {activeDetail === 'sessions' && <><Video size={18} className="text-emerald-400" /> Sessões / VODs</>}
                    {activeDetail === 'reviews' && <><Star size={18} className="text-amber-400" /> Avaliações</>}
                    {activeDetail === 'contacts' && <><MessageSquare size={18} className="text-purple-400" /> Mensagens</>}
                  </h2>
                </div>
              </div>

              {/* Filtro de Busca Local */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar nos campos..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* CONTEÚDO DETALHADO POR CATEGORIA */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4">

              {/* ----------------- SESSÕES / VODS ----------------- */}
              {activeDetail === 'sessions' && (() => {
                const list = displaySessions.filter(s => 
                  (s.title || '').toLowerCase().includes(term) || 
                  (s.game || '').toLowerCase().includes(term) ||
                  (s.platform || '').toLowerCase().includes(term)
                );

                if (displaySessions.length === 0) {
                  return (
                    <div className="p-8 bg-white/5 border border-white/5 rounded-xl text-center text-slate-400 text-xs">
                      <AlertCircle size={24} className="mx-auto mb-2 text-slate-500" />
                      Nenhuma sessão ou VOD registrado ou recebido do backend.
                    </div>
                  );
                }

                if (list.length === 0) {
                  return (
                    <div className="p-8 bg-white/5 border border-white/5 rounded-xl text-center text-slate-400 text-xs">
                      Nenhuma sessão corresponde ao filtro de busca.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {list.map((sess, idx) => (
                      <div key={sess.id || idx} className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                Sessão #{idx + 1}
                              </span>
                              <span className="text-xs font-mono text-slate-400">ID: {sess.id || '—'}</span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1">
                              {sess.title || 'Sessão sem título'}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-xs font-mono text-slate-400">
                              Data: {formatDate(sess.created_date)}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit('sessions', sess)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-lg text-xs font-medium transition cursor-pointer"
                                title="Editar sessão"
                                id={`edit-session-${sess.id || idx}`}
                              >
                                <Edit3 size={13} />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord('sessions', sess)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition cursor-pointer"
                                title="Excluir sessão"
                                id={`delete-session-${sess.id || idx}`}
                              >
                                <Trash2 size={13} />
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Campos e Valores Reais da Sessão */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Plataforma</p>
                            <p className="text-white font-medium mt-0.5 uppercase">{sess.platform || '—'}</p>
                          </div>
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Jogo / Categoria</p>
                            <p className="text-white font-medium mt-0.5">{sess.game || '—'}</p>
                          </div>
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Status do VOD</p>
                            <p className="text-emerald-400 font-bold mt-0.5 uppercase">{sess.vodStatus || sess.status || 'ready'}</p>
                          </div>
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Duração</p>
                            <p className="text-slate-300 font-mono mt-0.5">{sess.duration || '—'}</p>
                          </div>
                        </div>

                        {(sess.url || sess.vodUrl) && (
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-xs">
                            <p className="text-[10px] uppercase font-bold text-slate-500">URL / Link da Transmissão</p>
                            <p className="text-violet-300 font-mono mt-0.5 break-all">{sess.url || sess.vodUrl}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ----------------- AVALIAÇÕES ----------------- */}
              {activeDetail === 'reviews' && (() => {
                const list = displayReviews.filter(r => 
                  (r.name || '').toLowerCase().includes(term) || 
                  (r.email || '').toLowerCase().includes(term) ||
                  (r.message || '').toLowerCase().includes(term)
                );

                if (displayReviews.length === 0) {
                  return (
                    <div className="p-8 bg-white/5 border border-white/5 rounded-xl text-center text-slate-400 text-xs">
                      <AlertCircle size={24} className="mx-auto mb-2 text-slate-500" />
                      Nenhuma avaliação registrada ou recebida do backend.
                    </div>
                  );
                }

                if (list.length === 0) {
                  return (
                    <div className="p-8 bg-white/5 border border-white/5 rounded-xl text-center text-slate-400 text-xs">
                      Nenhuma avaliação corresponde ao filtro de busca.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {list.map((rev, idx) => (
                      <div key={rev.id || idx} className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                Avaliação #{idx + 1}
                              </span>
                              <span className="text-xs font-mono text-slate-400">ID: {rev.id || '—'}</span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1">
                              {rev.name || 'Avaliador Anônimo'}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              <Star size={14} className="text-amber-400" fill="currentColor" />
                              <span className="text-xs font-bold text-amber-300">{rev.rating || 5} de 5</span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">{formatDate(rev.created_date)}</span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit('reviews', rev)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-lg text-xs font-medium transition cursor-pointer"
                                title="Editar avaliação"
                                id={`edit-review-${rev.id || idx}`}
                              >
                                <Edit3 size={13} />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord('reviews', rev)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition cursor-pointer"
                                title="Excluir avaliação"
                                id={`delete-review-${rev.id || idx}`}
                              >
                                <Trash2 size={13} />
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Campos e Valores Reais da Avaliação */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Nome</p>
                            <p className="text-white font-medium mt-0.5">{rev.name || '—'}</p>
                          </div>
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">E-mail</p>
                            <p className="text-slate-300 font-mono mt-0.5">{rev.email || '—'}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-xs space-y-1">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Depoimento / Comentário Real</p>
                          <p className="text-slate-200 leading-relaxed font-sans">{rev.message || 'Sem comentário registrado.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ----------------- MENSAGENS / CONTATOS ----------------- */}
              {activeDetail === 'contacts' && (() => {
                const list = displayContacts.filter(c => 
                  (c.name || '').toLowerCase().includes(term) || 
                  (c.email || '').toLowerCase().includes(term) ||
                  (c.category || '').toLowerCase().includes(term) ||
                  (c.message || '').toLowerCase().includes(term)
                );

                if (displayContacts.length === 0) {
                  return (
                    <div className="p-8 bg-white/5 border border-white/5 rounded-xl text-center text-slate-400 text-xs">
                      <AlertCircle size={24} className="mx-auto mb-2 text-slate-500" />
                      Nenhuma mensagem registrada ou recebida do backend.
                    </div>
                  );
                }

                if (list.length === 0) {
                  return (
                    <div className="p-8 bg-white/5 border border-white/5 rounded-xl text-center text-slate-400 text-xs">
                      Nenhuma mensagem corresponde ao filtro de busca.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {list.map((msg, idx) => (
                      <div key={msg.id || idx} className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                Mensagem #{idx + 1}
                              </span>
                              <span className="text-xs font-mono text-slate-400">ID: {msg.id || '—'}</span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1">
                              {msg.name || 'Remetente sem nome'}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 text-slate-300 border border-white/10">
                              Status: {msg.status || 'novo'}
                            </span>
                            <span className="text-xs font-mono text-slate-400">{formatDate(msg.created_date)}</span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit('contacts', msg)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-lg text-xs font-medium transition cursor-pointer"
                                title="Editar mensagem"
                                id={`edit-contact-${msg.id || idx}`}
                              >
                                <Edit3 size={13} />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord('contacts', msg)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition cursor-pointer"
                                title="Excluir mensagem"
                                id={`delete-contact-${msg.id || idx}`}
                              >
                                <Trash2 size={13} />
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Campos e Valores Reais da Mensagem */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Nome do Remetente</p>
                            <p className="text-white font-medium mt-0.5">{msg.name || '—'}</p>
                          </div>
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Endereço de E-mail</p>
                            <p className="text-slate-300 font-mono mt-0.5">{msg.email || '—'}</p>
                          </div>
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Categoria / Assunto</p>
                            <p className="text-white font-medium mt-0.5">{msg.category || 'Geral'}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-xs space-y-1">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Mensagem Completa</p>
                          <p className="text-slate-200 leading-relaxed font-sans">{msg.message || 'Sem conteúdo de texto.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>

          </div>
        )}

      </div>

      {/* Menu Lateral Direito Retrátil */}
      <div 
        className={`transition-all duration-300 flex shrink-0 border-l border-white/5 bg-zinc-950/60 h-full relative flex-col ${
          isSidebarOpen ? 'w-64' : 'w-12'
        }`}
        id="data-central-right-sidebar"
      >
        {/* Botão de Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 -left-3.5 w-7 h-7 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition shadow-lg cursor-pointer z-10"
          id="sidebar-toggle-btn"
          title={isSidebarOpen ? 'Recolher menu' : 'Expandir menu'}
        >
          {isSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {isSidebarOpen ? (
          <div ref={sidebarScrollRef} className="p-4 flex flex-col h-full space-y-4 overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">Johnsons</p>
              <button type="button" onClick={() => { setActiveDocument(null); setActiveDetail(null); }} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${!activeDocument && !activeDetail ? 'bg-violet-500/15 text-violet-300' : 'text-slate-400 hover:bg-white/5'}`}>Visão Geral</button>
              {documentTabs.map(({ key, title, icon: Icon }) => (
                <button key={key} type="button" onClick={() => { setActiveDocument(key === 'reviews' ? null : key); setActiveDetail(key === 'reviews' ? 'reviews' : null); }}
                  aria-current={(activeDocument === key || (key === 'reviews' && activeDetail === 'reviews')) ? 'page' : undefined}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium transition ${(activeDocument === key || (key === 'reviews' && activeDetail === 'reviews')) ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}>
                  <Icon size={15} /> {title}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Origem dos Dados</span>
            </div>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => setSelectedView('db')}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium transition cursor-pointer ${
                  selectedView === 'db' 
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm' 
                    : 'text-slate-400 hover:bg-white/5 border border-transparent'
                }`}
                id="select-db-view-btn"
              >
                <Database size={15} />
                Banco de Dados
              </button>

              <button 
                onClick={() => setSelectedView('cache')}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium transition cursor-pointer ${
                  selectedView === 'cache' 
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm' 
                    : 'text-slate-400 hover:bg-white/5 border border-transparent'
                }`}
                id="select-cache-view-btn"
              >
                <HardDrive size={15} />
                Armazenamento Local
              </button>
            </div>

            <div className="pt-4 border-t border-white/5 text-[11px] text-slate-500 space-y-2">
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Informação de Origem</p>
              {selectedView === 'db' ? (
                <p className="leading-relaxed">
                  Origem selecionada para os cartões de resumo. A disponibilidade dos Johnsons é indicada em cada área documental.
                </p>
              ) : (
                <p className="leading-relaxed">
                  Cartões de resumo exibidos a partir do cache global da Central; esta seleção não modifica os Johnsons.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center space-y-4 overflow-y-auto">
            <button type="button" title="Visão Geral" onClick={() => { setActiveDocument(null); setActiveDetail(null); setIsSidebarOpen(true); }} className="text-violet-300 text-xs">Início</button>
            {documentTabs.map(({ key, title, icon: Icon }) => (
              <button type="button" key={key} title={title} aria-label={title} onClick={() => { setActiveDocument(key === 'reviews' ? null : key); setActiveDetail(key === 'reviews' ? 'reviews' : null); setIsSidebarOpen(true); }}
                className={`p-2 rounded-lg ${(activeDocument === key || (key === 'reviews' && activeDetail === 'reviews')) ? 'bg-violet-500/15 text-violet-300' : 'text-slate-400 hover:bg-white/5'}`}><Icon size={16} /></button>
            ))}
            <button 
              onClick={() => {
                setSelectedView('db');
                setIsSidebarOpen(true);
              }}
              className={`p-2 rounded-lg transition cursor-pointer ${
                selectedView === 'db' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-white/5 border border-transparent'
              }`}
              title="Banco de Dados"
              id="collapsed-select-db-view-btn"
            >
              <Database size={16} />
            </button>

            <button 
              onClick={() => {
                setSelectedView('cache');
                setIsSidebarOpen(true);
              }}
              className={`p-2 rounded-lg transition cursor-pointer ${
                selectedView === 'cache' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-white/5 border border-transparent'
              }`}
              title="Armazenamento Local"
              id="collapsed-select-cache-view-btn"
            >
              <HardDrive size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modal Administrativo de Edição e Gestão de Registros Reais */}
      {isModalOpen && selectedRecord && (
        <RecordDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRecord(null);
          }}
          type={modalType}
          record={selectedRecord}
          onSave={handleSaveModal}
          onDelete={() => handleDeleteRecord(modalType, selectedRecord, true)}
          readOnly={false}
        />
      )}

    </div>
  );
}
