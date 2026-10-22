/**
 * Universal Mobile & Desktop Body Scroll Lock Utility
 * 
 * Prevents background page scrolling, rubber-banding, and touch bleed-through
 * when any modal, drawer, or menu is open.
 * Uses the industry standard position:fixed + scrollY technique to guarantee
 * iOS Safari and Android Chrome compatibility without page jumping.
 */

let lockCount = 0;
let savedScrollY = 0;

export function lockBodyScroll(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (lockCount === 0) {
    savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    // Apply strict scroll locking
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.classList.add('modal-open');
  }

  lockCount++;
}

export function unlockBodyScroll(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    const restoreY = savedScrollY;

    // Clear styles
    document.body.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    // Restore scroll position
    window.scrollTo({
      top: restoreY,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
  }
}
