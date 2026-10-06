// Hook React para consumo reativo da Biblioteca Pessoal do usuário
import { useState, useEffect, useCallback } from 'react';
import { playerEvents } from './Library_playerEvents';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';

export function classifyItemKind(item) {
  if (!item) return 'song';
  const rawType = String(item.type || item.rawRef?.type || '').toLowerCase().trim();
  const id = String(item.id || item.playlistId || item.videoId || item.browseId || '');
  const playlistId = String(item.playlistId || item.rawRef?.playlistId || '');
  const browseId = String(item.browseId || item.rawRef?.browseId || '');

  // 1. Playlists (inclui mixes e playlists da comunidade)
  if (
    rawType === 'playlist' ||
    rawType === 'mix' ||
    rawType === 'community_playlist' ||
    (playlistId && !playlistId.startsWith('OLAK5uy_') && !item.videoId) ||
    id.startsWith('PL') ||
    id.startsWith('RD') ||
    id.startsWith('VLPL') ||
    id.startsWith('VLRD')
  ) {
    return 'playlist';
  }

  // 2. Álbuns
  if (
    rawType === 'album' ||
    rawType === 'mb_release' ||
    rawType === 'lastfm_album' ||
    rawType === 'itunes_album' ||
    rawType === 'bandcamp_album' ||
    playlistId.startsWith('OLAK5uy_') ||
    id.startsWith('OLAK5uy_') ||
    browseId.startsWith('MPRE') ||
    browseId.startsWith('MPSP') ||
    browseId.startsWith('MP')
  ) {
    return 'album';
  }

  // 3. Artistas
  if (
    rawType === 'artist' ||
    rawType === 'mb_artist' ||
    rawType === 'lastfm_artist' ||
    browseId.startsWith('UC') ||
    (id.startsWith('UC') && !item.videoId)
  ) {
    return 'artist';
  }

  // 4. Músicas (padrão)
  return 'song';
}

export function normalizeLibraryCategories(rawLib) {
  const allEntries = [
    ...(rawLib?.songs || []),
    ...(rawLib?.albums || []),
    ...(rawLib?.artists || []),
    ...(rawLib?.playlists || []),
  ];
  const seen = new Set();
  const normalized = {
    songs: [],
    albums: [],
    artists: [],
    playlists: [],
  };

  for (const item of allEntries) {
    if (!item) continue;
    const stableId = String(
      item.id ||
      item.videoId ||
      item.playlistId ||
      item.browseId ||
      item.rawRef?.videoId ||
      item.rawRef?.playlistId ||
      item.title ||
      ''
    ).trim();
    if (!stableId || seen.has(stableId)) continue;
    seen.add(stableId);

    const kind = classifyItemKind(item);
    const itemWithKind = { ...item, type: kind, id: item.id || stableId };

    if (kind === 'playlist') normalized.playlists.push(itemWithKind);
    else if (kind === 'album') normalized.albums.push(itemWithKind);
    else if (kind === 'artist') normalized.artists.push(itemWithKind);
    else normalized.songs.push(itemWithKind);
  }

  return normalized;
}

export function useUserLibrary() {
  const central = useNewUserDataCentral();
  const [library, setLibrary] = useState({ songs: [], albums: [], artists: [], playlists: [] });

  const refresh = useCallback(async () => {
    if (!central.userId) { setLibrary({ songs: [], albums: [], artists: [], playlists: [] }); return; }
    const current = await central.libraryBranch('GET');
    const normalized = normalizeLibraryCategories(current);
    setLibrary(normalized);
    playerEvents.emit('library_changed', normalized);
  }, [central.userId, central.libraryBranch]);

  useEffect(() => { refresh().catch(error => console.error('Erro ao carregar biblioteca:', error)); }, [refresh]);

  useEffect(() => {
    const unsub = playerEvents.on('library_changed', (lib) => {
      setLibrary(normalizeLibraryCategories(lib || { songs: [], albums: [], artists: [], playlists: [] }));
    });
    return () => {
      try { unsub(); } catch {}
    };
  }, []);

  const kindOf = (item) => (typeof item === 'object' && item !== null ? classifyItemKind(item) : 'song');
  const itemId = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item.trim();
    return String(
      item.id ||
      item.videoId ||
      item.playlistId ||
      item.browseId ||
      item.rawRef?.videoId ||
      item.rawRef?.playlistId ||
      item.title ||
      ''
    ).trim();
  };

  const isSaved = (item) => {
    if (!item) return false;
    const targetId = itemId(item);
    if (!targetId) return false;

    const all = [...(library.songs || []), ...(library.albums || []), ...(library.artists || []), ...(library.playlists || [])];
    return all.some(entry => {
      if (!entry) return false;
      const eid = String(entry.id || '').trim();
      const evid = String(entry.videoId || '').trim();
      const epid = String(entry.playlistId || '').trim();
      const ebid = String(entry.browseId || '').trim();
      const erawvid = String(entry.rawRef?.videoId || '').trim();
      const erawpid = String(entry.rawRef?.playlistId || '').trim();
      const etitle = String(entry.title || '').trim();

      return (
        (eid && eid === targetId) ||
        (evid && evid === targetId) ||
        (epid && epid === targetId) ||
        (ebid && ebid === targetId) ||
        (erawvid && erawvid === targetId) ||
        (erawpid && erawpid === targetId) ||
        (etitle && etitle === targetId)
      );
    });
  };

  const add = async (item) => {
    if (!item) return null;
    const kind = kindOf(item);
    const stableId = itemId(item) || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    const itemToSave = {
      ...item,
      id: item.id || stableId,
      type: kind,
    };
    const result = await central.libraryBranch('POST', { kind, payload: { item: itemToSave } });
    await refresh();
    return result;
  };

  const remove = async (item) => {
    if (!item) return null;
    const kind = kindOf(item);
    const id = itemId(item);
    if (!id) return null;
    const result = await central.libraryBranch('DELETE', { kind, id });
    await refresh();
    return result;
  };

  const toggle = async (item) => isSaved(item) ? remove(item) : add(item);

  return {
    library,
    songs: library.songs || [],
    albums: library.albums || [],
    artists: library.artists || [],
    playlists: library.playlists || [],
    totalCount: (library.songs?.length || 0) + (library.albums?.length || 0) + (library.artists?.length || 0) + (library.playlists?.length || 0),
    isSaved,
    toggle,
    add,
    remove,
  };
}
