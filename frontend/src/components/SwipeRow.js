import React, { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

/**
 * SwipeRow
 * --------
 * Mobile-style swipe-to-delete wrapper for a list item.
 *
 * - Drag the row left → reveals a Delete button underneath.
 * - Past the threshold → the row "locks" open at -REVEAL px; tap Delete to remove.
 * - Tap anywhere else → snaps back closed.
 * - Vertical scrolls bypass the swipe (no drift).
 *
 * Usage:
 *   <SwipeRow onDelete={() => removeItem('todos', t.id)}>
 *     <button onClick={...}>...row content...</button>
 *   </SwipeRow>
 */
const REVEAL_PX = 92;        // width of the revealed delete button
const TRIGGER_PX = 60;       // drag past this → snap open
const ANGLE_THRESHOLD = 1.4; // |dx| / |dy| must exceed this to qualify as horizontal

export default function SwipeRow({ children, onDelete, testId }) {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);
  const horizontal = useRef(false);
  const wrapperRef = useRef(null);

  // Close on outside tap
  useEffect(() => {
    if (!open) return undefined;
    const onDocPointerDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setOffset(0);
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [open]);

  const onTouchStart = (e) => {
    const t = e.touches ? e.touches[0] : e;
    startX.current = t.clientX;
    startY.current = t.clientY;
    dragging.current = true;
    horizontal.current = false;
  };

  const onTouchMove = (e) => {
    if (!dragging.current) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    const baseOffset = open ? -REVEAL_PX : 0;

    if (!horizontal.current) {
      // Decide direction within first ~10px of movement.
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) / (Math.abs(dy) + 0.0001) < ANGLE_THRESHOLD) {
        // Vertical scroll → cancel swipe handling.
        dragging.current = false;
        return;
      }
      horizontal.current = true;
      try { e.preventDefault?.(); }
      catch (err) {
        // Some passive listeners reject preventDefault; we can ignore it
        // because vertical scroll is not the active gesture here.
        console.warn('SwipeRow: preventDefault failed', err);
      }
    }

    const next = Math.max(-REVEAL_PX, Math.min(0, baseOffset + dx));
    setOffset(next);
  };

  const onTouchEnd = () => {
    if (!dragging.current) {
      // Drag was cancelled (e.g. vertical scroll) → reset position.
      if (!open) setOffset(0);
      return;
    }
    dragging.current = false;
    if (!horizontal.current) {
      // Pure tap; nothing to do — leave current state intact.
      return;
    }
    const baseOffset = open ? -REVEAL_PX : 0;
    const final = baseOffset + (offset - baseOffset);
    if (final <= -TRIGGER_PX) {
      setOpen(true);
      setOffset(-REVEAL_PX);
    } else {
      setOpen(false);
      setOffset(0);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(false);
    setOffset(0);
    onDelete?.();
  };

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden bg-white"
      data-testid={testId}
    >
      {/* Underlay action */}
      <button
        type="button"
        onClick={handleDelete}
        aria-label="Delete"
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-rose-600 text-white px-4 active:bg-rose-700"
        style={{ width: REVEAL_PX }}
        data-testid={testId ? `${testId}-delete` : undefined}
      >
        <span className="flex flex-col items-center gap-0.5 text-[11px] font-semibold tracking-wide">
          <Trash2 size={18} />
          <span>Delete</span>
        </span>
      </button>

      {/* Foreground content */}
      <div
        className="relative bg-white"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? 'none' : 'transform 180ms ease',
          touchAction: 'pan-y',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        // Capture-phase click: if the row is open, eat the click so the
        // user's tap closes it instead of triggering the row's onClick.
        onClickCapture={(e) => {
          if (open) {
            e.stopPropagation();
            e.preventDefault();
            setOpen(false);
            setOffset(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
