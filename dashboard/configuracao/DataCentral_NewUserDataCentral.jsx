import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  liveSessionRepository, 
  contactRepository 
} from '@dashboard/configuracao/Config_liveNexusDataAdapter';
import { loadFilterConfig, saveFilterConfig } from '@dashboard/configuracao/Config_filterConfig';
import { useAuth } from '@dashboard/login/AuthContext';
import { authClient } from '@dashboard/login/authClient';
import { scenarioRamal } from '@dashboard/conexao/ramal/Scenario_Ramal';
import { overlayRamal } from '@dashboard/conexao/ramal/Overlay_Ramal';
import { galleryRamal } from '@dashboard/conexao/ramal/Gallery_Ramal';
import { libraryRamal } from '@dashboard/conexao/ramal/Library_Ramal';
import { templateRamal } from '@dashboard/conexao/ramal/Template_Ramal';
import { messagesRamal } from '@dashboard/conexao/ramal/Config_MessagesRamal';
import { vodsRamal } from '@dashboard/conexao/ramal/Config_VodsRamal';
import { reviewsRamal } from '@dashboard/conexao/ramal/Review_Ramal';
import { connectGalleryBranch } from '@dashboard/painel-admin/Gallery_mediaStorageAdapter';

const NewUserDataCentralContext = createContext(null);



