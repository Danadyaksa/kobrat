# KOBRAT Circle Website - 3D Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vercel-ready Next.js landing page for the 8-member circle "KOBRAT" featuring a Gothic intro preloader curtain and a 3D rotating iris carousel inspired by `ellioteriksson.com`.

**Architecture:** Next.js App Router serves as the foundation with Tailwind CSS for layout and dark minimalist theming. GSAP powers the choreographed preloader timeline and coordinates continuous trigonometric 3D positioning for 8 member cards, with Lenis providing smooth inertial scrolling.

**Tech Stack:** Next.js 15/14 (App Router), React, TypeScript, Tailwind CSS, GSAP (`gsap`, `@gsap/react`), Lenis (`lenis`), `lucide-react`.

**Spec:** `D:/Projek Aksa/kobrat/docs/superpowers/specs/2026-11-13-kobrat-landing-page-design.md`

## Global Constraints
- Target directory: `D:\Projek Aksa\kobrat`.
- Fully responsive on desktop and mobile browsers.
- Dark minimalist aesthetic: deep black `#09090b`, clean white `#fafafa`, ghost borders `rgba(255,255,255,0.08)`.
- 8 members placed with exact $45^\circ$ angular distribution in 3D perspective space.
- Zero build errors (`npm run build` must pass cleanly).

---

### Task 1: Project Initialization & Dependency Setup

**Files:**
- Create: `D:/Projek Aksa/kobrat/package.json`
- Create: `D:/Projek Aksa/kobrat/next.config.ts`
- Create: `D:/Projek Aksa/kobrat/tsconfig.json`

**Interfaces:**
- Produces: Runnable Next.js project with GSAP, Lenis, Lucide, and Tailwind CSS installed.

- [ ] **Step 1: Initialize Next.js project with Tailwind CSS & TypeScript**
Run in `D:\Projek Aksa\kobrat`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Install animation and icon dependencies**
Run:
```bash
npm install gsap @gsap/react lenis lucide-react
```

- [ ] **Step 3: Configure remote image domains in next.config.ts**
Configure Unsplash domain for remote portraits:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Verify initial build**
Run: `npm run build`
Expected: Build passes with `.next` generated.

---

### Task 2: Member Data & Type Definitions

**Files:**
- Create: `src/data/members.ts`

**Interfaces:**
- Produces: `Member` interface and `members` array containing 8 member profiles with Unsplash portraits, nicknames, and roles.

- [ ] **Step 1: Write `src/data/members.ts`**
```ts
export interface Member {
  id: number;
  name: string;
  nickname: string;
  role: string;
  image: string;
  instagram?: string;
}

export const members: Member[] = [
  {
    id: 1,
    name: "Aksa",
    nickname: "The Architect",
    role: "Vision & Creative Direction",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    instagram: "@aksa"
  },
  {
    id: 2,
    name: "Rafif",
    nickname: "The Navigator",
    role: "Ops & Logistics",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    instagram: "@rafif"
  },
  {
    id: 3,
    name: "Dimas",
    nickname: "The Catalyst",
    role: "Energy & Hype",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    instagram: "@dimas"
  },
  {
    id: 4,
    name: "Reza",
    nickname: "The Sound",
    role: "Vibe & Playlist Curator",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    instagram: "@reza"
  },
  {
    id: 5,
    name: "Farhan",
    nickname: "The Driver",
    role: "Midnight Escapades",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
    instagram: "@farhan"
  },
  {
    id: 6,
    name: "Bagas",
    nickname: "The Chronicler",
    role: "Camera & Memories",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
    instagram: "@bagas"
  },
  {
    id: 7,
    name: "Arya",
    nickname: "The Strategist",
    role: "Plans & Reservations",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
    instagram: "@arya"
  },
  {
    id: 8,
    name: "Gilang",
    nickname: "The Anchor",
    role: "Voice of Reason",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80",
    instagram: "@gilang"
  }
];
```

---

### Task 3: Custom Typography, Lenis Smooth Scroll & Global 3D Styles

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/SmoothScroll.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: Smooth Lenis scrolling across the app and 3D transform utilities in CSS.

