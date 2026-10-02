// Conexão oficial ao YouTube: Bootstrap 1-shot + polling contínuo de chat e eventos via Cloudflare Worker.
// 100% alinhado com a fórmula validada no Painel Admin -> Laboratório -> Teste YouTube 1.
// connectYouTube(channel, onMessage, onStatus, onMeta) -> { disconnect }

const WORKER_LIVE_CHAT_ENDPOINT = 'https://youtube-innertube.radiotweet.workers.dev/live-chat';

export function parseYouTubeViewers(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // Verifica sufixos K ou M se existirem (ex: 1.5K, 2.3M)
  if (/\d+([.,]\d+)?\s*[kK]/.test(trimmed)) {
    const num = parseFloat(trimmed.replace(/[^\d.,]/g, '').replace(',', '.'));
    return Number.isFinite(num) ? Math.round(num * 1000) : null;
  }
  if (/\d+([.,]\d+)?\s*[mM]/.test(trimmed)) {
    const num = parseFloat(trimmed.replace(/[^\d.,]/g, '').replace(',', '.'));
    return Number.isFinite(num) ? Math.round(num * 1000000) : null;
  }

  // Extrai dígitos numéricos (ex: "1.234 assistindo agora" -> 1234)
  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  if (digitsOnly) {
    const parsed = parseInt(digitsOnly, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseYouTubeRoles(item) {
  const roles = [];
  const badges = item?.authorBadges || [];
  for (const b of badges) {
    const iconType = b?.liveChatAuthorBadgeRenderer?.icon?.iconType || '';
    const tooltip = (b?.liveChatAuthorBadgeRenderer?.tooltip || '').toLowerCase();
    if (iconType === 'OWNER' || tooltip.includes('proprietário') || tooltip.includes('owner')) {
      roles.push('broadcaster');
    } else if (iconType === 'MODERATOR' || tooltip.includes('moderador') || tooltip.includes('mod')) {
      roles.push('moderator');
    } else if (tooltip.includes('membro') || tooltip.includes('member') || tooltip.includes('subscriber')) {
      roles.push('subscriber');
    }
  }
  return roles.length > 0 ? [...new Set(roles)] : ['normal'];
}

// Processa ações individuais do InnerTube: mensagens comuns e eventos estruturais (Super Chat, Sticker, Membros, Enquetes)
function processYouTubeChatAction(act, onMessage) {
  if (!act || !onMessage) return;

  // 1. Mensagem de texto padrão (liveChatTextMessageRenderer)
  const textItem = act.addChatItemAction?.item?.liveChatTextMessageRenderer;
  if (textItem) {
    const author = textItem.authorName?.simpleText || 'Anônimo';
    const msgText = textItem.message?.runs?.map((r) => r.text).join('') || '';
    const msgId = textItem.id || crypto.randomUUID();
    const timestamp = textItem.timestampUsec
      ? Math.floor(parseInt(textItem.timestampUsec, 10) / 1000)
      : Date.now();
    const roles = parseYouTubeRoles(textItem);

    if (msgText.trim()) {
      onMessage({
        id: msgId,
        author,
        authorId: textItem.authorExternalChannelId || null,
        text: msgText,
        roles,
        timestamp,
        firstMsg: false,
        eventType: null,
        eventMeta: null,
        emotes: null,
      });
    }
    return;
  }

  // 2. Super Chat (liveChatPaidMessageRenderer)
  const paidItem = act.addChatItemAction?.item?.liveChatPaidMessageRenderer;
  if (paidItem) {
    const author = paidItem.authorName?.simpleText || 'Anônimo';
    const msgText = paidItem.message?.runs?.map((r) => r.text).join('') || '';
    const amount = paidItem.purchaseAmountText?.simpleText || 'Super Chat';
    const msgId = paidItem.id || crypto.randomUUID();
    const timestamp = paidItem.timestampUsec
      ? Math.floor(parseInt(paidItem.timestampUsec, 10) / 1000)
      : Date.now();
    const roles = parseYouTubeRoles(paidItem);

    onMessage({
      id: msgId,
      author,
      authorId: paidItem.authorExternalChannelId || null,
      text: msgText ? `${amount} — ${msgText}` : `${author} enviou um Super Chat de ${amount}!`,
      roles,
      timestamp,
      firstMsg: false,
      eventType: 'youtube_superchat',
      eventMeta: {
        amount,
        amountText: amount,
        bodyBackgroundColor: paidItem.bodyBackgroundColor,
        headerBackgroundColor: paidItem.headerBackgroundColor,
        originalMessage: msgText,
      },
      emotes: null,
    });
    return;
  }

  // 3. Super Sticker (liveChatPaidStickerRenderer)
  const stickerItem = act.addChatItemAction?.item?.liveChatPaidStickerRenderer;
  if (stickerItem) {
    const author = stickerItem.authorName?.simpleText || 'Anônimo';
    const amount = stickerItem.purchaseAmountText?.simpleText || 'Super Sticker';
    const stickerUrl = stickerItem.sticker?.thumbnails?.[0]?.url || null;
    const msgId = stickerItem.id || crypto.randomUUID();
    const timestamp = stickerItem.timestampUsec
      ? Math.floor(parseInt(stickerItem.timestampUsec, 10) / 1000)
      : Date.now();
    const roles = parseYouTubeRoles(stickerItem);

    onMessage({
      id: msgId,
      author,
      authorId: stickerItem.authorExternalChannelId || null,
      text: `${author} enviou um Super Sticker de ${amount}!`,
      roles,
      timestamp,
      firstMsg: false,
      eventType: 'youtube_supersticker',
      eventMeta: {
        amount,
        amountText: amount,
        stickerUrl,
      },
      emotes: null,
    });
    return;
  }

  // 4. Membership / Novo Membro / Marco de Membro (liveChatMembershipItemRenderer)
  const memberItem = act.addChatItemAction?.item?.liveChatMembershipItemRenderer;
  if (memberItem) {
    const author = memberItem.authorName?.simpleText || 'Anônimo';
    const headerSubtext = memberItem.headerSubtext?.runs?.map((r) => r.text).join('') || '';
    const headerPrimary = memberItem.headerPrimaryText?.runs?.map((r) => r.text).join('') || '';
    const msgText = memberItem.message?.runs?.map((r) => r.text).join('') || '';
    const msgId = memberItem.id || crypto.randomUUID();
    const timestamp = memberItem.timestampUsec
      ? Math.floor(parseInt(memberItem.timestampUsec, 10) / 1000)
      : Date.now();
    const roles = ['subscriber', ...parseYouTubeRoles(memberItem)];

    const eventDetail = headerSubtext || headerPrimary || 'Novo membro!';
    onMessage({
      id: msgId,
      author,
      authorId: memberItem.authorExternalChannelId || null,
      text: msgText ? `${eventDetail}: ${msgText}` : `${author} virou membro (${eventDetail})`,
      roles: [...new Set(roles)],
      timestamp,
      firstMsg: false,
      eventType: 'youtube_membership',
      eventMeta: {
        headerSubtext,
        headerPrimaryText: headerPrimary,
        message: msgText,
      },
      emotes: null,
    });
    return;
  }

  // 5. Presente de Membresias (liveChatSponsorshipsGiftPurchaseAnnouncementRenderer)
  const giftPurchase = act.addChatItemAction?.item?.liveChatSponsorshipsGiftPurchaseAnnouncementRenderer;
  if (giftPurchase) {
    const header = giftPurchase.header?.liveChatSponsorshipsHeaderRenderer;
    const author = header?.authorName?.simpleText || 'Anônimo';
    const primaryText = header?.primaryText?.runs?.map((r) => r.text).join('') || 'Presenteou membros';
    const msgId = giftPurchase.id || crypto.randomUUID();
    const timestamp = Date.now();

    onMessage({
      id: msgId,
      author,
      authorId: null,
      text: `${author}: ${primaryText}`,
      roles: ['subscriber'],
      timestamp,
      firstMsg: false,
      eventType: 'youtube_membership_gifting',
      eventMeta: {
        announcement: primaryText,
      },
      emotes: null,
    });
    return;
  }

  // 6. Membresia de Presente Recebida (liveChatSponsorshipsGiftRedemptionAnnouncementRenderer)
  const giftRedemption = act.addChatItemAction?.item?.liveChatSponsorshipsGiftRedemptionAnnouncementRenderer;
  if (giftRedemption) {
    const author = giftRedemption.authorName?.simpleText || 'Anônimo';
    const msgText = giftRedemption.message?.runs?.map((r) => r.text).join('') || 'Ganhou uma membresia de presente!';
    const msgId = giftRedemption.id || crypto.randomUUID();
    const timestamp = giftRedemption.timestampUsec
      ? Math.floor(parseInt(giftRedemption.timestampUsec, 10) / 1000)
      : Date.now();

    onMessage({
      id: msgId,
      author,
      authorId: giftRedemption.authorExternalChannelId || null,
      text: `${author} ${msgText}`,
      roles: ['subscriber'],
      timestamp,
      firstMsg: false,
      eventType: 'youtube_gift_membership_received',
      eventMeta: {
        message: msgText,
      },
      emotes: null,
    });
    return;
  }

  // 7. Enquete Nativa do YouTube (showLiveChatActionPanelAction ou updateLiveChatPollAction)
  const pollRenderer =
    act.showLiveChatActionPanelAction?.panelToShow?.liveChatActionPanelRenderer?.contents?.pollRenderer ||
    act.updateLiveChatPollAction?.pollToUpdate?.pollRenderer;
  if (pollRenderer) {
    const pollId = pollRenderer.liveChatPollId || crypto.randomUUID();
    const question =
      pollRenderer.header?.pollHeaderRenderer?.pollQuestion?.runs?.map((r) => r.text).join('') ||
      pollRenderer.header?.pollHeaderRenderer?.pollQuestion?.simpleText ||
      'Enquete do YouTube';
    const status =
      pollRenderer.header?.pollHeaderRenderer?.metadataText?.runs?.map((r) => r.text).join('') ||
      'Enquete ativa';
    const options = (pollRenderer.choices || []).map((c, idx) => ({
      id: c.selected?.toString() || idx,
      text: c.text?.runs?.map((r) => r.text).join('') || c.text?.simpleText || `Opção ${idx + 1}`,
      voteRatio: typeof c.voteRatio === 'number' ? c.voteRatio : null,
      votePercentage: c.votePercentage?.simpleText || '',
      voteCount: c.voteCount?.simpleText || null,
    }));

    onMessage({
      id: `poll_${pollId}`,
      author: 'YouTube',
      authorId: null,
      text: `[Enquete] ${question}`,
      roles: ['broadcaster'],
      timestamp: Date.now(),
      firstMsg: false,
      eventType: 'youtube_poll',
      eventMeta: {
        pollId,
        question,
        options,
        status,
      },
      emotes: null,
    });
    return;
  }

  // 8. Fechamento de painel de enquete (closeLiveChatActionPanelAction)
  if (act.closeLiveChatActionPanelAction) {
    const targetId = act.closeLiveChatActionPanelAction.targetPanelId || 'poll_closed';
    onMessage({
      id: `poll_closed_${Date.now()}`,
      author: 'YouTube',
      authorId: null,
      text: '[Enquete encerrada]',
      roles: ['broadcaster'],
      timestamp: Date.now(),
      firstMsg: false,
      eventType: 'youtube_poll',
      eventMeta: {
        pollId: targetId,
        status: 'Enquete encerrada',
        closed: true,
      },
      emotes: null,
    });
  }
}

export function connectYouTube(channel, onMessage, onStatus, onMeta) {
  let stopped = false;
  let metaTimer = null;
  let chatAbortController = null;
  const chan = (channel || '').trim();

  if (!chan) {
    onStatus('idle', 'Informe o identificador do canal do YouTube (@handle, URL ou Video ID).');
    return { disconnect: () => {} };
  }

  onStatus('connecting');

  // Loop contínuo de polling do chat e eventos via Cloudflare Worker
  async function startChatLoop(bootstrapData) {
    let currentContinuation = bootstrapData.continuation;
    const apiKey = bootstrapData.apiKey;
    const clientContext = bootstrapData.clientContext || {
      client: {
        clientName: 'WEB',
        clientVersion: bootstrapData.clientVersion || '2.20240501.01.00',
        hl: 'pt',
        gl: 'BR',
      },
    };

    if (!currentContinuation || !apiKey) {
      return;
    }

    let consecutiveErrors = 0;

    while (!stopped) {
      chatAbortController = new AbortController();
      const signal = chatAbortController.signal;

      const payload = {
        apiKey,
        clientContext,
        continuation: currentContinuation,
      };

      try {
        const response = await fetch(WORKER_LIVE_CHAT_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal,
        });

        if (stopped) break;

        if (!response.ok) {
          consecutiveErrors++;
          if (consecutiveErrors >= 5) {
            onStatus('reconnecting', `Worker respondeu HTTP ${response.status}. Tentando reconectar...`);
          }
          await new Promise((resolve) => setTimeout(resolve, Math.min(30000, 3000 * consecutiveErrors)));
          continue;
        }

        consecutiveErrors = 0;
        const data = await response.json();
        if (stopped) break;

        const chatContinuationObj = data?.continuationContents?.liveChatContinuation;
        const actions = chatContinuationObj?.actions || [];
        const nextConts = chatContinuationObj?.continuations || [];

        // Entrega mensagens e eventos para o fluxo normal da plataforma (onMessage)
        for (const act of actions) {
          processYouTubeChatAction(act, onMessage);
        }

        // Extrai próxima continuação e timeout recomendado
        let nextToken = null;
        let timeoutMs = 3000;
        if (nextConts.length > 0) {
          const c0 = nextConts[0];
          nextToken =
            c0.invalidationContinuationData?.continuation ||
            c0.timedContinuationData?.continuation ||
            c0.reloadContinuationData?.continuation;

          const tMs =
            c0.invalidationContinuationData?.timeoutMs ||
            c0.timedContinuationData?.timeoutMs ||
            c0.reloadContinuationData?.timeoutMs;

          if (typeof tMs === 'number' && tMs > 0) {
            timeoutMs = tMs;
          }
        }

        if (nextToken) {
          currentContinuation = nextToken;
        }

        // Aguarda o timeout especificado pelo YouTube antes do próximo poll
        await new Promise((resolve) => setTimeout(resolve, Math.max(1000, timeoutMs)));
      } catch (err) {
        if (stopped) break;
        consecutiveErrors++;
        await new Promise((resolve) => setTimeout(resolve, Math.min(30000, 2000 * consecutiveErrors)));
      }
    }
  }

  // Executa o Bootstrap 1-shot inicial
  async function fetchBootstrapAndStart() {
    if (stopped) return;
    try {
      const resp = await fetch(`/api/admin/lab/youtube-test1/bootstrap?identifier=${encodeURIComponent(chan)}`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = await resp.json();
      if (stopped) return;

      if (!data.ok) {
        onStatus('idle', data.error || 'Erro ao resolver live do YouTube.');
        onMeta({ viewers: null, offline: true });
        return;
      }

      if (data.isLive && data.videoId) {
        const parsedViewers = parseYouTubeViewers(data.concurrentViewers);
        onStatus('connected');
        onMeta({
          viewers: parsedViewers,
          meta: {
            streamId: data.videoId,
            title: data.title || '',
            channelName: data.author || chan,
            startedAt: new Date().toISOString(),
            streamUrl: data.finalUrl || `https://www.youtube.com/watch?v=${data.videoId}`,
          },
        });

        // Inicia o polling contínuo de chat e eventos através do Worker
        startChatLoop(data);
      } else {
        onStatus('idle', 'Canal offline ou sem live ativa no momento.');
        onMeta({ viewers: null, offline: true });
      }
    } catch (err) {
      if (stopped) return;
      onStatus('idle', err.message || 'Falha ao consultar live do YouTube.');
      onMeta({ viewers: null, offline: true });
    }
  }

  fetchBootstrapAndStart();

  // Atualização periódica de espectadores em segundo plano
  metaTimer = setInterval(async () => {
    if (stopped) return;
    try {
      const resp = await fetch(`/api/admin/lab/youtube-test1/bootstrap?identifier=${encodeURIComponent(chan)}`);
      if (resp.ok && !stopped) {
        const data = await resp.json();
        if (data.ok && data.isLive) {
          const parsedViewers = parseYouTubeViewers(data.concurrentViewers);
          onMeta({
            viewers: parsedViewers,
            meta: {
              streamId: data.videoId,
              title: data.title || '',
              channelName: data.author || chan,
              startedAt: new Date().toISOString(),
              streamUrl: data.finalUrl || `https://www.youtube.com/watch?v=${data.videoId}`,
            },
          });
        }
      }
    } catch {}
  }, 45000);

  return {
    disconnect: () => {
      stopped = true;
      if (metaTimer) clearInterval(metaTimer);
      if (chatAbortController) {
        try { chatAbortController.abort(); } catch {}
      }
      onStatus('idle');
      onMeta({ viewers: null, offline: true });
    },
  };
}
