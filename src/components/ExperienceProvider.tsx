"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import TransitionLink from "./TransitionLink";
import { soundEngine } from "@/utils/soundEngine";
import { Moment, moments as staticMoments } from "@/data/moments";

interface ExperienceContextValue {
  soundEnabled: boolean;
  toggleSound: () => void;
  darkroomMode: boolean;
  toggleDarkroom: () => void;
  openRoulette: () => void;
}

const ExperienceContext = createContext<ExperienceContextValue>({
  soundEnabled: false,
  toggleSound: () => {},
  darkroomMode: false,
  toggleDarkroom: () => {},
  openRoulette: () => {},
});

export function useExperience() {
  return useContext(ExperienceContext);
}

export default function ExperienceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [darkroomMode, setDarkroomMode] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [flashPulse, setFlashPulse] = useState<boolean>(false);

  // Roulette Easter Egg state
  const [rouletteOpen, setRouletteOpen] = useState<boolean>(false);
  const [momentsPool, setMomentsPool] = useState<Moment[]>(staticMoments);
  const [rouletteCurrent, setRouletteCurrent] = useState<Moment | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDragTargetRef = useRef<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setStatusToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setStatusToast(null);
    }, 2100);
  }, []);

  // Hydrate saved preferences on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isAdmin = window.location.pathname.startsWith("/admin");
    if (isAdmin) return;

    const savedSound = window.localStorage.getItem("kobrat_sound");
    if (savedSound === "on") {
      setSoundEnabled(true);
      soundEngine.setEnabled(true);
    }

    const savedDarkroom = window.localStorage.getItem("kobrat_darkroom");
    if (savedDarkroom === "on") {
      setDarkroomMode(true);
      document.documentElement.dataset.darkroom = "true";
    }
  }, []);

  // Keep fresh moments available for Memory Roulette
  useEffect(() => {
    let mounted = true;
    fetch("/api/moments", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setMomentsPool(data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEngine.setEnabled(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kobrat_sound", next ? "on" : "off");
      }
      if (next) {
        soundEngine.shutter();
        showToast("Tactile sound · on");
      } else {
        showToast("Tactile sound · muted");
      }
      return next;
    });
  }, [showToast]);

  const toggleDarkroom = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin")
    ) {
      return;
    }
    setDarkroomMode((prev) => {
      const next = !prev;
      if (typeof document !== "undefined") {
        if (next) {
          document.documentElement.dataset.darkroom = "true";
        } else {
          delete document.documentElement.dataset.darkroom;
        }
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kobrat_darkroom", next ? "on" : "off");
      }
      soundEngine.darkroomSwitch(next);
      setFlashPulse(true);
      setTimeout(() => setFlashPulse(false), 220);
      showToast(
        next ? "Darkroom · 35mm silver mode" : "Daylight · studio paper"
      );
      return next;
    });
  }, [showToast]);

  // Spin through random memories like a 35mm contact sheet roulette
  const spinRoulette = useCallback(
    (pool: Moment[]) => {
      if (pool.length === 0) return;
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);

      setIsSpinning(true);
      const totalSteps = 11;
      let step = 0;
      let lastPickedIdx = -1;

      const advance = () => {
        let idx = Math.floor(Math.random() * pool.length);
        if (pool.length > 1 && idx === lastPickedIdx) {
          idx = (idx + 1) % pool.length;
        }
        lastPickedIdx = idx;
        setRouletteCurrent(pool[idx]);

        step += 1;
        if (step < totalSteps) {
          soundEngine.tick(0.88 + step * 0.04);
          const delay = 36 + step * step * 3.4;
          spinTimerRef.current = setTimeout(advance, delay);
        } else {
          soundEngine.shutter();
          setIsSpinning(false);
        }
      };

      advance();
    },
    []
  );

  const openRoulette = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin")
    ) {
      return;
    }
    setRouletteOpen(true);
    spinRoulette(momentsPool);
  }, [momentsPool, spinRoulette]);

  // Global tactile audio delegation & keyboard Easter eggs ('D' = Darkroom, 'R' = Roulette)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastHoveredInteractive: Element | null = null;

    const onPointerOver = (e: PointerEvent) => {
      if (window.location.pathname.startsWith("/admin")) return;
      const target = e.target as Element | null;
      if (!target) return;

      const interactive = target.closest(
        '[data-cursor], .nav-item, a[href], button:not([disabled])'
      );
      if (interactive && interactive !== lastHoveredInteractive) {
        lastHoveredInteractive = interactive;
        const hasCardCursor = interactive.hasAttribute("data-cursor");
        soundEngine.tick(hasCardCursor ? 0.92 : 1.12);
      } else if (!interactive) {
        lastHoveredInteractive = null;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (window.location.pathname.startsWith("/admin")) return;
      soundEngine.primeAudio();
      const target = e.target as Element | null;
      if (!target) return;

      const draggable = target.closest(
        '[data-cursor="DRAG"], [data-cursor="GRAB"], [data-lanyard-card="true"]'
      );
      if (draggable) {
        activeDragTargetRef.current = true;
        soundEngine.cordGrab();
        return;
      }

      const inspectTrigger = target.closest(
        '[data-cursor="VIEW"], [data-cursor="INSPECT"]'
      );
      if (inspectTrigger) {
        soundEngine.shutter();
      }
    };

    const onPointerUp = () => {
      if (activeDragTargetRef.current) {
        activeDragTargetRef.current = false;
        soundEngine.cordSnap();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (window.location.pathname.startsWith("/admin")) return;
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        (document.activeElement as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "d" || e.key === "D") {
        toggleDarkroom();
      } else if (e.key === "r" || e.key === "R") {
        if (rouletteOpen) {
          spinRoulette(momentsPool);
        } else {
          openRoulette();
        }
      } else if (e.key === "Escape" && rouletteOpen) {
        setRouletteOpen(false);
      }
    };

    window.addEventListener("pointerover", onPointerOver, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [momentsPool, openRoulette, rouletteOpen, spinRoulette, toggleDarkroom]);

  return (
    <ExperienceContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        darkroomMode,
        toggleDarkroom,
        openRoulette,
      }}
    >
      {children}

      {/* Optical 35mm Darkroom Veil (converts white studio paper -> #0a0a0c obsidian) */}
      {darkroomMode && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[9990] bg-[#f5f5f7] mix-blend-difference"
        />
      )}

      {/* Brief 35mm Curtain Flash when Toggling Darkroom Mode */}
      <AnimatePresence>
        {flashPulse && (
          <motion.div
            initial={{ opacity: 0.32 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-[9995] bg-white mix-blend-difference"
          />
        )}
      </AnimatePresence>

      {/* Minimal Floating Status Pill (Sound / Darkroom Feedback) */}
      <AnimatePresence>
        {statusToast && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-[9996] px-4 py-2 rounded-full bg-[#0c0c0c] text-white text-[12px] font-medium tracking-[0.02em] select-none"
          >
            {statusToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Memory Roulette Modal (Random Collective Frame Easter Egg) ─── */}
      <AnimatePresence>
        {rouletteOpen && rouletteCurrent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setRouletteOpen(false)}
            data-darkroom-keep="true"
            className="fixed inset-0 z-[9997] bg-[#09090b]/92 flex items-center justify-center p-4 sm:p-8 select-none text-white"
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[680px] bg-[#141417] p-5 sm:p-6 rounded-[16px] flex flex-col gap-4"
            >
              <div className="flex items-center justify-between text-[12px] text-white/60 font-medium">
                <span>
                  {isSpinning ? "Rolling archive..." : "Memory roulette"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => spinRoulette(momentsPool)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white hover:text-[#0c0c0c] transition-colors text-[11px] text-white cursor-pointer active:scale-[0.97]"
                  >
                    Roll again (R)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouletteOpen(false)}
                    className="px-3 py-1.5 bg-white text-[#0c0c0c] hover:bg-white/85 transition-colors text-[11px] font-medium cursor-pointer active:scale-[0.97]"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="relative w-full aspect-[16/10] bg-[#09090b] rounded-[10px] overflow-hidden">
                <Image
                  key={rouletteCurrent.id}
                  src={rouletteCurrent.image}
                  alt={rouletteCurrent.title}
                  fill
                  sizes="(max-width: 768px) 92vw, 680px"
                  className={`object-cover object-[center_58%] transition-transform duration-300 ${
                    isSpinning ? "scale-[1.04] opacity-85" : "scale-100 opacity-100"
                  }`}
                  priority
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
                <div className="space-y-1">
                  <h3
                    style={{ fontFamily: "var(--font-wordmark)" }}
                    className="text-[clamp(26px,3.4vw,40px)] lowercase text-white leading-[1.16]"
                  >
                    {rouletteCurrent.title}
                  </h3>
                  <p className="text-[13px] text-white/75 max-w-[48ch]">
                    {rouletteCurrent.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {rouletteCurrent.members.map((mSlug) => (
                    <TransitionLink
                      key={mSlug}
                      href={`/${mSlug}`}
                      onClick={() => setRouletteOpen(false)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white hover:text-[#0c0c0c] transition-colors text-[11px] capitalize text-white"
                    >
                      {mSlug}
                    </TransitionLink>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ExperienceContext.Provider>
  );
}
