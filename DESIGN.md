# Design System: Wen Yifan Portfolio V2

## 0. Design Philosophy (binding)

This portfolio is a **design instrument**, not a card gallery.

| Pillar | Meaning |
| --- | --- |
| **Instrument** | UI reads like a calibrated console: mono telemetry, hairline frames, live state, skippable boot. |
| **Order** | Information is indexed (`01 / 02 / 03`), aligned to a construction grid, and revealed in sequence. |
| **Restraint** | Motion is short, purposeful, and skippable. Orange is a signal, never a wash. |
| **Evidence** | Real work leads. Copy is short and factual. No invented awards or decorative noise. |
| **Contrast** | Cinema Black carries narrative immersion; Editorial Paper carries index and case evidence. |

### Opening sequence language

The home intro is a **system boot**, not a brand splash video:

- Cinema Black field, hairline instrument frame, corner ticks in Signal Orange.
- Oversized Chinese name + mono English channel label.
- Ordered telemetry checklist (WAIT → LIVE → OK).
- Tabular progress counter and thin orange meter.
- Skippable via button or `Escape` / `Enter` / `Space`.
- Disabled under `prefers-reduced-motion`.
- Duration target: under ~2s when the hero scene is ready; hard cap ~2s.

### Method disc language

The principles section pairs paper copy with a black kinetic disc:

- Disc is the interactive instrument (hold to charge, release for ripple).
- Paper side carries method acts **and** a mono instrument HUD (state / charge / rings / act).
- HUD mirrors disc charge without competing with the canvas.

## 1. Visual Theme & Atmosphere

This portfolio adapts selected visual languages into a distinct personal system for Wen Yifan. The foundation is cinematic, black-led, typographically aggressive, and punctuated by a near-neon orange-red; a later interface layer adds console-like navigation, ASCII previews, and structural controls. The adaptation uses only Wen Yifan's own brand-visual, 3D, AIGC, and interactive-web work.

The site alternates immersive dark scenes with one high-contrast paper section. Oversized headlines act as composition rather than decoration, while monospace metadata gives each project a portfolio-index rhythm. Real work remains the primary visual evidence.

### Key Characteristics

- Cinematic black surfaces with full-bleed project imagery.
- Orange-red marquees create section transitions and brand recall.
- Oversized grotesk headlines use tight tracking and compact line height.
- Project information is presented as indexed rows, not rounded cards.
- The graduation concept “Runes Attack and Defense” is presented as a complete esports event-identity case, with its unofficial status stated explicitly.
- Flat borders with selective micro-radius: 3px controls, 4px media, and 6px floating panels; project rows and full-width sections stay square.
- Motion is restrained: reveal, image crossfade, marquee, image zoom, short text scramble, and slow WebGL movement.
- A console-like navigation shell and live page minimap expose the site's information structure without replacing the portfolio narrative.
- Selected work can switch between the source image and a locally generated ASCII interpretation.
- The capability section behaves like an interface: resizable desktop panes, collapsible groups, and a compact status rail.
- A short instrument-style opening sequence introduces Wen Yifan, reports ordered loading telemetry, and exits as soon as the hero WebGL scene is ready; it remains skippable and is disabled for reduced-motion users.
- Site-wide sound dock (left drawer, vinyl/tonearm metaphor) uses the same mono/orange console language; audio is opt-in.

## 2. Color Palette & Roles

| Role | Semantic Name | Value | Usage |
| --- | --- | --- | --- |
| Primary action | Signal Orange | `#FF5125` | Marquees, active rows, highlighted words, focus states |
| Accent dark | Burnt Orange | `#D93E17` | Symbol field and secondary orange surface |
| Dark surface | Cinema Black | `#111111` | Hero, skills, manifesto, footer |
| Dark secondary | Soft Black | `#181818` | Portfolio showcase and media placeholders |
| Light surface | Editorial Paper | `#ECEBE6` | Project index and case studies |
| Light text | Soft White | `#F4F3EF` | Headlines and primary text on dark surfaces |
| Muted text | Neutral Gray | `#8A8A86` | Labels, descriptions, secondary metadata |
| Dark divider | White 22% | `rgba(244,243,239,.22)` | Rules on dark sections |
| Light divider | Black 22% | `rgba(17,17,17,.22)` | Rules on paper sections |

