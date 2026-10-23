/**
 * Universal Mobile & Desktop Body Scroll Lock Utility
 * 
 * Prevents background page scrolling, rubber-banding, and touch bleed-through
 * when any modal, drawer, or menu is open.
 * On mobile/touch: Uses position:fixed + scrollY to eliminate iOS Safari rubber-band scrolling.
 * On desktop: Uses overflow:hidden + scrollbar compensation padding so desktop layout does NOT jump or resize.
 */

let lockCount = 0;
let savedScrollY = 0;
let isLockedWithFixed = false;

export function lockBodyScroll(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (lockCount === 0) {
    savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Only apply fixed positioning on touch devices to avoid desktop layout reflow and scroll jumps
    if (isTouch) {
      isLockedWithFixed = true;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    } else {
      isLockedWithFixed = false;
    }

    document.body.classList.add('modal-open');
  }

  lockCount++;
}

export function unlockBodyScroll(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    const restoreY = savedScrollY;

    document.body.classList.remove('modal-open');
    document.body.style.paddingRight = '';
    
    if (isLockedWithFixed) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
    }

    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    if (isLockedWithFixed) {
      window.scrollTo({
        top: restoreY,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      });
    }
  }
}
