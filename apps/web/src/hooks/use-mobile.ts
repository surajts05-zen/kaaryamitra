import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // Tailwind's md breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // Initial check (useful if running in SSR environment, though this is a SPA)
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Add event listener
    mql.addEventListener('change', onChange);
    
    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => {
      mql.removeEventListener('change', onChange);
    };
  }, []);

  return isMobile;
}
