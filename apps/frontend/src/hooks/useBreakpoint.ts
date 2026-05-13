import { useState, useEffect } from 'react'

const MQL_MOBILE = '(max-width: 768px)'
const MQL_TABLET = '(min-width: 769px) and (max-width: 1024px)'

export function useBreakpoint() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MQL_MOBILE).matches)
  const [isTablet, setIsTablet] = useState(() => window.matchMedia(MQL_TABLET).matches)

  useEffect(() => {
    const mMobile = window.matchMedia(MQL_MOBILE)
    const mTablet = window.matchMedia(MQL_TABLET)
    const hm = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    const ht = (e: MediaQueryListEvent) => setIsTablet(e.matches)
    mMobile.addEventListener('change', hm)
    mTablet.addEventListener('change', ht)
    return () => { mMobile.removeEventListener('change', hm); mTablet.removeEventListener('change', ht) }
  }, [])

  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet }
}
