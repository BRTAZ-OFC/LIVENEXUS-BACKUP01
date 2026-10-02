/**
 * Isolamento do Laboratório: Teste YouTube 1 (Bootstrap Resolver)
 * Executa APENAS a resolução inicial (1-shot) do canal/live para extrair:
 * - videoId da live ativa
 * - título e autor
 * - concurrentViewers (quando disponível e estritamente de live)
 * - token de continuação do chat e credenciais públicas do InnerTube (apiKey, clientVersion, context)
 * 
 * NÃO realiza polling contínuo.
 * NÃO executa YouTube Data API v3 ou OAuth.
 */

function extractYtcfg(html) {
  const ytcfgMatch = html.match(/ytcfg\.set\s*\(\s*({.+?})\s*\)\s*;/s);
  if (ytcfgMatch) {
    try {
      return JSON.parse(ytcfgMatch[1]);
    } catch {
      // Ignore JSON parse error and try regex
    }
  }

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([^"]+)"/);
  const clientVersionMatch = html.match(/"INNERTUBE_CLIENT_VERSION":\s*"([^"]+)"/);
  const contextMatch = html.match(/"INNERTUBE_CONTEXT":\s*({.+?})\s*,\s*"[A-Z_]+"/s);

  let clientContext = null;
  if (contextMatch) {
    try {
      clientContext = JSON.parse(contextMatch[1]);
    } catch {
      clientContext = null;
    }
  }

  return {
    INNERTUBE_API_KEY: apiKeyMatch ? apiKeyMatch[1] : null,
    INNERTUBE_CLIENT_VERSION: clientVersionMatch ? clientVersionMatch[1] : null,
    INNERTUBE_CONTEXT: clientContext,
  };
}

function extractInitialData(html, varName) {
  const regexes = [
    new RegExp(`(?:window\\[["']${varName}["']\\]|var\\s+${varName}|window\\.${varName})\\s*=\\s*({.+?});\\s*<\\/script>`, 's'),
    new RegExp(`(?:window\\[["']${varName}["']\\]|var\\s+${varName}|window\\.${varName})\\s*=\\s*({.+?});`, 's'),
  ];

  for (const regex of regexes) {
    const match = html.match(regex);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // Continue
      }
    }
  }
  return null;
}

function findContinuationToken(obj) {
  if (!obj || typeof obj !== 'object') return null;

  if (obj.liveChatRenderer?.continuations?.[0]) {
    const c0 = obj.liveChatRenderer.continuations[0];
    const token = c0.invalidationContinuationData?.continuation ||
                  c0.timedContinuationData?.continuation ||
                  c0.reloadContinuationData?.continuation;
    if (token) return token;
  }

  if (obj.reloadContinuationData?.continuation) return obj.reloadContinuationData.continuation;
  if (obj.invalidationContinuationData?.continuation) return obj.invalidationContinuationData.continuation;
  if (obj.timedContinuationData?.continuation) return obj.timedContinuationData.continuation;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const found = findContinuationToken(obj[key]);
      if (found) return found;
    }
  }
  return null;
}

function extractConcurrentViewers(ytInitialData, ytInitialPlayerResponse) {
  // Procura no videoPrimaryInfoRenderer
  const results = ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
  if (Array.isArray(results)) {
    const primaryInfo = results.find(c => c.videoPrimaryInfoRenderer)?.videoPrimaryInfoRenderer;
    const viewCountRenderer = primaryInfo?.viewCount?.videoViewCountRenderer;
    
    // Verifica se é estritamente live (isLive: true)
    if (viewCountRenderer?.isLive) {
      const runs = viewCountRenderer?.viewCount?.runs || viewCountRenderer?.shortViewCount?.runs;
      if (Array.isArray(runs) && runs.length > 0) {
        const fullText = runs.map(r => r.text).join('').trim();
        return fullText;
      }
      if (viewCountRenderer?.viewCount?.simpleText) {
        return viewCountRenderer.viewCount.simpleText;
      }
    }
  }

  // Procura no playerResponse se indicar isLive
  const isLive = ytInitialPlayerResponse?.videoDetails?.isLive || ytInitialPlayerResponse?.videoDetails?.isLiveContent;
  if (isLive && ytInitialPlayerResponse?.videoDetails?.viewCount) {
    const count = parseInt(ytInitialPlayerResponse.videoDetails.viewCount, 10);
    if (!isNaN(count)) {
      return `${count.toLocaleString('pt-BR')} assistindo agora`;
    }
  }

  return null;
}

