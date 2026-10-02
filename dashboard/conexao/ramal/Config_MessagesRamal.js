export function messagesRamal(response) {
  return response.contacts ?? response.contact ?? (response.ok ? true : null);
}
