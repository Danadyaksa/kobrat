"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

let globalLenis: Lenis | null = null;

export function getLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  return globalLenis || (window as unknown as { __lenis?: Lenis }).__lenis || null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      autoResize: true,
    });

    globalLenis = lenis;
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // Official GSAP ScrollTrigger + Lenis synchronization so scroll never gets stuck
    lenis.on("scroll", ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      globalLenis = null;
      if (typeof window !== "undefined") {
        delete (window as unknown as { __lenis?: Lenis }).__lenis;
      }
    };
  }, []);

  // Recalculate scroll bounds & ScrollTrigger positions on route changes
  useEffect(() => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
      lenis.resize();
    }
    const timer = setTimeout(() => {
      getLenis()?.resize();
      ScrollTrigger.refresh();
    }, 180);

    return () => clearTimeout(timer);
  }, [pathname]);

  return <>{children}</>;
}
