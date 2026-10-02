export function libraryRamal(response) {
  return response.library ?? response.item ?? (response.ok ? true : null);
}
