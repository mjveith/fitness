# Exercise media sourcing

This app now avoids the original generated SVG exercise diagrams on all user-facing exercise surfaces.

## Active media sources

### 1. yuhonas/free-exercise-db
- Repo: https://github.com/yuhonas/free-exercise-db
- Delivery: raw GitHub image pairs under `exercises/<id>/0.jpg` and `1.jpg`
- Usage here: primary real-life start and end images for most strength, bodyweight, core, cardio, and plyo movements
- License note: verify and preserve upstream repository license/terms when redistributing or mirroring

### 2. gsuiffet/openfit
- Repo: https://github.com/gsuiffet/openfit
- Delivery: raw GitHub WebP image pairs under `exercises/<id>/images/0.webp` and `1.webp`
- Usage here: fills gaps for movements not covered well enough by the primary source
- Current mappings: `sled-push`, `farmer-carry-march`
- License note: verify and preserve upstream repository license/terms when redistributing or mirroring

## Mapping contract
- Source mapping lives in `lib/exercise-image-map.ts`
- Each exercise id must map to a two-image tuple: `[startImageUrl, endImageUrl]`
- User-facing components should render only `imageUrls` and must not fall back to inline SVG diagrams

## Coverage notes
- Current exercise surfaces covered:
  - exercise library cards
  - exercise detail page
  - workout log form
- If a future exercise lacks a mapped pair, keep the UX non-SVG. Use a neutral unavailable state until a real-life pair is added.

## Follow-up recommendation
- For long-term performance and license control, mirror approved upstream assets into a local, versioned media directory after legal review.
