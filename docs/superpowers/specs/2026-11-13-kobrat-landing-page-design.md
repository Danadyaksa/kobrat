# Design Spec: KOBRAT Circle Website - 3D Landing Page & Preloader

**Date**: 2026-11-13  
**Status**: Approved  
**Project**: KOBRAT Friend Circle Landing Page  
**Project Root**: `D:\Projek Aksa\kobrat`  
**Target Platform**: Next.js (App Router) on Vercel  

---

## 1. Overview & Goal
Build an interactive, high-polish landing page for a friend group of 8 members named **"KOBRAT"**, inspired by the visual language and motion design of `ellioteriksson.com`.

Key Highlights:
* **Intro Preloader**: Full-screen black intro veil with Gothic/Blackletter branding, animated 0% to 100% counter, and a smooth GSAP curtain-reveal.
* **Hero 3D Iris Carousel**: 8 member cards rotating in a 3D cylindrical/elliptical orbit around a central typography statement.
* **Direct Vercel Compatibility**: Built on Next.js (App Router) for zero-config deployment to Vercel.

---

## 2. Technology Architecture
* **Framework**: Next.js (App Router, TypeScript)
* **Styling**: Tailwind CSS (Monochrome dark palette, modern typography tokens)
* **Animation Engine**: GSAP (GreenSock) + `@gsap/react`
  * Timeline-driven sequence for the Preloader curtain reveal.
  * Ticker/RAF for the continuous 3D Iris rotation and mouse parallax inertia.
* **Smooth Scrolling**: Lenis (`lenis`) for inertial Awwwards-style scrolling.
* **Icons**: `lucide-react`
* **Hosting**: Vercel ready (`git push` / Vercel CLI)

---

## 3. Visual & Aesthetic Guidelines (Elliot Eriksson Style)
* **Color Palette**:
  * Background: Deep Void (`#09090b` / `#050505`) and Subtle Surface (`#121214`)
  * Foreground: Pristine White (`#fafafa`) and Muted Gray (`#71717a` / `#a1a1aa`)
  * Borders & Accents: Ghost borders (`rgba(255, 255, 255, 0.08)`)
* **Typography**:
  * Brand Mark: Blackletter / Gothic Pixelated display font for "KOBRAT"
  * Tagline & UI: Neo-Grotesque Sans (Inter / Geist)
  * Data & Status: JetBrains Mono / Geist Mono for coordinates, percentage counters, and timestamps.

---

## 4. Component Architecture

```
src/
├── app/
│   ├── layout.tsx              // Lenis smooth scroll provider + font imports
│   ├── page.tsx                // Main page coordinating Preloader and Hero
│   └── globals.css             // Custom CSS 3D perspective & Gothic typography rules
├── components/
│   ├── Preloader.tsx           // 0-100% counter, Gothic text mask, curtain reveal timeline
│   ├── Header.tsx              // Minimalist bar: Logo, Live Time/Location, Member Count
│   ├── Hero.tsx                // Center quote/statement + container for 3D Iris
│   ├── IrisCarousel.tsx        // 3D elliptical orbit math (8 cards, mouse tracking, hover)
│   └── MemberCard.tsx          // Individual card (3:4 ratio, image, hover badge, elevation)
└── data/
    └── members.ts              // Typed list of 8 members (name, role, portrait image)
```

---

## 5. Motion Choreography & Math

### 5.1 Intro Preloader Sequence
1. Page loads: Curtain is fully opaque (`#09090b`), counter increments smoothly from `0%` to `100%` over ~1.6s.
2. At 100%:
   * Gothic "KOBRAT" logo pulses subtly.
   * GSAP Timeline lifts the curtain up (`yPercent: -100`, `ease: "power4.inOut"`, `duration: 1.1s`).
   * Hero text runs a character reveal/scramble animation.
   * The 3D cards expand smoothly into their orbital positions.

### 5.2 3D Iris Orbit Math (8 Cards)
* **Angular Spacing**: $\theta_i = \frac{2\pi}{8} \cdot i = \frac{\pi}{4} \cdot i$ ($45^\circ$ per card).
* **3D Positioning**:
  * $x = R_x \cdot \sin(\theta + \text{rotationOffset})$
  * $z = R_z \cdot \cos(\theta + \text{rotationOffset})$
  * $y = R_y \cdot \sin(\theta + \text{rotationOffset}) \cdot \text{tiltFactor}$
* **Visual Hierarchy**:
  * Card scale and opacity modulate dynamically based on $z$-depth: front cards are scale `1.0` and opacity `1.0`, back cards scale down to `0.75` and opacity `0.4`.
  * `zIndex` is sorted by $z$-coordinate so front cards always overlay back cards.
* **Interactivity**:
  * Auto-spin speed: subtle ambient rotation (~0.002 rad/frame).
  * Mouse movement adds a velocity delta with damped lerp ($0.05$).
  * Card hover: pauses rotation, scales card up (`scale(1.08)`), elevates `translateY(-12px)`, and reveals tooltip tag (Name + Role).
  * Card click: passive for now (cursor default or pointer with tooltip preview, ready for modal expansion).
