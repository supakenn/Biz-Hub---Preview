import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Dynamically swaps the <link rel="manifest"> based on the current route.
 * This enables scoped PWA installs — each module can be "Add to Home Screen"
 * as its own standalone app with the correct start_url and scope.
 *
 * Manifest map:
 *   /pos*        → /manifest-pos.json   (Biz POS, scope: /pos)
 *   /inventory*  → /manifest-ims.json   (Biz IMS, scope: /inventory)
 *   /*           → /manifest.json       (Biz Hub, scope: /)
 */
export function useManifest() {
  const { pathname } = useLocation();

  useEffect(() => {
    let manifestHref = '/manifest.json';

    if (pathname.startsWith('/pos')) {
      manifestHref = '/manifest-pos.json';
    } else if (pathname.startsWith('/inventory')) {
      manifestHref = '/manifest-ims.json';
    }

    // Find or create the <link rel="manifest"> element
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }

    if (link.href !== new URL(manifestHref, window.location.origin).href) {
      link.href = manifestHref;
    }
  }, [pathname]);
}
