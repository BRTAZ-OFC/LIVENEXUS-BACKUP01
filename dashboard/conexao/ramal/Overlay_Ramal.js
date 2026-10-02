export function overlayRamal(response) {
  return response.overlays ?? response.overlay ?? (response.ok ? true : null);
}