- [ ] **Step 1: Update `src/app/globals.css` with 3D perspective and styling**
```css
@import "tailwindcss";

@layer base {
  body {
    background-color: #09090b;
    color: #f4f4f5;
    overflow-x: hidden;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
}

.perspective-1000 {
  perspective: 1000px;
}

.perspective-1200 {
  perspective: 1200px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

/* Gothic blackletter text effect */
.font-gothic {
  font-family: 'Cinzel Decorative', 'UnifrakturMaguntia', 'Georgia', serif;
  letter-spacing: -0.02em;
}
```

- [ ] **Step 2: Create `src/components/SmoothScroll.tsx`**
```tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 3: Wire `SmoothScroll` and metadata into `src/app/layout.tsx`**
Update `layout.tsx` to set title "KOBRAT — 8 Members Circle" and wrap children in `SmoothScroll`.

---

### Task 4: Preloader Component (Loading Counter & Curtain Reveal)

**Files:**
- Create: `src/components/Preloader.tsx`

**Interfaces:**
- Consumes: GSAP timeline.
- Produces: `<Preloader onComplete={fn} />` full-screen intro curtain with counter 0-100%, gothic "KOBRAT" title, and upward curtain reveal.

- [ ] **Step 1: Write `src/components/Preloader.tsx`**
Features:
- State `progress` starting at 0, incrementing to 100 over ~1.6s.
- Left text: "CIRCLE / EST. 2024"
- Center text: "KOBRAT" in Gothic Blackletter typography with masked fill animation.
- Right text: Animated counter `{progress}%` + spinning SVG indicator.
- At 100%, GSAP timeline slides curtain up `yPercent: -100` with `ease: "power4.inOut"`.
- Triggers `onComplete()` callback to start hero reveal.

---

### Task 5: 3D Iris Carousel Component

**Files:**
- Create: `src/components/MemberCard.tsx`
- Create: `src/components/IrisCarousel.tsx`

**Interfaces:**
- Consumes: `members` from `src/data/members.ts`.
- Produces: 3D interactive ring of 8 cards.

- [ ] **Step 1: Create `src/components/MemberCard.tsx`**
Renders a single 3:4 portrait card with:
- Next.js Image component (`fill`, `object-cover`).
- Subtle inner border and shadow.
- Hover overlay showing member name, nickname, and role in minimalist badge style.
- CSS transitions for smooth hover lifting (`scale(1.08) translateY(-8px)`).

- [ ] **Step 2: Create `src/components/IrisCarousel.tsx`**
Implements:
- 8 cards mapped to angular positions: $\theta_i = i \times \frac{2\pi}{8}$.
- Dynamic orbit dimensions ($R_x \approx 480\text{px}$, $R_z \approx 320\text{px}$, $R_y \approx 40\text{px}$).
- Ambient auto-rotation via `gsap.ticker` or `requestAnimationFrame`.
- Mouse parallax tracking: horizontal mouse movement alters angular velocity smoothly with inertia lerp.
- Depth sorting (`z-index` and scale based on $\cos(\theta)$ so front cards overlay back cards).
- Hover pause: when hovering any card, auto-rotation pauses smoothly.

---

### Task 6: Header & Hero Section Integration

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/Hero.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: Complete landing page experience linking Preloader, Header, Hero, and IrisCarousel.

- [ ] **Step 1: Create `src/components/Header.tsx`**
Minimalist top navigation bar:
- Left: "JAKARTA, ID" + live local time clock (updated every minute).
- Center: "KOBRAT" logo text.
- Right: "08 MEMBERS" + sound/status indicator.

- [ ] **Step 2: Create `src/components/Hero.tsx`**
Displays:
- Center statement text: *"8 Kepala, 1 Frekuensi. Circle pertemanan KOBRAT."* with decrypt/scramble letter reveal effect.
- Subtitle: *"A collective of eight friends navigating chaos, memories, and late-night drives."*
- Wraps the `<IrisCarousel />` orbiting directly around the center copy.

- [ ] **Step 3: Connect everything in `src/app/page.tsx`**
Manages intro state (`isLoaded`) and triggers hero reveals once preloader completes.

---

### Task 7: Build Verification, Responsiveness & Preview

**Files:**
- Test: Full build and runtime verification.

- [ ] **Step 1: Run production build verification**
Run: `npm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 2: Start dev server**
Run: `npm run dev`
Verify:
- Loading screen 0-100% plays smoothly.
- Curtain lifts to reveal KOBRAT landing page.
- 8 cards rotate seamlessly in 3D around the center text.
- Mouse movement changes rotation angle.
- Hovering a card pauses rotation and reveals member info.
