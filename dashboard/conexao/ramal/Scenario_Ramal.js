export function scenarioRamal(response) {
  return response.cenarios ?? response.cenario ?? (response.ok ? true : null);
}
