import { useState, useEffect, useRef } from 'react';

function toMs(value, unit) {
  const num = Number(value) || 0;
  if (unit === 'minutes') return num * 60 * 1000;
  if (unit === 'hours') return num * 60 * 60 * 1000;
  return num * 1000; // seconds
}

export function useVisibilityAnimation(config = {}, triggers = {}) {
  const {
    visibilityMode = 'always',
    visibilityIntervalValue = 30,
    visibilityIntervalUnit = 'seconds',
    visibilityDurationValue = 10,
    visibilityDurationUnit = 'seconds',
  } = config;

  const { interactive, lastMessage, events } = triggers;

  const [visible, setVisible] = useState(visibilityMode === 'always');

  const hideTimerRef = useRef(null);
  const showTimerRef = useRef(null);

  // Track changes to triggers to identify new interactions
  const prevTriggersRef = useRef({ initialized: false, lastMessageId: null, eventsCount: 0, interactiveJson: '' });

  // Reset/rebuild cyclic or event lifecycle timers whenever the visibility configuration changes
  useEffect(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);

    if (visibilityMode === 'always') {
      setVisible(true);
    } else if (visibilityMode === 'byTime') {
      // Periodic re-appearance
      startByTimeLifecycle();
    } else {
      // 'onEvent' starts hidden
      setVisible(false);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [visibilityMode, visibilityIntervalValue, visibilityIntervalUnit, visibilityDurationValue, visibilityDurationUnit]);

  // Helper to start the cyclic show/hide for "Por Tempo"
  const startByTimeLifecycle = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);

    setVisible(true);
    const durMs = toMs(visibilityDurationValue, visibilityDurationUnit);
    const intMs = toMs(visibilityIntervalValue, visibilityIntervalUnit);

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      // After hiding, schedule the next show
      showTimerRef.current = setTimeout(() => {
        startByTimeLifecycle();
      }, intMs);
    }, durMs);
  };

  // Helper to handle a temporary show (on event/interaction)
  const triggerTemporaryShow = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);

    setVisible(true);
    const durMs = toMs(visibilityDurationValue, visibilityDurationUnit);

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);

      // If in "Por tempo" mode, resume the cyclic lifecycle after the duration
      if (visibilityMode === 'byTime') {
        const intMs = toMs(visibilityIntervalValue, visibilityIntervalUnit);
        showTimerRef.current = setTimeout(() => {
          startByTimeLifecycle();
        }, intMs);
      }
    }, durMs);
  };

  // Watch triggers for interactions
  useEffect(() => {
    if (visibilityMode === 'always') return;

    const currentMsgId = lastMessage?.id || lastMessage?.timestamp || null;
    const currentEventsCount = Array.isArray(events) ? events.length : 0;
    const currentInteractiveJson = interactive ? JSON.stringify(interactive) : '';

    const prev = prevTriggersRef.current;

    let hasInteraction = false;

    if (prev.initialized) {
      if (currentMsgId !== prev.lastMessageId) {
        hasInteraction = true;
      }
      if (currentEventsCount !== prev.eventsCount) {
        hasInteraction = true;
      }
      if (currentInteractiveJson !== prev.interactiveJson) {
        hasInteraction = true;
      }
    }

    // Save current values for next comparison
    prevTriggersRef.current = {
      initialized: true,
      lastMessageId: currentMsgId,
      eventsCount: currentEventsCount,
      interactiveJson: currentInteractiveJson,
    };

    if (hasInteraction) {
      triggerTemporaryShow();
    }
  }, [lastMessage, events, interactive, visibilityMode]);

  return visible;
}
