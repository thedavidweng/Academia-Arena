# Design System Documentation: Institutional Brutalism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Radical Archive."** This is an editorial-heavy, strategy-focused aesthetic that merges the prestige of traditional academia with the aggressive energy of high-stakes competition. It moves away from "gamified" clutter toward a sophisticated, minimalist interface that feels like a redacted dossier or a high-end architectural blueprint.

We break the "template" look by leaning into **Aggressive Asymmetry** and **Rigid Geometry**. Layouts should feel intentional and blocky, utilizing oversized typography that occasionally overlaps containers to create depth. The design rejects roundness entirely (`0px` radius scale) to maintain a sharp, authoritative edge.

## 2. Colors
Our palette is a high-contrast interrogation of Terracotta, Charcoal, and Cream. It is designed to be legible under pressure while feeling premium and "tactile."

### The Palette (Core Tokens)
- **Primary (`#aa301a` / `primary`):** A sophisticated Terracotta. Used for critical action states, energy indicators, and "Exams" zone markers.
- **Surface (`#fef9f1` / `surface`):** A warm, off-white cream. This provides the "paper" feel of the academic environment.
- **On-Surface (`#1d1c17` / `on-surface`):** Our deep Charcoal. Used for heavy headers and structural grid lines.

### Strategic Implementation
*   **The "No-Line" Rule:** Standard 1px dividers are forbidden for sectioning. Boundaries must be defined by shifts between `surface` and `surface-container-low` (`#f8f3eb`). Let the color change be the edge.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of stacked cardstock. A card (`surface-container-lowest`) should sit on a background (`surface`) to create a subtle, natural distinction.
*   **Signature Textures:** For high-impact areas like "Exams" zones, use a subtle linear gradient transitioning from `primary` (#aa301a) to `primary-container` (#cb4830) to provide a "pulsing" tonal depth that feels more alive than a flat hex code.

## 3. Typography
The typography system is built on a "Master/Student" relationship: heavy, loud headers paired with technical, precise body text.

*   **Display & Headline (Epilogue):** Used for large-scale titles and card names. These should be set with tight letter-spacing and heavy weights.
    *   *Role:* Authoritative, brutalist, and impactful.
*   **Title & Body (Manrope):** Used for card descriptions and navigation. Manrope offers high legibility while maintaining a modern, geometric feel.
    *   *Role:* Functional and clear.
*   **Labels (Space Grotesk):** Used for technical metadata, "Presentations" tags, and energy costs.
    *   *Role:* Technical and "monospaced" in spirit, emphasizing the data-driven nature of strategy.

## 4. Elevation & Depth
In this system, depth is not a shadow—it is a layer. We prioritize **Tonal Layering** over traditional skeuomorphism.

*   **The Layering Principle:** To lift an element, change its container token. An "Assignment" zone should use `surface-container-high` (`#ece8e0`) to recede, while the active "Card" uses `surface-container-lowest` (`#ffffff`) to pop forward.
*   **Ambient Shadows:** If a "floating" effect is required for a dragged card, use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(29, 28, 23, 0.06);`. The shadow color must be a tinted version of `on-surface`, never pure black.
*   **The "Ghost Border":** For card outlines, use `outline-variant` (`#e0bfb8`) at 20% opacity. It should feel like a watermark, not a stroke.
*   **Glassmorphism:** For overlays (like a pause menu), use a `surface` color with 80% opacity and a `backdrop-filter: blur(12px)`. This keeps the "arena" visible while focusing the user.

## 5. Components

### Cards & Zones
*   **The Card Base:** Absolute `0px` corners. Use `surface-container-lowest` for the background.
*   **Zone Markers:** "Presentations" (Secondary), "Assignments" (Neutral), and "Exams" (Primary). Use heavy block labels in `Space Grotesk` at the top-left of each zone.
*   **No Dividers:** Separate card sections (Art vs. Ability text) using a simple `16px` vertical gap or a subtle background shift to `surface-variant`.

### Interaction Elements
*   **Buttons:**
    *   *Primary:* Solid `primary` background, `on-primary` text, all caps, heavy weight.
    *   *Secondary:* `outline` border (Ghost Border style) with `on-surface` text.
*   **Energy Bars:** Use high-contrast blocks. A filled energy segment is a solid `primary` block; an empty segment is `surface-dim`.
*   **Input Fields:** Ghost Borders only. When focused, the bottom border thickens to 2px in `primary`.

### Navigation & Meta
*   **Chips:** Rectangular blocks. No rounded ends. Use `secondary-container` for inactive filters and `primary` for active ones.
*   **Tooltips:** High-contrast Charcoal (`on-surface`) background with Cream (`surface`) text. 0ms delay on hover to feel "snappy" and academic.

## 6. Do's and Don'ts

### Do:
*   **Do** embrace the 0px radius. Every corner must be a sharp 90-degree angle.
*   **Do** use extreme scale. If a header is important, make it massive (`display-lg`).
*   **Do** use "Bleed" layouts. Let card art or large background text run off the edge of the screen to create a sense of scale.

### Don't:
*   **Don't** use standard drop shadows. If it looks like a default Material Design shadow, it's wrong.
*   **Don't** use 1px solid black borders. Use background color shifts to define space.
*   **Don't** use "soft" colors. Every color choice should feel high-contrast and intentional.
*   **Don't** center everything. Use the grid to create asymmetrical balances—place your primary stats on the far edges to frame the content.