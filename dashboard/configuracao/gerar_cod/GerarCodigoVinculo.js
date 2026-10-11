// Gerador nativo de códigos de vinculação para YouTube, Twitch e Kick.
// Responsabilidade única: gerar e retornar um código no formato LNX-XXXXXX.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Gera um código no formato LNX-XXXXXX.
 * @returns {string}
 */
export function gerarCodigoVinculo() {
  let sufixo = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    sufixo += ALPHABET[idx];
  }
  return `LNX-${sufixo}`;
}

export const GerarCodigoVinculo = {
  gerar() {
    return gerarCodigoVinculo();
  }
};

export default GerarCodigoVinculo;
