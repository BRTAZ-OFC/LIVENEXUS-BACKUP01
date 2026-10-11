// Gerador nativo de códigos de vinculação para YouTube, Twitch e Kick.
// Cria códigos no formato LNX-XXXXXX usando crypto aleatório seguro e
// registra o desafio no mecanismo confiável de validação de bio existente (/challenge).
import { channelVerify } from '../Config_channelVerify.js';
import { normalizeChannelInput } from '../Config_channelCode.js';
import { authClient } from '../../login/authClient.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Gera um código criptograficamente seguro no formato LNX-XXXXXX
 * utilizando crypto.getRandomValues do navegador/ambiente padrão.
 */
export function gerarCodigoVinculoFormatado() {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback defensivo em ambientes restritos
    for (let i = 0; i < 6; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let sufixo = '';
  for (let i = 0; i < 6; i++) {
    sufixo += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `LNX-${sufixo}`;
}

/**
 * Gerador de Código de Vinculação
 *
 * Responsabilidades:
 * 1. Gerar códigos únicos de vinculação no formato LNX-XXXXXX com geração aleatória criptograficamente segura.
 * 2. Associar cada código ao usuário autenticado, à plataforma e ao identificador do canal.
 * 3. Integrar o registro e a validade do código ao mecanismo confiável já existente (/challenge).
 * 4. Impedir reutilização indevida e colisões de códigos.
 * 5. Disponibilizar o código para exibição e cópia na interface de vinculação.
 *
 * O gerador NÃO aprova vinculações (a aprovação é prerrogativa do verificador que confere a bio).
 */
export const GerarCodigoVinculo = {
  /**
   * Gera e registra um novo código de vinculação para o canal e plataforma especificados.
   *
   * @param {string} platform - 'YouTube' | 'Twitch' | 'Kick'
   * @param {string} channelIdentifier - Nome/handle/URL do canal informado pelo usuário
   * @returns {Promise<{
   *   verificationCode: string,
   *   challengeId: string,
   *   challengeKey: string,
   *   channelIdentifier: string,
   *   platform: string,
   *   userId: string | null
   * }>}
   */
  async gerar({ platform, channelIdentifier }) {
    if (!platform) {
      throw new Error('Plataforma é obrigatória para gerar código de vinculação.');
    }

    const normChannel = normalizeChannelInput(platform, channelIdentifier);
    if (!normChannel) {
      throw new Error('Identificador de canal inválido.');
    }

    // Identifica o usuário autenticado atual no LiveNexus (se houver sessão ativa)
    const currentUser = authClient.getUser();
    const userId = currentUser?.id || null;

    // Registra o desafio no mecanismo confiável existente do LiveNexus
    // Este endpoint gera o challengeId, challengeKey, código único (ou registra o canal) e vincula à autoridade canônica.
    const res = await channelVerify.challenge(platform, normChannel);

    if (!res || !res.verificationCode) {
      throw new Error('Falha ao registrar o código no serviço de verificação.');
    }

    return {
      verificationCode: res.verificationCode,
      challengeId: res.challengeId,
      challengeKey: res.challengeKey,
      channelIdentifier: res.channelIdentifier || normChannel,
      platform,
      userId,
    };
  },

  /**
   * Reemite/renova o código de desafio existente via challengeKey,
   * invalidando imediatamente o código anterior para evitar reutilização indevida.
   *
   * @param {string} challengeKey
   * @returns {Promise<{
   *   verificationCode: string,
   *   challengeId: string,
   *   challengeKey: string,
   *   channelIdentifier: string
   * }>}
   */
  async reemitir(challengeKey) {
    if (!challengeKey) {
      throw new Error('Chave de desafio ausente para reemissão.');
    }

    const res = await channelVerify.reemit(challengeKey);
    if (!res || !res.verificationCode) {
      throw new Error('Falha ao reemitir novo código de vinculação.');
    }

    return {
      verificationCode: res.verificationCode,
      challengeId: res.challengeId,
      challengeKey: res.challengeKey,
      channelIdentifier: res.channelIdentifier,
    };
  },

  /**
   * Utilitário para validar formato estrito do código gerado (LNX-XXXXXX)
   */
  validarFormato(code) {
    if (!code || typeof code !== 'string') return false;
    return /^LNX-[A-Z0-9]{6}$/.test(code.trim());
  }
};

export default GerarCodigoVinculo;
