export const SYNTHESIS_NAVIGATION_START = "synthesis:navigation-start";
export const SYNTHESIS_ROUTE_READY = "synthesis:route-ready";

export type SynthesisTransitionCover = {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  objectPosition: string;
  objectFit: string;
  backgroundColor: string;
};

export type SynthesisNavigationDetail = {
  href: string;
  pathname: string;
  label: string;
  reducedMotion: boolean;
  origin?: {
    x: number;
    y: number;
  };
  cover?: SynthesisTransitionCover;
};

export type SynthesisRouteReadyDetail = {
  pathname: string;
  degraded?: boolean;
};

export function announceSynthesisRouteReady(pathname: string, degraded = false) {
  document.documentElement.dataset.routeReadyPath = pathname;
  window.dispatchEvent(new CustomEvent<SynthesisRouteReadyDetail>(SYNTHESIS_ROUTE_READY, {
    detail: { pathname, degraded },
  }));
}
