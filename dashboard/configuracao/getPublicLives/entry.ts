// getPublicLives — leitura pontual (service role) das LiveSessions já salvas
// de TODOS os streamers, retornando somente campos públicos (sem notes/email).
// Agrupa por streamer (created_by_id) com até 3 VODs mais recentes cada.
// NÃO altera liveSessionService nem o fluxo de salvamento — somente leitura.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Service role: bypassa RLS para ler LiveSessions de todos os usuários.
    // Somente VODs disponíveis e com link clicável (streamUrl).
    const sessions = await base44.asServiceRole.entities.LiveSession.filter(
      { vodStatus: 'available' },
      '-created_date',
      60
    );

    // Mapeia created_by_id -> nome/avatar públicos do streamer.
    const users = await base44.asServiceRole.entities.User.list('-created_date', 100);
    const userMap = new Map();
    for (const u of users) {
      userMap.set(u.id, {
        name: u.data?.display_name || u.full_name || 'Streamer',
        avatar: u.data?.avatar_url || null,
      });
    }

    // allStreamers: projeção pública mínima (id, name, avatar) para a faixa da Home.
    // Reaproveita o User.list já feito — nenhuma leitura extra. Até 20 com nome.
    const allStreamers = [];
    for (const u of users) {
      if (allStreamers.length >= 20) break;
      const name = u.data?.display_name || u.full_name || 'Streamer';
      if (!name) continue;
      allStreamers.push({ id: u.id, name, avatar: u.data?.avatar_url || null });
    }

    // Agrupa por streamer, até 3 VODs mais recentes cada (já ordenado globalmente).
    const byStreamer = new Map();
    for (const s of sessions) {
      if (!s.streamUrl) continue;
      const sid = s.created_by_id;
      if (!byStreamer.has(sid)) byStreamer.set(sid, []);
      const arr = byStreamer.get(sid);
      if (arr.length < 3) {
        arr.push({
          id: s.id,
          title: s.title || 'Transmissão',
          platform: s.platform || null,
          thumbnailUrl: s.thumbnailUrl || null,
          streamUrl: s.streamUrl,
          channelName: s.channelName || null,
          startedAt: s.startedAt || null,
          duration: s.duration || null,
        });
      }
    }

    const streamers = [];
    for (const [sid, lives] of byStreamer) {
      const info = userMap.get(sid) || { name: 'Streamer', avatar: null };
      streamers.push({ streamer: { id: sid, name: info.name, avatar: info.avatar }, lives });
    }

    return Response.json({ streamers, allStreamers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}