// reviewsBootstrap — bootstrap único de avaliações públicas (Review) para a Home e /avaliacoes.
// Cache de sessão + dedup in-flight: UMA chamada ao reviewRepository por sessão, compartilhada
// entre ReviewsSection (6 mais recentes) e AllReviews (lista completa).
// Totalmente desacoplado de SDKs externos.

import { reviewRepository } from '@dashboard/configuracao/Config_liveNexusDataAdapter';

let cache = null;
let inflight = null;

export function getReviewsOnce() {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const list = await reviewRepository.list('-created_date', 500);
      cache = Array.isArray(list) ? list : [];
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

// Após criar um review (escrita explícita), atualiza o cache da sessão (prepend).
// Sem refetch — o estado local da página também é atualizado pelo componente.
export function prependReview(review) {
  if (!review) return;
  cache = cache ? [review, ...cache] : [review];
}