### Primary

- Signal Orange is used as a transition and attention system, not as a page-wide background.
- Cinema Black carries the main narrative and lets the rendered artwork remain dominant.

### Interactive

- Hovered project rows invert from paper/black to orange/white.
- Keyboard focus uses a 2px Signal Orange outline with 4px offset.
- Text links reveal an orange underline or invert to orange-filled controls.

### Neutral Scale

- Soft White for primary dark-mode text.
- Neutral Gray for support copy and metadata.
- Editorial Paper for bright content bands without a warm cream cast.

### Surface & Overlay

- Main dark page surface: `#111111`.
- Light case-study surface: `#ECEBE6`.
- Image overlay: solid `rgba(8,8,8,.57)`; no decorative hero gradient.

### Theme Modes

#### Light Mode

- Background: `#ECEBE6`.
- Surface: no raised cards; content remains flat.
- Text: `#111111`.
- Accent: `#FF5125`.
- Notes: Used for works index and detailed project cases only.

#### Dark Mode

- Background: `#111111`.
- Surface: `#181818` where a secondary band is required.
- Text: `#F4F3EF`.
- Accent: `#FF5125`.
- Notes: Default mode for hero, manifesto, skills, showcase, and contact.

### Shadows & Depth

- No card shadows.
- Depth comes from full-bleed imagery, opacity, scale, and section contrast.
- Focus uses an orange outline instead of a glow.
- The fixed navigation uses one restrained shadow to remain legible across alternating dark and paper sections.

### Corner Geometry

- Controls use `3px`, framed media uses `4px`, and floating panels use `6px`.
- Project rows, section bands, orange transitions, and full-bleed WebGL scenes remain square.
- Circular close controls and intentional pill CTAs may retain their established geometry.
- Do not introduce large-radius cards or rounded page sections.

## 3. Typography Rules

### Font Family

- Primary: `Segoe UI Variable Display`, `Aptos Display`, `Helvetica Neue`, sans-serif.
- Monospace: `Cascadia Mono`, `SFMono-Regular`, Consolas, monospace.
- OpenType Features: Tight display tracking; normal body tracking.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Hero headline | Display | `52-88px` | 620 | `.96` | `-.065em` | Chinese role statement with orange emphasis |
| Section heading | Display | `56-106px` | 600 | `.82` | `-.07em` | Split across short lines |
| Manifesto | Display | `48-92px` | 590 | `.87` | `-.07em` | Centered desktop, left-aligned mobile |
| Project title | Display | `46-76px` | 580 | `.86` | `-.07em` | Case-study title |
| Body copy | Body | `14-16px` | 400 | `1.5-1.7` | `0` | Short and evidence-led |
| Label / Eyebrow | Mono | `9-11px` | 400 | `1.4` | `.06-.09em` | Uppercase metadata |

### Principles

- Headlines create the visual structure; body copy stays short.
- Display tracking is deliberately tight, but body tracking is always zero.
- Chinese and English labels can coexist, but English is limited to role and metadata.

## 4. Component Stylings

### Buttons and Links

- **Primary CTA**
  - Background: transparent by default, Signal Orange on hover.
  - Text: uppercase monospace, 9px.
  - Height: 42-44px.
  - Radius: 999px only for clear actions.
- **Secondary CTA**
  - Background: transparent.
  - Ring: 1px translucent white.
  - Text: Soft White.
- Text links: compact monospace labels with restrained underline motion.
- Hover and active feel: fast color inversion with 200-300ms easing.

### Cards and Containers

- Surface style: flat full-width bands and unframed layouts.
- Radius: `0px` for media, lists, sections, and controls except action pills.
- Border: 1px translucent divider.
- Shadow or elevation: none.
- Internal spacing: section-level spacing rather than card padding.