export async function resolveYouTubeLiveBootstrap(identifier) {
  const startTime = Date.now();
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return {
      ok: false,
      error: 'Identificador do canal não informado.',
      durationMs: Date.now() - startTime,
    };
  }

  let raw = identifier.trim();
  let targetUrl = '';

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    if (raw.includes('/watch?v=')) {
      targetUrl = raw;
    } else if (raw.includes('/live')) {
      targetUrl = raw;
    } else {
      targetUrl = `${raw.replace(/\/+$/, '')}/live`;
    }
  } else if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    targetUrl = `https://www.youtube.com/watch?v=${raw}`;
  } else {
    const handle = raw.startsWith('@') ? raw : `@${raw}`;
    targetUrl = `https://www.youtube.com/@${handle.replace(/^@/, '')}/live`;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    const durationMs = Date.now() - startTime;
    const finalUrl = response.url;
    const status = response.status;

    if (!response.ok) {
      return {
        ok: false,
        status,
        finalUrl,
        durationMs,
        error: `HTTP ${status} retornado pelo YouTube ao consultar ${targetUrl}`,
      };
    }

    const html = await response.text();

    // Extrai videoId
    let videoId = null;
    const vMatch = finalUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (vMatch) {
      videoId = vMatch[1];
    } else {
      const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
      if (canonicalMatch) videoId = canonicalMatch[1];
      else {
        const ogMatch = html.match(/<meta\s+property="og:url"\s+content="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
        if (ogMatch) videoId = ogMatch[1];
        else {
          const vIdMatch = html.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
          if (vIdMatch) videoId = vIdMatch[1];
        }
      }
    }

    const ytcfg = extractYtcfg(html);
    const ytInitialData = extractInitialData(html, 'ytInitialData');
    const ytInitialPlayerResponse = extractInitialData(html, 'ytInitialPlayerResponse');

    const apiKey = ytcfg.INNERTUBE_API_KEY || 'AIzaSyAO_FJ2SlqU8Q4usTI';
    const clientVersion = ytcfg.INNERTUBE_CLIENT_VERSION || '2.20240501.01.00';
    const clientContext = ytcfg.INNERTUBE_CONTEXT || {
      client: {
        clientName: 'WEB',
        clientVersion: clientVersion,
        hl: 'pt',
        gl: 'BR',
        utcOffsetMinutes: -180,
      }
    };

    // Determina se é live ativa
    const isLiveContent = ytInitialPlayerResponse?.videoDetails?.isLive ||
                          ytInitialPlayerResponse?.videoDetails?.isLiveContent ||
                          html.includes('"isLive":true') ||
                          html.includes('liveChatRenderer');

    // Extrai título e autor
    const title = ytInitialPlayerResponse?.videoDetails?.title ||
                  ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find(c => c.videoPrimaryInfoRenderer)?.videoPrimaryInfoRenderer?.title?.runs?.[0]?.text ||
                  html.match(/<meta\s+name="title"\s+content="([^"]+)"/)?.[1] ||
                  null;

    const author = ytInitialPlayerResponse?.videoDetails?.author ||
                   html.match(/<link\s+itemprop="name"\s+content="([^"]+)"/)?.[1] ||
                   null;

    const concurrentViewers = extractConcurrentViewers(ytInitialData, ytInitialPlayerResponse);
    const continuation = findContinuationToken(ytInitialData);

    return {
      ok: true,
      status: 200,
      targetUrl,
      finalUrl,
      videoId,
      title,
      author,
      isLive: !!isLiveContent && !!videoId,
      concurrentViewers,
      continuation,
      apiKey,
      clientVersion,
      clientContext,
      durationMs,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      targetUrl,
      durationMs: Date.now() - startTime,
      error: err.message || String(err),
    };
  }
}
