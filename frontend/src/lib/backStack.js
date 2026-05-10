import { useEffect } from 'react';

/**
 * Tiny global back-stack that lets React dialogs intercept the Android
 * hardware back button before MainActivity falls back to its
 * "go home or stay put" behaviour.
 *
 * Native side (MainActivity.java) calls `window.fbConsumeBack()` first.
 * - If the function returns true, a dialog handled it -> native does nothing.
 * - If it returns false (or doesn't exist), the existing back logic runs.
 *
 * Web side: `Escape` keypress is also wired so the same close function
 * works in browsers (in addition to the X button).
 */

const stack = [];

function consumeBack() {
  if (stack.length === 0) return false;
  const fn = stack[stack.length - 1];
  try { fn(); } catch (e) { console.warn('fbConsumeBack handler failed', e); }
  return true;
}

if (typeof window !== 'undefined') {
  window.fbConsumeBack = consumeBack;
  // Also pop on Escape so the same UX works in the browser.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stack.length > 0) {
      consumeBack();
    }
  });
}

/**
 * Hook: register `onClose` on the back-stack while `active` is true.
 * Pops itself on unmount or when `active` flips to false.
 */
export function useBackHandler(active, onClose) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = () => onClose?.();
    stack.push(handler);
    return () => {
      const idx = stack.lastIndexOf(handler);
      if (idx >= 0) stack.splice(idx, 1);
    };
  }, [active, onClose]);
}
