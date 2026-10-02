// Service to manage community submitted videos for the REACT subscenario
// Handles parsing of various video sources (YouTube, Twitch Clips, TikTok, Direct MP4/WebM, Streamable, etc.)
// Manages real-time synchronization between the Dashboard/Editor and the Live OBS Overlay (LiveScenarioViewer)

const STORAGE_QUEUE_KEY = 'scenario_react_queue';
const STORAGE_ACTIVE_KEY = 'scenario_react_active_video';
const BROADCAST_CHANNEL_NAME = 'scenario_react_bus';

export function parseVideoUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return null;
  const url = inputUrl.trim();

  // ONLY YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      platform: 'YouTube',
      type: 'iframe',
      videoId,
      originalUrl: url,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0`,
      icon: 'youtube',
      badgeColor: '#ef4444'
    };
  }

  return null;
}

// Broadcast message helper
function broadcastReactEvent(type, payload) {
  if (typeof window === 'undefined') return;
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type, payload, timestamp: Date.now() });
      channel.close();
    }
  } catch (err) {
    console.error('React broadcast error:', err);
  }
}

// Storage helpers
export function getStoredReactQueue() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredReactQueue(queue) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    broadcastReactEvent('QUEUE_UPDATED', queue);
  } catch (err) {
    console.error('Save queue error:', err);
  }
}

export function getStoredActiveReactVideo() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredActiveReactVideo(video) {
  if (typeof window === 'undefined') return;
  try {
    if (video) {
      window.localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(video));
    } else {
      window.localStorage.removeItem(STORAGE_ACTIVE_KEY);
    }
    broadcastReactEvent('ACTIVE_VIDEO_CHANGED', video);
  } catch (err) {
    console.error('Save active video error:', err);
  }
}

// Add user-submitted link to the community queue
export function addVideoToReactQueue({ url, author, title, source = 'manual' }) {
  if (!url) return { success: false, error: 'URL do vídeo é obrigatória' };
  
  const parsed = parseVideoUrl(url);
  if (!parsed) {
    return { success: false, error: 'URL inválida ou formato de vídeo não suportado' };
  }

  const currentQueue = getStoredReactQueue();
  
  // Check if identical originalUrl is already in queue
  const exists = currentQueue.some(item => item.url.trim().toLowerCase() === url.trim().toLowerCase());
  if (exists) {
    return { success: false, error: 'Este link de vídeo já está na fila' };
  }

  const newItem = {
    id: `react-vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    url: url.trim(),
    author: author ? author.trim() : 'Espectador',
    title: title ? title.trim() : `${parsed.platform}: ${url.trim()}`,
    parsed,
    source, // 'manual' | 'chat'
    status: 'pending', // 'pending' | 'playing' | 'watched'
    timestamp: Date.now()
  };

  const updatedQueue = [newItem, ...currentQueue];
  saveStoredReactQueue(updatedQueue);
  return { success: true, item: newItem };
}

// Select and start playing a video in the REACT main area
export function playReactVideo(videoIdOrItem) {
  const currentQueue = getStoredReactQueue();
  let targetItem = null;

  if (typeof videoIdOrItem === 'string') {
    targetItem = currentQueue.find(item => item.id === videoIdOrItem);
  } else if (videoIdOrItem && typeof videoIdOrItem === 'object') {
    targetItem = videoIdOrItem;
  }

  if (!targetItem) return false;

  // Mark in queue as playing
  const updatedQueue = currentQueue.map(item => {
    if (item.id === targetItem.id) {
      return { ...item, status: 'playing' };
    }
    if (item.status === 'playing') {
      return { ...item, status: 'watched' };
    }
    return item;
  });

  saveStoredReactQueue(updatedQueue);
  saveStoredActiveReactVideo({ ...targetItem, status: 'playing', startedAt: Date.now() });
  return true;
}

// Stop current active video playback
export function stopReactVideo() {
  const currentActive = getStoredActiveReactVideo();
  if (currentActive) {
    const currentQueue = getStoredReactQueue();
    const updatedQueue = currentQueue.map(item => 
      item.id === currentActive.id ? { ...item, status: 'watched' } : item
    );
    saveStoredReactQueue(updatedQueue);
  }
  saveStoredActiveReactVideo(null);
}

// Delete item from queue
export function removeReactVideo(id) {
  const currentQueue = getStoredReactQueue();
  const updatedQueue = currentQueue.filter(item => item.id !== id);
  saveStoredReactQueue(updatedQueue);

  const currentActive = getStoredActiveReactVideo();
  if (currentActive && currentActive.id === id) {
    saveStoredActiveReactVideo(null);
  }
}

// Clear all watched items
export function clearWatchedReactVideos() {
  const currentQueue = getStoredReactQueue();
  const updatedQueue = currentQueue.filter(item => item.status !== 'watched');
  saveStoredReactQueue(updatedQueue);
}

// Check chat items from liveActivity to automatically capture submitted video links
export function syncVideosFromChatMessages(chatItems = []) {
  if (!chatItems || !Array.isArray(chatItems)) return;

  chatItems.forEach(msg => {
    if (!msg || !msg.text) return;
    const text = String(msg.text);

    // Look for URLs in message
    const urlMatches = text.match(/https?:\/\/[^\s"'<>]+/gi);
    if (urlMatches && urlMatches.length > 0) {
      urlMatches.forEach(rawUrl => {
        const parsed = parseVideoUrl(rawUrl);
        if (parsed) {
          // Attempt to add, ignores if already in queue
          addVideoToReactQueue({
            url: rawUrl,
            author: msg.author || msg.username || 'Chat da Live',
            title: text,
            source: 'chat'
          });
        }
      });
    }
  });
}
