# TheVibeCheckProject Cards — GEMINI.md (Always Read)
**Version:** v2.1 (Full — v2.0 + Additions)  
**Date:** January 20, 2026  
**Purpose:** This file is the permanent build contract for Gemini 3 inside Antigravity IDE. Gemini must read this file **before** taking any action, every session.

---

## 1) One-sentence goal
Build a production-quality web app where users **design custom greeting cards (images + text)** and recipients open them via a **link** that plays a **premium 3D envelope animation** (wax seal → open → card slides out sideways/landscape → rotates to portrait → opens).

---

## 2) Non-negotiables (locked decisions)

### Product
- **Web-first only** (mobile-friendly web; no app-store packaging).
- **Link-only delivery** (no password). SMS sending is optional later.
- Cards support **images + text** in v1. **No audio/video** in v1.
- Include **templates** (minimum 10) as editable starting points.
- Recipient flow: open link → 3D reveal → read → CTA “Send your own card”.

### Quality bar
- Not a toy demo. Must feel premium (smooth animation, clean UI, stable data).
- Must be buildable step-by-step, with verification after each milestone.

### Tech stack (locked)
- **Next.js (TypeScript)** for the web app
- **Supabase** for auth + database + file storage
- **Konva / react-konva** for the card designer
- **React Three Fiber + drei** for 3D envelope/card
- **Tailwind CSS** for styling
- **Zod** for request/body validation

---

## 3) How Gemini must work (Antigravity rules)
1. **Milestones only.** Complete exactly one milestone at a time.
2. **Stop after every milestone** and provide:
   - Terminal commands to run
   - What page(s) to open
   - What the user should see
3. If anything fails: **fix immediately** before moving on.
4. Do not invent features. Do not redesign the project.
5. Keep file/folder structure stable. Add files only when necessary.
6. Never put secrets into client code. Server secrets stay server-only.

---

## 4) Repo name + folder structure (must match)
Create a repository folder named: `thevibecheck-cards`

### Required structure
```
thevibecheck-cards/
  GEMINI.md
  PROMPTS.md
  README.md
  .env.example
  package.json
  tsconfig.json
  next.config.*  (as generated)
  supabase/
    migrations/
      0001_init.sql
      0002_rls.sql
    seed/
      templates.seed.json
  src/
    app/
      (marketing)/
        page.tsx
        templates/page.tsx
      (auth)/
        auth/login/page.tsx
        auth/signup/page.tsx
        auth/callback/route.ts
      (viewer)/
        c/[token]/page.tsx
      (app)/
        app/layout.tsx
        app/page.tsx
        app/designer/new/page.tsx
        app/designer/[cardId]/page.tsx
        app/sent/page.tsx
        app/templates/page.tsx
        app/account/page.tsx
      api/
        cards/route.ts
        cards/[cardId]/design/route.ts
        cards/[cardId]/deliver/route.ts
        viewer/[token]/route.ts
        storage/sign-upload/route.ts
    components/
      designer/...
      viewer3d/...
      ui/...
    lib/
      supabase/client.ts
      supabase/server.ts
      supabase/admin.ts
      tokens/generateToken.ts
      validation/schemas.ts
      rateLimit/limiter.ts
    types/
      designer.ts
      viewer.ts
```

---

## 5) Environment variables
Create `.env.local` from `.env.example`.

