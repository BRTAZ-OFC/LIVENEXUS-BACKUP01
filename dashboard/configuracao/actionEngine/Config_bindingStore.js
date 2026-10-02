// Store de bindings (Trigger -> Action)
import { DEFAULT_BINDINGS } from './Config_defaultBindings';
import { getAction } from './Config_actionRegistry';

let bindings = [];
let loaded = false;

function cloneDefaults() {
  return DEFAULT_BINDINGS.map((b) => ({ ...b }));
}

function isValidBinding(b) {
  return (
    b && typeof b === 'object' &&
    typeof b.source === 'string' && b.source === 'keyboard' &&
    typeof b.descriptor === 'string' && b.descriptor.length > 0 &&
    typeof b.actionId === 'string' && getAction(b.actionId) !== null &&
    typeof b.enabled === 'boolean'
  );
}

function persist() {
}

function load() {
  if (loaded) return;
  loaded = true;
  bindings = cloneDefaults();
}

export function getBindings() {
  load();
  return bindings.map((b) => ({ ...b }));
}

export function findBinding(source, descriptor) {
  load();
  return (
    bindings.find((b) => b.source === source && b.descriptor === descriptor && b.enabled) || null
  );
}

export function descriptorExists(source, descriptor, exceptActionId = null) {
  load();
  return (
    bindings.find(
      (b) => b.source === source && b.descriptor === descriptor && b.actionId !== exceptActionId
    ) || null
  );
}

export function getBindingForAction(actionId, source = 'keyboard') {
  load();
  return bindings.find((b) => b.source === source && b.actionId === actionId) || null;
}

export function setBinding(actionId, source, descriptor) {
  load();
  if (getAction(actionId) === null) return { ok: false, reason: 'NOT_FOUND' };
  if (!descriptor || typeof descriptor !== 'string') return { ok: false, reason: 'INVALID_DESCRIPTOR' };
  const conflict = descriptorExists(source, descriptor, actionId);
  if (conflict) return { ok: false, reason: 'DUPLICATE_DESCRIPTOR', conflict };
  bindings = bindings.filter((b) => !(b.source === source && b.actionId === actionId));
  bindings.push({ source, descriptor, actionId, enabled: true });
  persist();
  return { ok: true };
}

export function toggleBinding(actionId, source, enabled) {
  load();
  const b = bindings.find((x) => x.source === source && x.actionId === actionId);
  if (!b) return { ok: false, reason: 'NOT_FOUND' };
  b.enabled = !!enabled;
  persist();
  return { ok: true };
}

export function resetToDefaults() {
  bindings = cloneDefaults();
  loaded = true;
  persist();
  return getBindings();
}
