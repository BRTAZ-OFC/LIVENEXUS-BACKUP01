export function galleryRamal(response) {
  return response.gallery ?? response.record ?? (response.ok ? true : null);
}
