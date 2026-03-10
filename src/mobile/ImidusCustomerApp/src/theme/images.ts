/**
 * IMIDUS Technologies – Image Asset Registry
 * All require() calls in one place so paths never get scattered.
 *
 * Usage:
 *   import { Images } from '@/theme';
 *   <Image source={Images.logoTriangle} style={{ width: 60, height: 60 }} />
 */

export const Images = {
  /** 1024×1024 — App icon source / page header mark */
  logoTriangle: require('../assets/images/logo_imidus_triangle.png'),

  /** 1024×336 — Primary banner: login header, splash logo, web hero */
  logoBlueBanner: require('../assets/images/imidus_logo_blue_gradient.png'),

  /** 1024×500 — Full wordmark (gold on dark): onboarding, about screen */
  logoWordmark: require('../assets/images/imidus_logo_pen_colored.png'),

  /** 512×512 — White bg icon: nav bar, light-themed UI components */
  logoWhite: require('../assets/images/imidus_logo_white.png'),

  /** 386×132 — Compact wordmark: collapsed nav, receipt footer */
  logoCompact: require('../assets/images/logo_imidus_alt.png'),

  /** 512×512 — App launcher icon source (Android adaptive / iOS AppIcon) */
  appIcon: require('../assets/images/app-icon-512.png'),

  /** 277×600 — Splash screen centre image (render over brand blue bg) */
  splashLogo: require('../assets/images/splash.png'),
} as const;
