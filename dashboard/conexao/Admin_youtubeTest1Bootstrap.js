// dashboard/conexao/Admin_youtubeTest1Bootstrap.js
// Resolve live do YouTube a partir de identificador (@handle, url ou videoId)
// Extrai dados estruturados do InnerTube: apiKey, continuation, clientContext, viewers, videoId, etc.

export async function resolveYouTubeLiveBootstrap(identifier) {
  if (!identifier) {
    return { ok: false, error: 'Identificador do YouTube não fornecido.' };
  }

  const raw = String(identifier).trim();
  let targetUrl = '';

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    targetUrl = raw;
  } else if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    targetUrl = `https://www.youtube.com/watch?v=${raw}`;
  } else if (raw.startsWith('@')) {
    targetUrl = `https://www.youtube.com/${raw}/live`;
  } else if (raw.startsWith('UC') && raw.length === 24) {
    targetUrl = `https://www.youtube.com/channel/${raw}/live`;
  } else {
    targetUrl = `https://www.youtube.com/@${raw}/live`;
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return { ok: false, error: `Falha ao acessar YouTube (HTTP ${res.status})`, finalUrl: targetUrl };
    }

    const html = await res.text();
    const finalUrl = res.url || targetUrl;

    // Extrai ytcfg (apiKey, clientVersion, etc.)
    let apiKey = '';
    let clientVersion = '2.20240501.01.00';
    const clientContext = {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240501.01.00',
        hl: 'pt',
        gl: 'BR',
      },
    };

    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([^"]+)"/);
    if (apiKeyMatch) {
      apiKey = apiKeyMatch[1];
    }

    const clientVerMatch = html.match(/"INNERTUBE_CLIENT_VERSION":\s*"([^"]+)"/);
    if (clientVerMatch) {
      clientVersion = clientVerMatch[1];
      clientContext.client.clientVersion = clientVersion;
    }

    let videoId = '';
    let isLive = false;
    let continuation = '';
    let concurrentViewers = null;
    let title = '';
    let author = '';

    // 1. Tenta extrair via ytInitialData estruturado
    const ytDataMatch = html.match(/var\s+ytInitialData\s*=\s*({.+?});\s*<\/script>/s) ||
                        html.match(/window\["ytInitialData"\]\s*=\s*({.+?});/s);
    if (ytDataMatch) {
      try {
        const data = JSON.parse(ytDataMatch[1]);
        const contents = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];
        const primaryInfo = contents.find((c) => c.videoPrimaryInfoRenderer)?.videoPrimaryInfoRenderer;
        const secondaryInfo = contents.find((c) => c.videoSecondaryInfoRenderer)?.videoSecondaryInfoRenderer;
        const liveChat = data?.contents?.twoColumnWatchNextResults?.conversationBar?.liveChatRenderer;

        title = primaryInfo?.title?.runs?.map((r) => r.text).join('') || '';
        author = secondaryInfo?.owner?.videoOwnerRenderer?.title?.runs?.map((r) => r.text).join('') || '';
        continuation = liveChat?.continuations?.[0]?.reloadContinuationData?.continuation ||
                       liveChat?.continuations?.[0]?.timedContinuationData?.continuation ||
                       liveChat?.continuations?.[0]?.invalidationContinuationData?.continuation || '';
        videoId = data?.currentVideoEndpoint?.watchEndpoint?.videoId || '';
        concurrentViewers = primaryInfo?.viewCount?.videoViewCountRenderer?.viewCount?.runs?.map((r) => r.text).join('') || null;

        if (liveChat || primaryInfo?.viewCount?.videoViewCountRenderer?.isLive || data?.currentVideoEndpoint?.watchEndpoint?.videoId) {
          isLive = true;
        }
      } catch {
        // Fallback para regex abaixo
      }
    }

    // 2. Fallbacks com regex se algum campo estiver vazio
    if (!videoId) {
      const videoIdMatch = finalUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
                           html.match(/<meta\s+itemprop="videoId"\s+content="([a-zA-Z0-9_-]{11})"/i) ||
                           html.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
      if (videoIdMatch) {
        videoId = videoIdMatch[1];
      }
    }

    if (!continuation) {
      const continuationMatch =
        html.match(/"reloadContinuationData":\s*\{\s*"continuation":\s*"([^"]+)"/) ||
        html.match(/"timedContinuationData":\s*\{\s*"continuation":\s*"([^"]+)"/) ||
        html.match(/"invalidationContinuationData":\s*\{\s*"continuation":\s*"([^"]+)"/) ||
        html.match(/"liveChatRenderer".+?"continuation":\s*"([^"]+)"/s) ||
        html.match(/"continuation":\s*"([a-zA-Z0-9%_=~-]+)"/);
      if (continuationMatch) {
        continuation = continuationMatch[1];
      }
    }

    if (!isLive) {
      if (
        html.includes('"isLive":true') ||
        html.includes('"isLiveContent":true') ||
        html.includes('{"iconType":"LIVE"}') ||
        html.includes('liveChatRenderer')
      ) {
        isLive = true;
      }
    }

    if (!concurrentViewers) {
      const viewersMatch = html.match(/"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/) ||
                           html.match(/"videoViewCountRenderer":\s*\{[^}]*"viewCount":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
      if (viewersMatch) {
        concurrentViewers = viewersMatch[1];
      }
    }

    if (!title) {
      const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/i) ||
                         html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                         html.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        title = titleMatch[1].replace(' - YouTube', '').trim();
      }
    }

    if (!author) {
      const authorMatch = html.match(/"videoOwnerRenderer":\s*\{.+?"title":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/s) ||
                          html.match(/<link\s+itemprop="name"\s+content="([^"]+)"/i) ||
                          html.match(/"ownerChannelName":\s*"([^"]+)"/) ||
                          html.match(/"author":\s*"([^"]+)"/);
      if (authorMatch) {
        author = authorMatch[1].trim();
      }
    }

    return {
      ok: true,
      isLive,
      videoId,
      continuation,
      apiKey,
      clientContext,
      clientVersion,
      title,
      author,
      concurrentViewers,
      finalUrl,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || String(err),
      finalUrl: targetUrl,
    };
  }
}
