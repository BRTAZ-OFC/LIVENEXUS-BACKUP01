// Hook React para consumo reativo da Biblioteca Pessoal do usuário
import { useState, useEffect, useCallback } from 'react';
import { playerEvents } from './Library_playerEvents';
import { useNewUserDataCentral } from '@dashboard/configuracao/DataCentral_NewUserDataCentral';

export function useUserLibrary() {
  const central = useNewUserDataCentral();
  const [library, setLibrary] = useState({ songs: [], albums: [], artists: [], playlists: [] });

  const refresh = useCallback(async () => {
    if (!central.userId) { setLibrary({ songs: [], albums: [], artists: [], playlists: [] }); return; }
    const current = await central.libraryBranch('GET');
    setLibrary(current);
    playerEvents.emit('library_changed', current);
  }, [central.userId, central.libraryBranch]);

  useEffect(() => { refresh().catch(error => console.error('Erro ao carregar biblioteca:', error)); }, [refresh]);

  useEffect(() => {
    const unsub = playerEvents.on('library_changed', (lib) => {
      setLibrary(lib || { songs: [], albums: [], artists: [], playlists: [] });
    });
    return () => {
      try { unsub(); } catch {}
    };
  }, []);

  const kindOf = (item) => ['song', 'album', 'artist', 'playlist'].includes(item?.type) ? item.type : 'song';
  const itemId = (item) => item?.id || item?.videoId;
  const fieldOf = (kind) => ({ song: 'songs', album: 'albums', artist: 'artists', playlist: 'playlists' })[kind];
  const isSaved = (item) => !!library[fieldOf(kindOf(item))]?.some(entry => String(itemId(entry)) === String(itemId(item)));
  const add = async (item) => {
    const result = await central.libraryBranch('POST', { kind: kindOf(item), payload: { item } });
    await refresh();
    return result;
  };
  const remove = async (item) => {
    const result = await central.libraryBranch('DELETE', { kind: kindOf(item), id: itemId(item) });
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
    totalCount: Object.values(library).reduce((total, items) => total + items.length, 0),
    isSaved,
    toggle,
    add,
    remove,
  };
}
