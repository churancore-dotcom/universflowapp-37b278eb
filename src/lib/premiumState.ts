// Runtime premium state — written by usePremium AFTER the server fetch.
// Source of truth is the server (user_subscriptions table via RLS).
// This is NOT persisted, and NOT readable from localStorage, so casual
// tampering ("set uf_audio_fx_allowed = 1") cannot flip it.

let _isPremium = false;
const listeners = new Set<(value: boolean) => void>();

export const setRuntimePremium = (value: boolean) => {
  const next = !!value;
  if (_isPremium === next) return;
  _isPremium = next;
  listeners.forEach((listener) => {
    try { listener(_isPremium); } catch { /* noop */ }
  });
  try { window.dispatchEvent(new CustomEvent('uf-premium-changed', { detail: _isPremium })); } catch { /* noop */ }
};

export const getRuntimePremium = (): boolean => _isPremium;

export const subscribeRuntimePremium = (listener: (value: boolean) => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
