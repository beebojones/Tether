# Design Directions & Design System

## Directions presented (pick stays open — Meridian is the working selection)

### 1. Meridian — ★ recommended & currently implemented
- **Philosophy:** Linear-class precision. Information-dense, calm, engineered.
- **Palette:** deep blue-black surfaces (#0D1017 → #1A2030 layers), indigo accent
  #6E8BFF, violet secondary #9B6EF2; status colors desaturated-bright.
- **Type:** Segoe UI Variable, 13.5px base, tight headings (-0.3px tracking).
- **Navigation:** slim icon+label sidebar, breadcrumbless topbar, Ctrl+K first.
- **Surfaces:** flat layered panels, 1px subtle borders, soft sm/md shadows,
  8-12px radii; hover = background shift, never movement.
- **Comparable:** Linear, Height. **Strengths:** speed-feel, leadership-credible,
  dense. **Weakness:** can read "cool/impersonal" if overdone.

### 2. Graphite & Ember
- Warm charcoal (#141210 family) + amber/ember accent (#F2A64C), serif display
  headings for reports. Comparable: Campsite, Bear. Warmer, more editorial;
  slightly less "engineering tool".

### 3. Aurora Glass
- Translucent layered panels, background glow gradients, glassmorphism.
  Comparable: Arc, Raycast promos. Most visually striking in demos; hardest to
  keep readable at density; GPU cost in Electron.

### 4. Slate Pro (light-first)
- Cool light gray + navy, Jira/Confluence-adjacent. Most familiar to McKesson
  eyes; least distinctive; fails the "dark mode primary" requirement.

**Why Meridian:** the spec demands dark-primary, premium, dense, professional, and
"Mark and leadership immediately recognize craftsmanship" — Meridian hits all five
with the lowest readability risk. Switching later = editing `src/styles/tokens.css`.

## Design system (implemented)

All values live in `src/styles/tokens.css` — the single source of truth.

- **Color:** surface ladder (app→sidebar→panel→raised→hover→active), 3-step border
  ladder, 4-step text ladder, semantic status/priority tokens. Status is always
  color + label (never color alone — accessibility).
- **Type scale:** 11 / 12.5 / 13.5 / 15 / 18 / 24 / 32 px. UI font Segoe UI
  Variable; mono Cascadia Code for idents/code.
- **Spacing:** 4/8/12/16/24/32/48. **Radii:** 5/8/12/999.
- **Shadows:** sm (rows) / md (menus) / lg (modals) / glow (brand moments only).
- **Motion:** 120ms/200ms cubic-bezier(.25,.1,.25,1); background/opacity/transform
  only (no layout-property animation); `prefers-reduced-motion` collapses to 0ms.
- **Focus:** 2px `--border-focus` outline on every interactive element.
- **Density:** 32-36px rows, 7px vertical padding in tables.
- **Iconography:** Lucide, 13-16px, stroke.
- **Anti-patterns enforced by the design hook:** no side-tab card borders, no
  gradient text, no width/height transitions, no decorative-only controls.
