export function plataformasRamal(response) {
  return response.plataformas ?? response.plataforma ?? (response.ok ? true : null);
}
