export function reviewsRamal(response) {
  return response.reviews ?? response.review ?? (response.ok ? true : null);
}
