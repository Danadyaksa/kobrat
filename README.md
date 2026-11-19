# 𝔨𝔬𝔟𝔯𝔞𝔱 (KOBRAT)

> **Collective 8-Friend Archival Portfolio & Creative Studio Experience**  
> An indie, editorial gothic-minimalist portfolio website and interactive archive documenting 8 friends across street photoboxes, midnight studio sessions, and analog rolls.

---

## ✦ Overview

**KOBRAT** is an avant-garde digital collective showcase built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, and **GSAP ScrollTrigger**. It combines brutalist-editorial typography, darkroom contact-sheet aesthetics, and smooth 3D spatial depth of field to present visual stories, member profiles, and moments.

---

## ✦ Key Features

### 1. Spatial 3D Highlights Deck (Landing Page)
- **3-Act Choreographed Scroll Experience:** Powered by GSAP ScrollTrigger, scrolling guides cards through an organic spatial perspective aperture.
- **Optical Depth-of-Field Bokeh:** Frames that recede into the background automatically blur (`blur(7.5px)` to `blur(12px)`) with progressive opacity attenuation, keeping foreground headlines razor-sharp and legible.
- **Aspect Ratio Fidelity:** 16:9 widescreen frame preservation without image distortion or unclipped gothic letterforms.
- **Top HUD Clearance:** Dynamic breathing room preventing text collision across desktop, laptop, and mobile viewports.

### 2. Studio Rack & Backstage Passes (`/members`)
- **3D Hanging Lanyard Passes:** Interactive ID badge cards with realistic lanyard straps, rivets, and physics tilt on hover.
- **Fully Responsive 2-Column Mobile Layout:** Scales gracefully from desktop studio rack to dual-column mobile festival passes without horizontal overflow.
- **Dynamic Member Profiles (`/[slug]`):** Dedicated pages for each member (e.g., `/hafiz`, `/aksa`, `/akmal`, `/dida`) featuring stylized nickname typography, bio, social links, full 3D interactive ID card, and "The Circle" dock navigation.

### 3. Archival Contact Sheet (`/gallery`)
- **Curated Archive:** High-resolution contact-sheet grid documenting collective moments.
- **Multi-View Modes:** Minimalist icon-based view switcher (multi-column grid vs. clean editorial list).
- **Interactive Lightbox:** Full-screen inspection modal with image metadata (location, date, member tags) and keyboard navigation (`Esc` dismiss).
- **Dynamic Member Tags:** Filter and display members present in each archival capture.

### 4. Admin Management Dashboard (`/admin`)
- **Moments Management:** Add, edit, and delete photo moments and stories.
- **Direct Uploads & In-Browser Cropper:** Integrated file upload endpoint and interactive 16:9 / freeform cropper modal powered by `react-easy-crop`.
- **Highlight Slot Assignment:** Pin moments directly to the landing page 3D highlights stack.
- **Member Tagging:** Tag collective members directly from an interactive tag selector.

### 5. Kinetic Typography & Tactile Sound FX
- **Custom Blackletter Wordmarks:** Distinctive gothic title treatments with kinetic split-letter rolling hover states.
- **Synthetic Web Audio Engine:** Zero-asset sound synthesizer generating mechanical camera shutter releases, clicks, and subtle interface hums.
- **Custom Adaptive Cursor:** Fluid cursor with context-aware labels (`VIEW`, `INSPECT`, `EXPLORE`).
- **Smooth Inertial Scrolling:** Integrated Lenis smooth scroll engine for frictionless scrolling physics.

---

## ✦ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Animations** | [GSAP 3](https://gsap.com/) & [ScrollTrigger](https://gsap.com/scrolltrigger/) |
| **Motion Physics** | [Motion](https://motion.dev/) |
| **Smooth Scrolling** | [Lenis](https://lenis.darkroom.engineering/) |
| **3D Rendering** | [Three.js](https://threejs.org/) |
| **Image Cropping** | [react-easy-crop](https://github.com/ValentinH/react-easy-crop) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## ✦ Project Structure

```text
kobrat/
├── public/
│   ├── fonts/               # Custom blackletter & editorial typography
│   ├── sounds/              # Audio assets & ambient cues
│   └── uploads/             # User-uploaded & cropped archival photos
├── src/
│   ├── app/
│   │   ├── [slug]/          # Member profile routes (e.g. /hafiz, /aksa)
│   │   ├── admin/           # Administrative portal for moment curation
│   │   ├── api/
│   │   │   ├── members/     # Member data API endpoints
│   │   │   ├── moments/     # Archival moments API endpoints
│   │   │   └── upload/      # Image upload handler
│   │   ├── gallery/         # Full archival contact sheet page
│   │   ├── members/         # Collective members backstage rack
│   │   ├── globals.css      # Core styles, design tokens, and font faces
│   │   ├── layout.tsx       # Root layout with providers & audio context
│   │   └── page.tsx         # Landing page (Hero & 3D Spatial Deck)
│   ├── components/
│   │   ├── CollectiveGallery.tsx   # 3D GSAP spatial highlights stack
│   │   ├── CustomCursor.tsx        # Contextual adaptive cursor
│   │   ├── Header.tsx              # Centered wordmark & mobile drawer HUD
│   │   ├── Hero.tsx                # 3D aperture ring and intro choreography
│   │   ├── ImageCropperModal.tsx   # Interactive 16:9 canvas cropper
│   │   ├── MemberCard.tsx          # 3D interactive lanyard badge card
│   │   ├── MemberProfileClient.tsx # Individual member detail experience
│   │   ├── Preloader.tsx           # Initial brutalist curtain preloader
│   │   ├── SmoothScroll.tsx        # Lenis smooth-scroll provider
│   │   └── TransitionLink.tsx      # Fluid page navigation transitions
│   ├── data/
│   │   ├── members.json     # Static collective member profiles
│   │   └── moments.json     # Archival moments data store
│   └── utils/
│       ├── cropImage.ts     # Client-side canvas image cropping
│       └── soundEngine.ts   # Web Audio API procedural sound engine
├── package.json
└── tsconfig.json
```

---

## ✦ Getting Started

### Prerequisites
- **Node.js**: v18.18.0 or later (v20+ recommended)
- **Package Manager**: `npm`, `pnpm`, or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Danadyaksa/kobrat.git
   cd kobrat
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

---

## ✦ Available Scripts

- `npm run dev` - Starts the local development server with Turbopack.
- `npm run build` - Compiles and builds the production bundle.
- `npm run start` - Runs the compiled production server.
- `npm run lint` - Runs ESLint code style and hygiene checks.

---

## ✦ Collective Members

- **Aksa** (Mohammad Atila Danadyaksa) — `@ade3s`
- **Hafiz** (Hafiz Alaudin Rasendriya) — `@hafizrasendriya_`
- **Akmal** (Akmal Danendra Maulana) — `@akmaldanendra`
- **Dida** (Dida Attallah Elfasdi) — `@didaattallah`
- **Danang** (Danang Adiwibowo) — `@danangadi.w`
- **Jepe** (Narindera Jati Panuntun) — `@narendrajp_`
- **Vano** (Raden Revano Athallah Kartika) — `@vanoathalla_`
- **Gorga** (Gorga Doli Liberto Napitupulu) — `@ieatcasdaily`

---

## ✦ License

Private collective archive. All rights reserved © 2026 **KOBRAT**.
