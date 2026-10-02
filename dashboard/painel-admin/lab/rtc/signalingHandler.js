// Minimal signaling storage for WebRTC negotiation in the RTC Lab
// In-memory queue with time-to-live cleanup

const signalQueues = new Map(); // runtimeId -> Array<{ id, fromRole, toRole, type, data, timestamp }>

const MAX_SIGNALS = 200;
const SIGNAL_TTL_MS = 60000; // 1 minute

function cleanupSignals(queue) {
  const cutoff = Date.now() - SIGNAL_TTL_MS;
  return queue.filter(sig => sig.timestamp > cutoff);
}

export async function handleSignalingRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, 'http://localhost');
  const runtimeId = url.searchParams.get('runtimeId');

  if (!runtimeId || !runtimeId.trim()) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ ok: false, error: 'runtimeId é obrigatório para signaling.' }));
  }

  const cleanRuntimeId = runtimeId.trim();

  // POST: Enviar um sinal
  if (req.method === 'POST') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      const body = raw ? JSON.parse(raw) : {};

      const { fromRole, toRole, type, data } = body;
      if (!type) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'Tipo de sinal inválido.' }));
      }

      let queue = signalQueues.get(cleanRuntimeId) || [];
      queue = cleanupSignals(queue);

      const signalItem = {
        id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        fromRole: fromRole || 'unknown',
        toRole: toRole || 'all',
        type,
        data: data || null,
        timestamp: Date.now()
      };

      queue.push(signalItem);
      if (queue.length > MAX_SIGNALS) {
        queue.shift();
      }

      signalQueues.set(cleanRuntimeId, queue);

      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, signalId: signalItem.id }));
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ ok: false, error: `Erro no signaling: ${err.message}` }));
    }
  }

  // GET: Obter sinais pendentes
  if (req.method === 'GET') {
    const role = url.searchParams.get('role');
    const since = parseInt(url.searchParams.get('since') || '0', 10);

    let queue = signalQueues.get(cleanRuntimeId) || [];
    queue = cleanupSignals(queue);
    signalQueues.set(cleanRuntimeId, queue);

    const relevantSignals = queue.filter(sig => {
      if (sig.timestamp <= since) return false;
      if (role && sig.toRole !== 'all' && sig.toRole !== role) return false;
      if (role && sig.fromRole === role) return false; // Don't return own signals
      return true;
    });

    res.statusCode = 200;
    return res.end(JSON.stringify({
      ok: true,
      runtimeId: cleanRuntimeId,
      signals: relevantSignals,
      serverTime: Date.now()
    }));
  }

  // DELETE: Limpar sinais do runtimeId
  if (req.method === 'DELETE') {
    signalQueues.delete(cleanRuntimeId);
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true, message: 'Sinais limpos com sucesso.' }));
  }

  res.statusCode = 405;
  return res.end(JSON.stringify({ ok: false, error: 'Método não permitido.' }));
}
