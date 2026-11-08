import React, { useEffect, useRef } from 'react';
import { AD_CLIENT, AD_SLOTS, adsEnabled, type AdSlotName } from '../lib/ads';

interface AdSlotProps {
  id: AdSlotName;
  /** Height reserved for the ad, in pixels. Keeps the layout still when the ad loads. */
  minHeight: number;
}

/**
 * A labelled ad area with fixed space. Shows an AdSense unit only when the publisher
 * and slot IDs are configured (see lib/ads.ts). Never placed over controls or outputs.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ id, minHeight }) => {
  const enabled = adsEnabled(id);
  const requested = useRef(false);

  useEffect(() => {
    if (!enabled || requested.current) return;
    requested.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle ?? []).push({});
    } catch {
      // Ad blockers or a script that has not loaded yet: the space stays empty.
    }
  }, [enabled]);

  return (
    <aside
      aria-label="Advertisement"
      data-ad-slot={id}
      className="w-full my-6"
      style={{ minHeight }}
    >
      {enabled && (
        <ins
          className="adsbygoogle block"
          style={{ display: 'block' }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={AD_SLOTS[id]}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </aside>
  );
};

export default AdSlot;
