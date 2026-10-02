// publicLivesClient — bootstrap único de getPublicLives para a Home do LiveNexus.
// Dedup in-flight: chamadas concorrentes (StreamerStrip + StreamersLivesSection)
// compartilham UMA consulta dentro do mesmo runtime (a Home).
// Totalmente desacoplado de SDKs proprietários.

import { publicLivesRepository } from '@dashboard/configuracao/Config_liveNexusDataAdapter';

let inflight = null;

export function getPublicLivesOnce() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await publicLivesRepository.getPublicLives();
      return res?.data || res || {};
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
