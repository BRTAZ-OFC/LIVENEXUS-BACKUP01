export function templateRamal(response) {
  return response.templates ?? response.template ?? (response.ok ? true : null);
}