### Inputs and Interactive Controls

- Project rows act as preview selectors.
- Focus behavior mirrors hover and includes a visible orange outline.
- Selected project row uses orange background and white text.

### Navigation

- Three-column desktop header: name, role, links.
- Transparent over the hero, with one horizontal divider.
- Link style: uppercase monospace at 9px.
- Mobile navigation becomes a bordered full-width dropdown below the header.

### Image Treatment

- Project imagery uses original artwork without blur or heavy color tint.
- Hero image receives only a solid black opacity overlay for text legibility.
- Media edges are square and separated by narrow 10px gutters.
- Clickable project images open in a full-screen dark lightbox.

### Distinctive Components

- Orange marquee band with repeated portfolio positioning.
- White indexed project list with live image preview.
- Split paper/black principles field carrying the Be Real / Be Creative / Be Bold statement alongside a kinetic concentric typography canvas.
- `Portfolio@26` scene with centered artwork and vertical orange rule.

## 5. Layout Principles

### Spacing System

- Base unit: `10px`.
- Repeated spacing values: `10px`, `20px`, `40px`, `70px`, `88px`, `120px`.

### Grid & Container

- Grid logic: asymmetric two-column compositions, typically 0.7/1.3 or 0.8/1.2.
- Max content width: `1360px`.
- Section spacing: `120px` desktop, `88px` tablet, `68-88px` mobile.

### Whitespace Philosophy

- Large empty areas are intentional breathing room around oversized type.
- Metadata aligns to grid edges, while main headlines may span columns.
- Media is allowed to dominate when it demonstrates finished work.

### Border Radius Scale

- Micro: `0px`.
- Standard: `0px`.
- Large: `0px`.
- Pill: `999px`, commands only.

## 6. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| Flat | Solid surface, no shadow | Sections, tables, cases |
| Ring | 1px translucent border | Header, CTAs, lightbox close control |
| Media | Full-bleed image with narrow divider | Project evidence |
| Focus | 2px orange outline | Keyboard navigation |

### Depth Principles

- Surface hierarchy is created by black/paper/orange changes.
- Shadows are avoided.
- Full-screen overlays are reserved for image inspection.
- Visual depth must come from the user's actual 3D work.

## 7. Do's and Don'ts

### Do

- Lead with Wen Yifan's actual work and role.
- Keep orange limited to emphasis, transitions, and interaction.
- Use short, evidence-led project descriptions.
- Label personal concepts and competition results accurately.
- Preserve the desktop two-column rhythm and clean mobile collapse.

### Don't

- Do not copy Benjamin Creative's name, wording, portrait, project names, or code.
- Do not reintroduce green accents or rounded portfolio cards.
- Do not add unverified awards, years, clients, or statistics.
- Do not place tiny body copy over busy images.
- Do not use decorative gradients, glows, or floating blobs.

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
| --- | --- | --- |
| Mobile | `<560px` | Single column, 30px gutters, simplified project rows, stacked media |
| Tablet | `560-920px` | Single-column narrative, relative preview and skills blocks |
| Desktop | `>920px` | Asymmetric two-column layouts and sticky preview/skills intro |

### Touch Targets

- Navigation and CTA controls are at least 42px high.
- Project rows are at least 68px high on mobile.

### Collapsing Strategy

- Desktop behavior: asymmetric grids, live preview, sticky skill introduction.
- Tablet behavior: grids collapse while image preview remains above project rows.
- Mobile behavior: project category column hides; case media becomes one column.
- Breakpoint-driven component changes: desktop nav becomes a bordered dropdown.
- Touch target and spacing adjustments: 15px page gutter and 68px minimum project rows.

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: `#FF5125`.
- Background: `#111111`.
- Heading text: `#F4F3EF`.
- Body text: `#8A8A86`.
- Border or ring: `rgba(244,243,239,.22)`.
- Accent: `#FF5125`.

### Quick Summary

