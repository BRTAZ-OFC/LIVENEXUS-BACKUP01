import { handleRequest } from '../../../cloudflare-worker/music-bridge.js';

export async function onRequest(context) {
  return await handleRequest(context.request);
}