export function NewUserDataCentralProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const userId = isAuthenticated ? user?.id : null;

  // A Central apenas encaminha a operação ao endpoint do Johnson do domínio e
  // recebe a resposta pelo ramal correspondente. Nunca armazena o documento.
  const dispatchDocument = useCallback(async (endpoint, ramal, operation, params = {}) => {
    const targetUserId = params.targetUserId || userId;
    if (!targetUserId) throw new Error('Usuário não autenticado.');
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set('userId', targetUserId);
    if (params.id !== undefined) url.searchParams.set(endpoint === '/api/cenarios' ? 'scenarioId' : 'id', String(params.id));
    if (params.kind) url.searchParams.set('kind', params.kind);
    const res = await fetch(url, {
      method: operation,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(authClient.getToken() ? { Authorization: `Bearer ${authClient.getToken()}` } : {}),
      },
      ...(params.payload !== undefined ? { body: JSON.stringify(params.payload) } : {}),
    });
    const contentType = res.headers.get('content-type');
    if (!contentType?.toLowerCase().includes('application/json')) {
      throw new Error(`API documental indisponível neste ambiente: o endpoint não retornou JSON. Recebido: ${contentType}`);
    }
    const response = await res.json();
    if (!res.ok || !response.ok) throw new Error(response.error || `Erro HTTP ${res.status}`);
    return ramal(response);
  }, [userId]);

  const scenarioBranch = useCallback((operation, params) => dispatchDocument('/api/cenarios', scenarioRamal, operation, params), [dispatchDocument]);
  const overlayBranch = useCallback((operation, params) => dispatchDocument('/api/overlays', overlayRamal, operation, params), [dispatchDocument]);
  const galleryBranch = useCallback((operation, params) => dispatchDocument('/api/admin/lab/user-gallery', galleryRamal, operation, params), [dispatchDocument]);
  const libraryBranch = useCallback((operation, params) => dispatchDocument('/api/library', libraryRamal, operation, params), [dispatchDocument]);
  const templateBranch = useCallback((operation, params) => dispatchDocument('/api/templates', templateRamal, operation, params), [dispatchDocument]);
  const messagesBranch = useCallback((operation, params) => dispatchDocument('/api/contacts', messagesRamal, operation, params), [dispatchDocument]);
  const vodsBranch = useCallback((operation, params) => dispatchDocument('/api/live-sessions', vodsRamal, operation, params), [dispatchDocument]);
  const reviewsBranch = useCallback((operation, params) => dispatchDocument('/api/reviews', reviewsRamal, operation, params), [dispatchDocument]);

  useEffect(() => {
    connectGalleryBranch(userId ? galleryBranch : null);
    return () => connectGalleryBranch(null);
  }, [userId, galleryBranch]);
  
  // Estados Reais sincronizados com o Backend/Banco
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsError, setReviewsError] = useState('');
  const [contacts, setContacts] = useState([]);
  const [filters, setFilters] = useState(loadFilterConfig());
  const [runtimeId, setRuntimeId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carregamento inicial de dados reais do banco
  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [sessResult, revResult, contResult] = await Promise.allSettled([
        vodsBranch('GET'),
        reviewsBranch('GET'),
        messagesBranch('GET')
      ]);
      
      let loadedSessions = [];
      let loadedReviews = [];
      let loadedContacts = [];

      if (sessResult.status === 'fulfilled') {
        loadedSessions = sessResult.value;
      } else {
        console.error('[DataCentral] VODs indisponíveis:', sessResult.reason);
      }

      if (revResult.status === 'fulfilled') {
        loadedReviews = revResult.value;
        setReviewsError('');
      } else {
        setReviewsError(revResult.reason?.message || 'Avaliações indisponíveis.');
        console.error('[DataCentral] Avaliações indisponíveis:', revResult.reason);
      }

      if (contResult.status === 'fulfilled') {
        loadedContacts = contResult.value;
      } else {
        console.error('[DataCentral] Mensagens indisponíveis:', contResult.reason);
      }

      setSessions(loadedSessions || []);
      setReviews(loadedReviews || []);
      setContacts(loadedContacts || []);
    } catch (error) {
      console.error('[DataCentral] Erro ao carregar dados reais:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, vodsBranch, messagesBranch, reviewsBranch]);



  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Busca e armazena o runtimeId vindo da camada de conexão/Johnson
  useEffect(() => {
    // Definido estritamente para o runtimeId de teste fixo
    setRuntimeId('rtc_723d9e62d2b04b6a');
  }, [userId]);

  // Persistência de Filtros (Direto no "Banco" local/D1 se houver bridge futuro)
  const updateFilters = (newConfig) => {
    setFilters(newConfig);
    saveFilterConfig(newConfig);
  };

  const saveSession = useCallback(async (id, changes) => {
    const res = await vodsBranch('PATCH', { id, payload: changes });
    await refreshAll(true);
    return res;
  }, [refreshAll, vodsBranch]);

  const deleteSession = useCallback(async (id) => {
    await vodsBranch('DELETE', { id });
    await refreshAll(true);
  }, [refreshAll, vodsBranch]);

  const saveReview = useCallback(async (id, changes) => {
    const res = await reviewsBranch('PATCH', { id, payload: changes });
    await refreshAll(true);
    return res;
  }, [refreshAll, reviewsBranch]);

  const deleteReview = useCallback(async (id) => {
    await reviewsBranch('DELETE', { id });
    await refreshAll(true);
  }, [refreshAll, reviewsBranch]);

  const saveContact = useCallback(async (id, changes) => {
    const res = await messagesBranch('PATCH', { id, payload: changes });
    await refreshAll(true);
    return res;
  }, [refreshAll, messagesBranch]);

  const deleteContact = useCallback(async (id) => {
    await messagesBranch('DELETE', { id });
    await refreshAll(true);
  }, [refreshAll, messagesBranch]);

  const value = {
    userId,
    documentRtcRegistry: user?.rtcRegistry || user?.data?.rtcRegistry || null,
    scenarioBranch,
    overlayBranch,
    galleryBranch,
    libraryBranch,
    templateBranch,
    messagesBranch,
    vodsBranch,
    reviewsBranch,
    isTemplateAdmin: isAuthenticated && String(user?.role).toLowerCase() === 'admin',
    // Dados
    sessions,
    reviews,
    reviewsError,
    contacts,
    filters,
    runtimeId,
    rtcSession: { isRunning: false, runtimeId, stats: null },
    isLoading,
    
    refreshAll,
    updateFilters,

    // Ações Administrativas de Persistência
    saveSession,
    deleteSession,
    saveReview,
    deleteReview,
    saveContact,
    deleteContact,
    
    // Repositórios Diretos (para operações CRUD)
    sessionRepo: liveSessionRepository,
    contactRepo: contactRepository
  };

  return (
    <NewUserDataCentralContext.Provider value={value}>
      {children}
    </NewUserDataCentralContext.Provider>
  );
}

export function useNewUserDataCentral(options = { optional: false }) {
  const context = useContext(NewUserDataCentralContext);
  if (!context && !options.optional) {
    throw new Error('useNewUserDataCentral must be used within a NewUserDataCentralProvider');
  }
  return context;
}
