import { useEffect } from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';

/**
 * React hook to lock background scrolling while a modal or menu is open.
 * Automatically cleans up and restores scroll position when component unmounts
 * or when `isLocked` becomes false.
 */
export function useBodyScrollLock(isLocked: boolean = true): void {
  useEffect(() => {
    if (!isLocked) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
