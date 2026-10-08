// Gerenciador de histórico de buscas em tempo de execução.
const MAX_ITEMS = 20;

class SearchHistoryManager {
  constructor() {
    this.items = [];
  }

  add(query) {
    if (!query || !query.trim()) return;
    const q = query.trim();
    // Dedup: remove ocorrências anteriores
    this.items = this.items.filter((i) => (i?.query || '').toLowerCase() !== q.toLowerCase());
    this.items.unshift({ query: q, searchedAt: Date.now() });
    if (this.items.length > MAX_ITEMS) this.items = this.items.slice(0, MAX_ITEMS);
  }

  list() {
    return this.items;
  }

  clear() {
    this.items = [];
  }

  remove(query) {
    this.items = this.items.filter((i) => i.query !== query);
  }
}

export const searchHistoryManager = new SearchHistoryManager();
