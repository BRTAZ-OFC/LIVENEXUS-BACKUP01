// Biblioteca pessoal do usuário — LiveNexus v1.0.2
import { playerEvents } from './Library_playerEvents';

class LibraryManager {
  list(category) {
    const lib = this.getLibrary();
    return category ? (lib[category] || []) : lib;
  }

  getLibrary() {
    return { songs: [], albums: [], artists: [], playlists: [] };
  }

  has(item) {
    if (!item) return false;
    const lib = this.getLibrary();
    const id = item.id || item.videoId;
    return (lib.songs || []).some(s => (s.id || s.videoId) === id);
  }

  async add(item) {
    playerEvents.emit('library_changed', this.getLibrary());
    return { ok: true };
  }

  async remove(item) {
    playerEvents.emit('library_changed', this.getLibrary());
    return { ok: true };
  }

  async toggle(item) {
    playerEvents.emit('library_changed', this.getLibrary());
    return { ok: true };
  }
}

export const libraryManager = new LibraryManager();
