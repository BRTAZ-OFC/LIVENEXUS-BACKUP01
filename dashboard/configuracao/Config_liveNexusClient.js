// liveNexusClient — Cliente unificado do LiveNexus.
// Reúne authClient e liveNexusDataAdapter em uma interface limpa, coesa e agnóstica.

import { authClient } from '@dashboard/login/authClient';
import { liveNexusDataAdapter, liveSessionRepository, reviewRepository, contactRepository, publicLivesRepository } from '@dashboard/configuracao/Config_liveNexusDataAdapter';
import { appParams } from '@dashboard/login/app-params';

export const liveNexus = {
  app: {
    getPublicSettings: async () => ({ id: appParams.appId, public_settings: {} }),
  },
  auth: authClient,
  entities: {
    LiveSession: liveSessionRepository,
    Review: reviewRepository,
    Contact: contactRepository,
  },
  functions: {
    invoke: async (name, payload = {}) => {
      if (name === 'getPublicLives') {
        return await publicLivesRepository.getPublicLives();
      }
      return { ok: true };
    }
  },
  data: liveNexusDataAdapter
};

export default liveNexus;