Build a cinematic portfolio with black full-bleed sections, one paper-colored project index, and orange-red transition bands. Use oversized tightly tracked grotesk headlines, tiny monospace metadata, square project imagery, and zero card shadows. Keep motion focused on reveal, marquee, preview crossfade, and media zoom. All content must remain Wen Yifan's own work.

### Example Component Prompts

- Hero: "Create a 92svh full-bleed hero using a real 3D artwork, a solid dark overlay, an inset project image, and an oversized Chinese role statement with one orange phrase."
- Card: "Avoid a card; use an indexed project row separated by thin rules, with an orange selected state and a live image preview."
- Navigation: "Build a transparent three-column header with name, role, and monospace links; collapse to a bordered mobile dropdown."
- Button or badge: "Use a compact outlined pill only for clear commands, with an orange fill on hover."

### Ready-to-Use Prompt

Create a responsive portfolio for Wen Yifan using a cinematic black, editorial paper, and signal-orange system. Lead with actual 3D and brand work, oversized display typography, monospace metadata, indexed project rows, full-width media, and square corners. Do not copy reference content or invent credentials.

### Iteration Guide

1. Verify the first viewport shows the name, target role, actual work, and a hint of the orange marquee.
2. Keep project evidence larger than supporting copy.
3. Test project preview, lightbox, mobile navigation, overflow, image loading, and reduced-motion behavior after each revision.

## Optional Appendix: Interaction Patterns

- Scroll behavior: 4-5% intersection threshold with one-time reveal.
- Hover behavior: orange row inversion and preview crossfade.
- Click behavior: project row selection and full-screen image inspection.
- Animation tone: crisp and restrained, 200-800ms with one easing curve; the one-time instrument boot may run up to two seconds while real scene assets initialize.
- Project index drawer: fixed bottom-right launcher opens a paper-colored side panel with chapter links, project rows, hover/focus preview switching, backdrop dismissal, Escape dismissal, and a trapped keyboard-focus loop.
- Case-media inspector: pointer position drives a thin orange scan line, subtle image parallax, and a live XY coordinate label; touch layouts hide the coordinate label.
- Principles vortex: concentric text uses only Wen Yifan's own positioning language; pointer movement shifts its center and scroll changes its rotational phase. The Canvas / WebGL loop runs only while visible. The paper-side method HUD mirrors charge state in mono telemetry.
- Page minimap: displays live scroll progress and also acts as a desktop scroll slider with pointer, arrow, Page Up/Down, Home, and End support.
- Active navigation: the fixed navigation marks the section currently crossing the reading line and exposes it with `aria-current="page"`.
- Global cursor: fine-pointer desktop devices use a square crosshair that expands over commands, grows over inspectable media, and becomes a vertical drag frame over structural controls. It never captures pointer events and is disabled on touch layouts.
- Sound dock: left fixed console drawer with vinyl metaphor, procedural tracks (replaceable later with real audio), dark/paper surface adaptation, and reduced-motion safe fallbacks.
- Reduced motion: disables image parallax and vortex motion while preserving a static typography composition and access to all content and controls.

## Optional Appendix: Content & Messaging Patterns

- Headline pattern: short statement with one highlighted phrase.
- CTA language: direct commands such as View Selected Work and Start the Project.
- Trust signal pattern: role, year, tools, result, and project type.
- Voice and tone: confident, concise, visually literate, and factual.

## Optional Appendix: Observed Pages

- https://benjamincreative.me/: supplied the dark/orange atmosphere, large type hierarchy, marquee rhythm, project-index pattern, manifesto treatment, and skill-table composition. All branding and project content were replaced.
- https://www.contentarchitecture.dev/: informed the console-like navigation shell, interactive page minimap, ASCII media mode, resizable capability panes, compact status rail, short character-scramble feedback, and the split-screen concentric-type interaction. The concentric scene was rebuilt with Wen Yifan's own positioning language and visual tokens; product copy, assets, code, and brand identity were not reused.
- https://mythre.netlify.app/: Wen Yifan's own REVERIE project, represented locally with captured desktop, archive, and mobile views while retaining a direct link to the live site.
