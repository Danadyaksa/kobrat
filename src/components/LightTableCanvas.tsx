"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Moment } from "@/data/moments";
import { soundEngine } from "@/utils/soundEngine";

interface CardPose {
  id: number;
  x: number;
  y: number;
  rot: number;
  vx: number;
  vy: number;
  vr: number;
  z: number;
}

interface LightTableCanvasProps {
  moments: Moment[];
  onInspect: (index: number) => void;
}

export default function LightTableCanvas({
  moments,
  onInspect,
}: LightTableCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const posesRef = useRef<CardPose[]>([]);
  const topZRef = useRef<number>(20);
  const [layoutSeed, setLayoutSeed] = useState<number>(0);

  const dragRef = useRef<{
    id: number | null;
    pointerId: number;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    movedDist: number;
  }>({
    id: null,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    movedDist: 0,
  });

  const applyDomPose = useCallback((pose: CardPose, isGrabbed = false) => {
    const el = cardRefs.current.get(pose.id);
    if (!el) return;
    const scale = isGrabbed ? 1.05 : 1;
    el.style.zIndex = String(pose.z);
    el.style.transform = `translate3d(${pose.x.toFixed(1)}px, ${pose.y.toFixed(
      1
    )}px, 0) rotate(${pose.rot.toFixed(2)}deg) scale(${scale})`;
  }, []);

  // Scatter cards organically across the light table
  const scatterCards = useCallback(
    (mode: "scatter" | "tidy" = "scatter") => {
      const stage = stageRef.current;
      const stageW = stage ? stage.clientWidth : 1100;
      const stageH = stage ? stage.clientHeight : 680;
      const cardW = stageW < 640 ? 220 : 288;
      const cardH = stageW < 640 ? 190 : 236;

      const usableW = Math.max(80, stageW - cardW - 56);
      const usableH = Math.max(80, stageH - cardH - 96);

      const cols = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(moments.length))));
      const rows = Math.max(1, Math.ceil(moments.length / cols));

      const nextPoses: CardPose[] = moments.map((m, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        if (mode === "tidy") {
          const cellW = usableW / Math.max(1, cols - 1 || 1);
          const cellH = usableH / Math.max(1, rows - 1 || 1);
          const x = cols === 1 ? stageW / 2 - cardW / 2 : 28 + col * cellW;
          const y = rows === 1 ? 84 + usableH / 2 : 76 + row * cellH;
          return {
            id: m.id,
            x,
            y,
            rot: (i % 2 === 0 ? -1.4 : 1.4),
            vx: 0,
            vy: 0,
            vr: 0,
            z: i + 1,
          };
        }

        // Organic cluster with deterministic-feeling studio scatter
        const baseX =
          cols > 1
            ? 28 + (col / (cols - 1)) * usableW
            : stageW / 2 - cardW / 2;
        const baseY =
          rows > 1 ? 78 + (row / (rows - 1)) * usableH : 120 + usableH * 0.35;

        const jitterX = (Math.random() - 0.5) * Math.min(130, usableW * 0.28);
        const jitterY = (Math.random() - 0.5) * Math.min(95, usableH * 0.28);
        const x = Math.max(20, Math.min(stageW - cardW - 20, baseX + jitterX));
        const y = Math.max(68, Math.min(stageH - cardH - 20, baseY + jitterY));
        const rot = (Math.random() - 0.5) * 17;

        return {
          id: m.id,
          x,
          y,
          rot,
          vx: 0,
          vy: 0,
          vr: 0,
          z: i + 1,
        };
      });

      topZRef.current = moments.length + 5;
      posesRef.current = nextPoses;
      setLayoutSeed((s) => s + 1);

      requestAnimationFrame(() => {
        nextPoses.forEach((p) => applyDomPose(p, false));
      });
    },
    [applyDomPose, moments]
  );

  useEffect(() => {
    scatterCards("scatter");
  }, [scatterCards]);

  // Inertia & soft table-edge rebound loop
  useEffect(() => {
    let rafId: number;

    const stepPhysics = () => {
      const stage = stageRef.current;
      if (stage) {
        const stageW = stage.clientWidth;
        const stageH = stage.clientHeight;
        const cardW = stageW < 640 ? 220 : 288;
        const cardH = stageW < 640 ? 190 : 236;
        const minX = 12;
        const maxX = Math.max(minX, stageW - cardW - 12);
        const minY = 60;
        const maxY = Math.max(minY, stageH - cardH - 12);

        for (const p of posesRef.current) {
          if (dragRef.current.id === p.id) continue;
          if (
            Math.abs(p.vx) > 0.08 ||
            Math.abs(p.vy) > 0.08 ||
            Math.abs(p.vr) > 0.02
          ) {
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;

            if (p.x < minX) {
              p.x = minX;
              p.vx *= -0.52;
            } else if (p.x > maxX) {
              p.x = maxX;
              p.vx *= -0.52;
            }

            if (p.y < minY) {
              p.y = minY;
              p.vy *= -0.52;
            } else if (p.y > maxY) {
              p.y = maxY;
              p.vy *= -0.52;
            }

            p.vx *= 0.91;
            p.vy *= 0.91;
            p.vr *= 0.88;
            applyDomPose(p, false);
          }
        }
      }
      rafId = requestAnimationFrame(stepPhysics);
    };

    rafId = requestAnimationFrame(stepPhysics);
    return () => cancelAnimationFrame(rafId);
  }, [applyDomPose, layoutSeed]);

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    id: number
  ) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;

    const stage = stageRef.current;
    const pose = posesRef.current.find((p) => p.id === id);
    if (!stage || !pose) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const stageRect = stage.getBoundingClientRect();
    const localX = e.clientX - stageRect.left;
    const localY = e.clientY - stageRect.top;

    topZRef.current += 1;
    pose.z = topZRef.current;
    pose.vx = 0;
    pose.vy = 0;
    pose.vr = 0;

    dragRef.current = {
      id,
      pointerId: e.pointerId,
      offsetX: localX - pose.x,
      offsetY: localY - pose.y,
      lastX: localX,
      lastY: localY,
      lastTime: performance.now(),
      movedDist: 0,
    };

    applyDomPose(pose, true);
  };

  const handlePointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    id: number
  ) => {
    const dr = dragRef.current;
    if (dr.id !== id) return;
    const stage = stageRef.current;
    const pose = posesRef.current.find((p) => p.id === id);
    if (!stage || !pose) return;

    const stageRect = stage.getBoundingClientRect();
    const localX = e.clientX - stageRect.left;
    const localY = e.clientY - stageRect.top;
    const now = performance.now();
    const dt = Math.max(8, now - dr.lastTime);

    const dx = localX - dr.lastX;
    const dy = localY - dr.lastY;
    dr.movedDist += Math.hypot(dx, dy);

    pose.x = localX - dr.offsetX;
    pose.y = localY - dr.offsetY;

    // Velocity normalized to ~16ms frame for throw inertia
    pose.vx = (dx / dt) * 15;
    pose.vy = (dy / dt) * 15;
    pose.vr = Math.max(-3.5, Math.min(3.5, dx * 0.08));
    pose.rot += dx * 0.035;

    dr.lastX = localX;
    dr.lastY = localY;
    dr.lastTime = now;

    applyDomPose(pose, true);
  };

  const handlePointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
    id: number
  ) => {
    const dr = dragRef.current;
    if (dr.id !== id) return;
    if (e.currentTarget.hasPointerCapture(dr.pointerId)) {
      e.currentTarget.releasePointerCapture(dr.pointerId);
    }
    const pose = posesRef.current.find((p) => p.id === id);
    dr.id = null;
    if (pose) {
      // Clamp throw speed so prints glide smoothly across the table
      pose.vx = Math.max(-26, Math.min(26, pose.vx));
      pose.vy = Math.max(-26, Math.min(26, pose.vy));
      applyDomPose(pose, false);
    }
  };

  const formatShortLoc = (loc: string, year: string) => {
    const clean = loc.split("//")[0].trim();
    return `${clean} · ${year}`;
  };

  return (
    <div
      ref={stageRef}
      className="light-table-surface relative w-full h-[780px] sm:h-[880px] rounded-[16px] bg-[#eef0f4] overflow-hidden select-none"
    >
      {/* Top Light-Table Controls Bar */}
      <div className="relative z-[900] flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white/95">
        <span className="text-[13px] text-[#52525b]">
          Studio light table · Drag & toss prints · Double-click to inspect
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.shutter();
              scatterCards("scatter");
            }}
            className="px-3 py-1.5 bg-[#0c0c0c] text-white text-[12px] hover:opacity-80 transition-opacity cursor-pointer active:scale-[0.97]"
          >
            Shuffle pile
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.tick(1.2);
              scatterCards("tidy");
            }}
            className="px-3 py-1.5 bg-white text-[#0c0c0c] hover:bg-[#e4e6eb] transition-colors text-[12px] cursor-pointer active:scale-[0.97]"
          >
            Tidy grid
          </button>
        </div>
      </div>

      {/* Scattered Polaroid / 35mm Contact Prints */}
      {moments.map((moment, idx) => (
        <div
          key={moment.id}
          ref={(node) => {
            if (node) {
              cardRefs.current.set(moment.id, node);
            } else {
              cardRefs.current.delete(moment.id);
            }
          }}
          onPointerDown={(e) => handlePointerDown(e, moment.id)}
          onPointerMove={(e) => handlePointerMove(e, moment.id)}
          onPointerUp={(e) => handlePointerUp(e, moment.id)}
          onPointerCancel={(e) => handlePointerUp(e, moment.id)}
          onDoubleClick={() => {
            soundEngine.shutter();
            onInspect(idx);
          }}
          data-cursor="GRAB"
          className="polaroid-print absolute top-0 left-0 w-[220px] sm:w-[288px] bg-white p-2.5 sm:p-3 pb-3.5 rounded-[6px] touch-none cursor-grab active:cursor-grabbing will-change-transform transition-[background-color] duration-200"
        >
          <div className="relative w-full aspect-[16/10] bg-[#111] overflow-hidden mb-2.5 pointer-events-none">
            <Image
              src={moment.image}
              alt={moment.title}
              fill
              sizes="290px"
              draggable={false}
              className="object-cover object-[center_58%] select-none"
            />
          </div>

          <div className="flex items-baseline justify-between gap-2 px-0.5">
            <div className="min-w-0">
              <p
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="polaroid-title text-[20px] sm:text-[23px] lowercase text-[#0c0c0c] leading-[1.28] py-0.5 truncate"
              >
                {moment.title}
              </p>
              <p className="polaroid-meta text-[11px] text-[#767676] truncate mt-0.5">
                {formatShortLoc(moment.location, moment.year)}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundEngine.shutter();
                onInspect(idx);
              }}
              className="polaroid-btn text-[11px] text-[#52525b] hover:text-[#0c0c0c] underline underline-offset-4 shrink-0 cursor-pointer"
            >
              Inspect
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
