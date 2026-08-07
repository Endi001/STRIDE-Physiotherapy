import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "@tanstack/react-router";

gsap.registerPlugin(ScrollTrigger);
export function useLenis() {
  const router = useRouter();
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/admin")) return;
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;
    let lenisInstance: any;

    (async () => {
      const Lenis = (await import("lenis")).default;
      if (cancelled) return;

      const lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenisInstance = lenis;

      // Expose globally so modals can call stop/start
      (window as any).__lenis = lenis;

      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // Fix ScrollTrigger race conditions with custom fonts
      if (document.fonts) {
        document.fonts.ready.then(() => {
          ScrollTrigger.refresh();
        });
      }

      // Safeguard: refresh ScrollTrigger on body height changes (e.g. late image loads)
      const resizeObserver = new ResizeObserver(() => {
        ScrollTrigger.refresh();
      });
      resizeObserver.observe(document.body);

      // Reset scroll position on navigation
      const unsubscribe = router.subscribe('onResolved', () => {
        // Ensure Lenis scrolls instantly to top after navigation
        lenisInstance?.scrollTo(0, { immediate: true });
      });

      cleanup = () => {
        unsubscribe();
        resizeObserver.disconnect();
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
