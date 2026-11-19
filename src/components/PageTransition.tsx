"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  Suspense,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";

interface PageTransitionContextType {
  navigateTo: (href: string) => void;
  isTransitioning: boolean;
  introSeen: boolean;
  setIntroSeen: (seen: boolean) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  navigateTo: () => {},
  isTransitioning: false,
  introSeen: false,
  setIntroSeen: () => {},
});

export const usePageTransition = () => useContext(PageTransitionContext);

function PathnameWatcher({
  onPathnameChange,
}: {
  onPathnameChange: (path: string) => void;
}) {
  const pathname = usePathname();
  useEffect(() => {
    onPathnameChange(pathname);
  }, [pathname, onPathnameChange]);
  return null;
}

export default function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentPathnameRef = useRef<string>("");
  const curtainRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [introSeen, setIntroSeen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isNavigatingRef = useRef(false);
  const targetHrefRef = useRef<string | null>(null);

  // Initialize curtain safely off-screen using GSAP (never React JSX inline style)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      setIsAdmin(true);
    }
    if (curtainRef.current) {
      gsap.set(curtainRef.current, { yPercent: 100 });
    }
  }, []);

  // Reveal new page once pathname changes
  const handlePathnameChange = useCallback((newPath: string) => {
    currentPathnameRef.current = newPath;
    const onAdmin = newPath.startsWith("/admin");
    setIsAdmin(onAdmin);

    if (!isNavigatingRef.current) return;

    const curtain = curtainRef.current;
    if (!curtain || onAdmin) {
      isNavigatingRef.current = false;
      setIsTransitioning(false);
      return;
    }

    // New page is now mounted behind the curtain.
    // Wait a brief 140ms beat so fonts/images settle, then wipe UP to reveal!
    const timer = setTimeout(() => {
      gsap.to(curtain, {
        yPercent: -100,
        duration: 0.52,
        ease: "power3.inOut",
        onComplete: () => {
          gsap.set(curtain, { yPercent: 100 });
          isNavigatingRef.current = false;
          setIsTransitioning(false);
          targetHrefRef.current = null;
        },
      });
    }, 140);

    return () => clearTimeout(timer);
  }, []);

  // Smooth curtain transition to target page matching Elliot Eriksson
  const navigateTo = useCallback(
    (href: string) => {
      if (isNavigatingRef.current) return;
      if (typeof window !== "undefined" && href === window.location.pathname) return;

      // When on admin or navigating to admin, perform an immediate router push with no black curtain
      if (
        isAdmin ||
        href.startsWith("/admin") ||
        (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"))
      ) {
        router.push(href);
        return;
      }

      isNavigatingRef.current = true;
      targetHrefRef.current = href;
      setIsTransitioning(true);

      const curtain = curtainRef.current;
      if (!curtain) {
        router.push(href);
        return;
      }

      // 1. Wipe UP from bottom to cover the CURRENT page completely
      gsap.killTweensOf(curtain);
      gsap.fromTo(
        curtain,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 0.48,
          ease: "power3.inOut",
          onComplete: () => {
            // Screen is now 100% covered by solid black curtain.
            // ONLY NOW do we push the route so the user NEVER sees premature page swapping!
            router.push(href);
          },
        }
      );
    },
    [router, isAdmin]
  );

  // Global click interception backup for standard anchors
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
        return;
      }

      // Do not intercept links when inside /admin
      if (
        isAdmin ||
        (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"))
      ) {
        return;
      }

      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !href.startsWith("//") &&
        !href.startsWith("/api") &&
        !href.startsWith("/uploads")
      ) {
        const pathOnly = href.split("#")[0];
        const currentPath = window.location.pathname;

        if (pathOnly && pathOnly !== currentPath) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          navigateTo(href);
        }
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, {
        capture: true,
      });
    };
  }, [navigateTo, isAdmin]);

  return (
    <PageTransitionContext.Provider
      value={{ navigateTo, isTransitioning, introSeen, setIntroSeen }}
    >
      <Suspense fallback={null}>
        <PathnameWatcher onPathnameChange={handlePathnameChange} />
      </Suspense>

      {children}

      {/* Fullscreen Curtain Transition - Completely omitted on /admin for instant, zero-flash editing */}
      {!isAdmin && (
        <div
          ref={curtainRef}
          aria-hidden="true"
          className={`fixed inset-0 z-[99990] bg-[#0c0c0c] text-white will-change-transform select-none ${
            isTransitioning ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          {/* Subtle Top-Center Spinner Ring (Exact to frame_020) */}
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="w-3.5 h-3.5 rounded-full border border-white/20 border-t-white animate-spin block" />
          </div>

          {/* Vertically Centered Metadata Row (Exact to frame_020) */}
          <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 px-[3vw] grid grid-cols-[1fr_auto_1fr] items-center gap-6 w-full pointer-events-none">
            {/* Left: Kobrat Wordmark in white Gossip font */}
            <div
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[26px] sm:text-[30px] text-white lowercase leading-none justify-self-start"
            >
              kobrat
            </div>

            {/* Center: Mission tagline */}
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-white/70 justify-self-center hidden sm:block">
              8 MINDS // ONE WAVELENGTH
            </div>

            {/* Right: Collective badge */}
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-white/70 justify-self-end">
              EST. 2024
            </div>
          </div>
        </div>
      )}
    </PageTransitionContext.Provider>
  );
}
