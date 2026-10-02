export function vodsRamal(response) {
  return response.sessions ?? response.session ?? (response.ok ? true : null);
}
