// base44Client.js — ponte legada redirecionada para liveNexusClient.
// Todo o runtime agora utiliza a infraestrutura própria do LiveNexus.
// ZERO dependência de @base44/sdk.

export { liveNexus as base44, base44 as default } from '@dashboard/configuracao/Config_liveNexusClient';
