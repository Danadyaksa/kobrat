"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { usePageTransition } from "./PageTransition";

interface PreloaderProps {
  onShowSingleCard?: () => void;
  onBurst?: () => void;
  onComplete?: () => void;
}

const TARGET_WORD = "kobrat";
const SCRAMBLE_CHARS = "abcdefghijklmnopqrstuvwxyz";

export default function Preloader({
  onShowSingleCard,
  onBurst,
  onComplete,
}: PreloaderProps) {
  const { introSeen, setIntroSeen } = usePageTransition();
  const veilRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const wordmarkWrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cellsGroupRef = useRef<SVGGElement>(null);
  const textBaseRef = useRef<SVGTextElement>(null);
  const textFillRef = useRef<SVGTextElement>(null);

  const [isDone, setIsDone] = useState(introSeen);
  const onShowSingleCardRef = useRef(onShowSingleCard);
  const onBurstRef = useRef(onBurst);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onShowSingleCardRef.current = onShowSingleCard;
    onBurstRef.current = onBurst;
    onCompleteRef.current = onComplete;
  }, [onShowSingleCard, onBurst, onComplete]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (introSeen) {
      onShowSingleCardRef.current?.();
      onBurstRef.current?.();
      onCompleteRef.current?.();
      setIsDone(true);
      return;
    }

    const svg = svgRef.current;
    const textBase = textBaseRef.current;
    const textFill = textFillRef.current;
    const cellsGroup = cellsGroupRef.current;
    const counter = counterRef.current;
    const veil = veilRef.current;
    const front = frontRef.current;
    const wordmarkWrap = wordmarkWrapRef.current;

    if (
      !svg ||
      !textBase ||
      !textFill ||
      !cellsGroup ||
      !veil ||
      !front ||
      !wordmarkWrap
    )
      return;

    let cells: { x: number; y: number; size: number; order: number }[] = [];
    let renderedCount = 0;

    const setupMask = () => {
      try {
        const bbox = textBase.getBBox();
        const padY = Math.max(36, bbox.height * 0.6);
        const padX = Math.max(26, bbox.width * 0.2);

        const vx = bbox.x - padX;
        const vy = bbox.y - padY;
        const vw = bbox.width + 2 * padX;
        const vh = bbox.height + 2 * padY;

        svg.setAttribute("viewBox", `${vx} ${vy} ${vw} ${vh}`);

        const cellSize = Math.max(6, bbox.height / 10);
        const cols = Math.ceil(vw / cellSize);
        const rows = Math.ceil(vh / cellSize);

        cells = [];
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const x = vx + c * cellSize;
            const y = vy + r * cellSize;
            const hash =
              Math.sin(12.9898 * c + 78.233 * r) * 43758.5453;
            const rand = hash - Math.floor(hash);
            cells.push({
              x,
              y,
              size: cellSize,
              order: c + 3.5 * rand,
            });
          }
        }
        cells.sort((a, b) => a.order - b.order);
      } catch {
        svg.setAttribute("viewBox", "-30 -80 440 160");
      }
    };

    if (document.fonts) {
      document.fonts.ready.then(setupMask);
    } else {
      setupMask();
    }

    const ctx = gsap.context(() => {
      // Ensure initial state is clean with 0 transform
      gsap.set(wordmarkWrap, {
        x: 0,
        y: 0,
        scale: 1,
        transformOrigin: "50% 50%",
      });

      const progressObj = { value: 0 };
      const duration = 1.15;

      const tl = gsap.timeline({
        delay: 0.05,
      });

      // Update function for scramble, counter, and pixel mask
      const onProgressUpdate = () => {
        const val = Math.round(progressObj.value);

        if (counter) {
          counter.textContent = `${val}%`;
        }

        const totalChars = TARGET_WORD.length;
        const resolved = Math.floor((val / 100) * totalChars);

        let scrambled = "";
        for (let i = 0; i < totalChars; i++) {
          if (i < resolved || val >= 96) {
            scrambled += TARGET_WORD[i];
          } else {
            scrambled +=
              SCRAMBLE_CHARS[
                Math.floor(Math.random() * SCRAMBLE_CHARS.length)
              ];
          }
        }

        if (textBase) textBase.textContent = scrambled;
        if (textFill) textFill.textContent = scrambled;

        // Append pixel rects to mask
        if (cellsGroup && cells.length > 0) {
          const targetCount = Math.min(
            cells.length,
            Math.round((val / 100) * cells.length)
          );
          for (; renderedCount < targetCount; renderedCount++) {
            const item = cells[renderedCount];
            const rect = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "rect"
            );
            rect.setAttribute("x", String(item.x));
            rect.setAttribute("y", String(item.y));
            rect.setAttribute("width", String(item.size * 1.05));
            rect.setAttribute("height", String(item.size * 1.05));
            cellsGroup.appendChild(rect);
          }
        }
      };

      // 1. Progress animation (0 -> 100)
      tl.to(progressObj, {
        value: 100,
        duration: duration,
        ease: "power2.inOut",
        onUpdate: onProgressUpdate,
      });

      tl.call(() => {
        if (textBase) textBase.textContent = TARGET_WORD;
        if (textFill) textFill.textContent = TARGET_WORD;
        if (counter) counter.textContent = "100%";
      });

      // Dynamic measurement matching Elliot's site:
      // The wordmark glides UP directly to the header logo position:
      // target Y is 26px from top, origin is window.innerHeight / 2
      tl.to(
        wordmarkWrap,
        {
          y: () => -(window.innerHeight / 2 - 26),
          scale: 0.3158,
          duration: 0.85,
          ease: "expo.inOut",
        },
        "+=0.04"
      );

      // 2. Card 0 appears in the center of the black screen while wordmark glides up
      tl.call(
        () => {
          onShowSingleCardRef.current?.();
        },
        [],
        "-=0.45"
      );

      // Hold single card in center
      tl.to({}, { duration: 0.4 });

      // 3. Trigger burst!
      tl.addLabel("burst", "+=0.04");
      tl.call(
        () => {
          setIntroSeen(true);
          onBurstRef.current?.();
          onCompleteRef.current?.(); // Reveal header wordmark underneath seamlessly!
        },
        [],
        "burst"
      );

      // Turn wordmark text fill to dark (#0c0c0c) as background turns white
      tl.to(
        [textBase, textFill],
        {
          fill: "#0c0c0c",
          duration: 0.35,
          ease: "sine.inOut",
        },
        "burst"
      );

      // Veil fades to white and transparent
      tl.to(
        veil,
        {
          backgroundColor: "#ffffff",
          opacity: 0,
          duration: 0.55,
          ease: "power2.out",
        },
        "burst"
      );

      // Fade out front layer and unmount cleanly
      tl.to(
        front,
        {
          opacity: 0,
          duration: 0.35,
          ease: "power2.out",
          onComplete: () => {
            setIsDone(true);
          },
        },
        "burst+=0.1"
      );
    }, veil);

    return () => ctx.revert();
  }, [introSeen, setIntroSeen]);

  if (isDone || introSeen) return null;

  return (
    <>
      {/* Black curtain veil at z-[40] */}
      <div
        ref={veilRef}
        className="fixed inset-0 z-[40] bg-[#0c0c0c] pointer-events-none select-none will-change-transform"
      />

      {/* Front layer at z-[60] - sits above veil and Card 0 */}
      <div
        ref={frontRef}
        className="fixed inset-0 z-[60] text-white flex flex-col items-center justify-between pointer-events-none select-none will-change-transform"
      >
        {/* Top Bar: Loading counter + spinner on the right */}
        <div className="h-[52px] px-[3vw] flex items-center justify-end w-full pointer-events-none">
          <div className="flex items-center gap-2">
            <span
              ref={counterRef}
              className="font-mono text-[11px] tracking-[0.04em] tabular-nums text-white"
            >
              0%
            </span>
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rounded-full border border-white/20 border-t-white animate-spin"
            />
          </div>
        </div>

        {/* Wordmark: Perfectly centered via inset-0 + margin:auto, glides directly to header */}
        <div
          ref={wordmarkWrapRef}
          style={{
            position: "fixed",
            inset: 0,
            margin: "auto",
            width: "min(78vw, 420px)",
            height: "120px",
          }}
          className="flex items-center justify-center will-change-transform pointer-events-none"
        >
          <svg
            ref={svgRef}
            overflow="visible"
            className="w-full h-auto overflow-visible select-none will-change-transform"
          >
            <defs>
              <mask
                id="intro-name-mask"
                maskUnits="userSpaceOnUse"
                x="-10000"
                y="-10000"
                width="20000"
                height="20000"
              >
                <g
                  ref={cellsGroupRef}
                  fill="#fff"
                  shapeRendering="crispEdges"
                />
              </mask>
            </defs>

            {/* Base Dimmed Text */}
            <text
              ref={textBaseRef}
              x="50%"
              y="55%"
              textAnchor="middle"
              fill="#ffffff35"
              style={{
                fontFamily: "var(--font-wordmark)",
                fontSize: "76px",
                letterSpacing: "0px",
              }}
            >
              kobrat
            </text>

            {/* Solid White Revealed Text */}
            <text
              ref={textFillRef}
              x="50%"
              y="55%"
              textAnchor="middle"
              fill="#ffffff"
              mask="url(#intro-name-mask)"
              style={{
                fontFamily: "var(--font-wordmark)",
                fontSize: "76px",
                letterSpacing: "0px",
              }}
            >
              kobrat
            </text>
          </svg>
        </div>
      </div>
    </>
  );
}
