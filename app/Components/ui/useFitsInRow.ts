'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

/** Width of an element's content box (its width minus horizontal padding). */
function contentWidth(el: HTMLElement) {
  const style = getComputedStyle(el);
  return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
}

/**
 * Whether `content` (rendered at its natural width, e.g. `w-max`) fits inside `space`.
 * Stays `null` until the first measurement, so neither the links nor the menu button
 * flash before the browser has laid the row out.
 */
export function useFitsInRow(
  content: RefObject<HTMLElement | null>,
  space: RefObject<HTMLElement | null>,
): boolean | null {
  const [fits, setFits] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    const contentEl = content.current;
    const spaceEl = space.current;
    if (!contentEl || !spaceEl) return;

    const measure = () => {
      setFits(contentEl.scrollWidth <= Math.floor(contentWidth(spaceEl)));
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(contentEl);
    observer.observe(spaceEl);
    // Web fonts can change the link widths after first paint.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [content, space]);

  return fits;
}
