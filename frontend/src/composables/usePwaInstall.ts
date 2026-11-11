import { computed, ref } from 'vue'

/** Chromium-only event that lets the page show the native "Install app" dialog. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const installEvent = ref<BeforeInstallPromptEvent | null>(null)
const installed = ref(false)

function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

// iPadOS reports itself as a Mac, so touch support is used to tell them apart.
const isIos =
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)

/** Call once at startup: registers the service worker and listens for install events. */
export function setupPwa(): void {
  installed.value = isStandalone()

  window.addEventListener('beforeinstallprompt', (event) => {
    installEvent.value = event as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    installed.value = true
    installEvent.value = null
  })

  // Dev server stays without a service worker so hot reload is never served from cache.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('Service worker registration failed:', error)
      })
    })
  }
}

export function usePwaInstall() {
  /** Android / desktop Chrome, Edge: the native install dialog is available. */
  const canPrompt = computed(() => !installed.value && installEvent.value !== null)
  /** iPhone / iPad: no install API, the user adds the site via the Share menu. */
  const needsIosHint = computed(() => !installed.value && isIos)

  async function install(): Promise<void> {
    const event = installEvent.value
    if (!event) return
    installEvent.value = null
    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === 'accepted') installed.value = true
  }

  return { canPrompt, needsIosHint, install }
}