`.env.example` must include:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `PUBLIC_BASE_URL` (e.g. https://thevibecheckproject.com)

Optional later for SMS:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

---

## 6) Database model (Supabase Postgres)
Tables (minimum):
- `cards` (owner/sender)
- `card_designs` (design JSON, per card)
- `card_faces` (exported PNG face URLs/paths)
- `deliveries` (share token + open tracking)
- `templates` (seeded editable templates)

Security:
- Owner-only access for `cards`, `card_designs`, `card_faces`, `deliveries`
- Templates are public readable
- Viewer access by token happens through **server API** (`/api/viewer/[token]`), not direct DB reads.

---

## 7) Card Designer (must-have capabilities)
Designer is 2D (Canva-like), exporting images for 3D viewer.

Must support:
- Faces: **Front**, **Inside Left**, **Inside Right** (Back optional later)
- Add **image** layers (upload → place)
- Add **text** layers
- Move/resize/rotate layers
- Layer order (bring forward/back, layers panel)
- Save + reload design (JSON persisted)
- Export face PNGs at fixed resolution (recommend: **1536×2048 portrait**)
- Upload exported PNGs to Supabase Storage

Design JSON must be stable and versioned:
- `meta`: width, height, version
- `faces`: each face has an ordered list of layers

### v2.1 Additions (do not remove)
#### 7.1 TypeScript contract file (mandatory)
Gemini must create and use: `src/types/designer.ts`  
All designer save/load/export logic must conform to those types. Do not change the types without explicit user approval.

#### 7.2 Canonical Designer JSON example (mandatory reference)
```json
{
  "meta": {
    "version": 1,
    "width": 1536,
    "height": 2048
  },
  "faces": {
    "front": {
      "layers": [
        {
          "id": "layer-uuid",
          "type": "text",
          "x": 200,
          "y": 300,
          "rotation": 0,
          "scaleX": 1,
          "scaleY": 1,
          "text": "Happy Birthday!",
          "fontFamily": "Playfair Display",
          "fontSize": 72,
          "color": "#111111",
          "align": "center"
        }
      ]
    },
    "inside_left": { "layers": [] },
    "inside_right": { "layers": [] }
  }
}
```

Rules:
- Schema must not change without explicit user approval.
- New properties may be added only if backward compatible.
- Saved designs must reload pixel-perfect.

---

## 8) 3D Viewer (recipient experience)
Route: `/c/[token]`

Must do:
1. Show sealed envelope with wax seal
2. Click seal → open envelope flap
3. Slide card out **sideways/landscape orientation**
4. Rotate card to **portrait** once out (for phone readability)
5. Pause showing front
6. Open card to reveal inside left/right
7. End CTA: “Send your own card” (signup) + optional “Reply with a card”

Performance:
- Mobile-first, smooth animation, avoid heavy post-processing

### v2.1 Additions (timing + no-skipping)
Animation state machine must have distinct states:
- Sealed Idle
- Envelope Flap Open
- Card Slide Out — Landscape
- Rotate to Portrait
- Front Showcase Pause
- Card Open (hinge)
- Reading State
- CTA Overlay

Timing targets (approx):
- Flap open: ~0.6s
- Card slide out: ~1.2s
- Rotate to portrait: ~0.6s (after slide completes)
- Front pause: ~1.0s
- Card open: ~0.8s

Rules:
- Do not merge or skip states.
- Rotation happens after slide-out, not during.

---

## 9) Milestone plan (Gemini must follow exactly)

### Milestone 0 — Project bootstrap
- Create Next.js TypeScript app
- Add Tailwind
- Install deps: `@supabase/supabase-js zod konva react-konva @react-three/fiber @react-three/drei`
**Done when:** dev server runs and landing page renders.

### Milestone 1 — Supabase schema + RLS
- Provide `0001_init.sql` and `0002_rls.sql`
- Tables exist, RLS enabled
**Done when:** schema created without errors; authenticated user can insert/select own `cards`.

### Milestone 2 — Auth + protected area
- Signup/login pages
- `/app/*` requires auth
**Done when:** user can sign up and access `/app`.

### Milestone 3 — Cards CRUD skeleton
- Create card button → new card row + design row
- Sent list shows created cards
**Done when:** card appears in `/app/sent`.

### Milestone 4 — Designer v1 (real editor)
- Add image + text, transform, layers panel
- Save/restore JSON
**Done when:** refresh restores design perfectly.

### Milestone 5 — Export faces + upload
- Export PNG for front/inside-left/inside-right
- Upload to Supabase Storage
- Save paths in `card_faces`
**Done when:** exported images visible in storage and loadable.

### Milestone 6 — Share link + viewer API
- Create delivery token
- `/api/viewer/[token]` returns signed URLs + increments open_count
- `/c/[token]` renders a temporary 2D preview using the textures
**Done when:** open_count increments and previews show correct faces.

### Milestone 7 — Premium 3D viewer
- Replace 2D preview with 3D envelope animation + textured card
- Implement timeline exactly (slide landscape → rotate portrait → open)
- Add “Skip animation”
**Done when:** full experience works smoothly on mobile.

### Milestone 8 — Templates
- Seed 10+ templates
- Template gallery
- “Use template” creates editable card
**Done when:** templates create a new card with editable design.

---

## 10) Mandatory “Stop & Report” format after each milestone
Gemini must respond using this exact structure:

**Milestone X Completed**
- What changed:
  - (bullet list)
- Commands to run:
  - (commands)
- What to open:
  - (URLs)
- Expected result:
  - (what user sees)
- If anything fails:
  - (where to look / what logs)

---

## 11) Plain-English glossary (for the user)
- **Repo / folder**: the project directory on disk.
- **Route**: a page URL like `/c/abc123`.
- **Token**: random code in the link that unlocks viewing.
- **Supabase**: handles login + saving your card data + storing images.
- **Storage**: where images/files live.
- **Designer JSON**: the saved “instructions” describing what the card looks like.
- **Export faces**: turning the design into PNG images used as textures in 3D.

---

## 12) Strict success definition (final)
Project is complete when:
- A user can sign up
- Create or choose a template
- Design a card with images + text
- Generate a share link
- Recipient opens link and sees the full 3D envelope experience and can read the inside
