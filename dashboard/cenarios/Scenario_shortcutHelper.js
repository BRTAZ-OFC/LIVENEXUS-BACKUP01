// Helper for key normalization, matching, and cross-tab/OBS synchronization

export function parseSubShortcut(sub) {
  if (!sub) return { trigger: '', key: '' };
  
  let trigger = sub.trigger;
  let key = sub.key;
  
  if (!trigger && !key && sub.shortcut) {
    const parts = sub.shortcut.split('+').map(p => p.trim());
    if (parts.length >= 2) {
      trigger = parts[0];
      key = parts.slice(1).join(' + ');
    } else if (parts.length === 1) {
      const p = parts[0];
      if (['Shift', 'Ctrl', 'Alt', 'Win', 'Cmd', 'Meta'].includes(p)) {
        trigger = p;
        key = '';
      } else {
        trigger = ''; // Defaulting to 'None' for single keys
        key = p;
      }
    }
  }
  
  return {
    trigger: trigger || '',
    key: key || ''
  };
}

export function formatKeyFromEvent(e) {
  if (!e) return '';
  if (e.key === 'Control' || e.key === 'Ctrl') return 'Ctrl';
  if (e.key === 'Shift') return 'Shift';
  if (e.key === 'Alt') return 'Alt';
  if (e.key === 'Meta' || e.key === 'OS') return 'Win';
  
  // Normalization for top-row digits (Shift+1 often produces '!' on keyboard layouts)
  if (e.code && e.code.startsWith('Digit')) {
    return e.code.replace('Digit', '');
  }
  
  // Numpad digits (Numpad1 -> 1)
  if (e.code && e.code.startsWith('Numpad') && !isNaN(Number(e.code.replace('Numpad', '')))) {
    return e.code.replace('Numpad', '');
  }
  
  // Standard letter keys (KeyA -> A, KeyZ -> Z)
  if (e.code && e.code.startsWith('Key')) {
    return e.code.replace('Key', '').toUpperCase();
  }
  
  // Function keys (F1 - F12)
  if (e.code && /^F\d{1,2}$/i.test(e.code)) {
    return e.code.toUpperCase();
  }
  if (e.key && /^F\d{1,2}$/i.test(e.key)) {
    return e.key.toUpperCase();
  }
  
  // Special keys
  if (e.key === ' ' || e.code === 'Space') return 'Espaço';
  if (e.key === 'ArrowUp' || e.code === 'ArrowUp') return '↑';
  if (e.key === 'ArrowDown' || e.code === 'ArrowDown') return '↓';
  if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') return '←';
  if (e.key === 'ArrowRight' || e.code === 'ArrowRight') return '→';
  if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') return 'Enter';
  if (e.key === 'Tab' || e.code === 'Tab') return 'Tab';
  if (e.key === 'Escape' || e.code === 'Escape') return 'Esc';
  if (e.key === 'Backspace' || e.code === 'Backspace') return 'Backspace';
  if (e.key === 'Delete' || e.code === 'Delete') return 'Delete';
  
  if (e.key && e.key.length === 1) {
    return e.key.toUpperCase();
  }
  
  return e.key || e.code || '';
}

export function matchesSubscenarioShortcut(e, sub, heldKeys = new Set()) {
  if (!sub) return false;
  const { trigger, key } = parseSubShortcut(sub);
  if (!key) return false;
  
  const targetKey = String(key).trim().toUpperCase();
  const targetTrigger = String(trigger || '').trim().toUpperCase();
  
  // Normalized key from current event
  const currentKey = formatKeyFromEvent(e).toUpperCase();
  const rawKey = String(e.key || '').toUpperCase();
  const rawCode = String(e.code || '').toUpperCase();
  const cleanCode = rawCode.replace(/^(KEY|DIGIT|NUMPAD)/i, '').toUpperCase();
  
  // Is this event hitting the target activation key?
  const isKeyMatch = (
    currentKey === targetKey ||
    rawKey === targetKey ||
    rawCode === targetKey ||
    cleanCode === targetKey ||
    rawCode === `KEY${targetKey}` ||
    rawCode === `DIGIT${targetKey}`
  );

  // Is this event hitting the trigger key?
  const isTriggerMatchEvent = (
    (targetTrigger === 'SHIFT' && (rawKey === 'SHIFT' || rawCode.startsWith('SHIFT'))) ||
    (targetTrigger === 'CTRL' && (rawKey === 'CONTROL' || rawCode.startsWith('CONTROL'))) ||
    (targetTrigger === 'ALT' && (rawKey === 'ALT' || rawCode.startsWith('ALT'))) ||
    (targetTrigger === 'WIN' && (rawKey === 'META' || rawCode.startsWith('META'))) ||
    (currentKey === targetTrigger || rawKey === targetTrigger || cleanCode === targetTrigger)
  );

  // Check if modifier / trigger is currently active or held
  let isTriggerActive = false;
  if (!targetTrigger || targetTrigger === 'NENHUM' || targetTrigger === 'NONE' || targetTrigger === '') {
    isTriggerActive = !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
  } else if (targetTrigger === 'SHIFT') {
    isTriggerActive = Boolean(e.shiftKey) || heldKeys.has('SHIFT');
  } else if (targetTrigger === 'CTRL' || targetTrigger === 'CONTROL') {
    isTriggerActive = Boolean(e.ctrlKey) || heldKeys.has('CTRL') || heldKeys.has('CONTROL');
  } else if (targetTrigger === 'ALT') {
    isTriggerActive = Boolean(e.altKey) || heldKeys.has('ALT');
  } else if (targetTrigger === 'WIN' || targetTrigger === 'CMD' || targetTrigger === 'META') {
    isTriggerActive = Boolean(e.metaKey) || heldKeys.has('WIN') || heldKeys.has('META');
  } else {
    isTriggerActive = heldKeys.has(targetTrigger);
  }

  // Check if target key is active
  const isKeyActive = isKeyMatch || heldKeys.has(targetKey);

  // MATCH CASE 1: O evento atual é a tecla alvo e o modificador/gatilho está ativo
  if (isKeyMatch && isTriggerActive) {
    return true;
  }

  // MATCH CASE 2: O evento atual é a tecla modificadora e a tecla alvo já está pressionada
  if (isTriggerMatchEvent && heldKeys.has(targetKey)) {
    return true;
  }

  return false;
}

export function broadcastScenarioChange(scenarioId, subscenarioId) {
  if (!scenarioId || typeof window === 'undefined') return;
  const sid = String(scenarioId);
  
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(`scenario_channel_${sid}`);
      channel.postMessage({ type: 'SWITCH_SUBSCENARIO', subscenarioId, timestamp: Date.now() });
      channel.close();
    }
  } catch (err) {
    console.error('BroadcastChannel error:', err);
  }
  
  try {
    window.localStorage.setItem(`scenario_active_sub_${sid}`, JSON.stringify({
      subscenarioId,
      timestamp: Date.now()
    }));
  } catch (err) {
    // Ignore storage quota errors
  }
}
