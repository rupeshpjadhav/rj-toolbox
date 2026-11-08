/// <reference types="vite/client" />
// AdSense settings, read at build time. Set them in the build environment, for example
// in a .env.production file or the GitHub Actions build step:
//   VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
//   VITE_ADSENSE_SLOT_TOP=1234567890
//   VITE_ADSENSE_SLOT_BOTTOM=0987654321
// Publisher and ad unit IDs are public values, not secrets. While they are empty,
// no ad code loads and the ad slots only reserve their space.

export const AD_CLIENT: string = import.meta.env.VITE_ADSENSE_CLIENT ?? '';

export const AD_SLOTS = {
  top: (import.meta.env.VITE_ADSENSE_SLOT_TOP ?? '') as string,
  bottom: (import.meta.env.VITE_ADSENSE_SLOT_BOTTOM ?? '') as string,
};

export type AdSlotName = keyof typeof AD_SLOTS;

export const adsEnabled = (slot: AdSlotName): boolean => Boolean(AD_CLIENT && AD_SLOTS[slot]);

let scriptRequested = false;

/** Loads the AdSense script once, and only when a publisher ID is configured. */
export const loadAdSense = (): void => {
  if (!AD_CLIENT || scriptRequested || typeof document === 'undefined') return;
  scriptRequested = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(AD_CLIENT)}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
};
