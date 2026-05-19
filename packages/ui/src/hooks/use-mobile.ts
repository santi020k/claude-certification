import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const getIsMobileSnapshot = () => window.innerWidth < MOBILE_BREAKPOINT
const getServerIsMobileSnapshot = () => false

const subscribeToViewport = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
  )

  mediaQuery.addEventListener('change', onStoreChange)

  return () => {
    mediaQuery.removeEventListener('change', onStoreChange)
  }
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToViewport, getIsMobileSnapshot, getServerIsMobileSnapshot
  )
}
