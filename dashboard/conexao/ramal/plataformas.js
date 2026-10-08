export function plataformasRamal(response) {
  return response.plataformas ?? (response.ok ? true : null);
}
