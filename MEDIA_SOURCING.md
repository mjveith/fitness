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
- A regression test in `tests/exercise-media-coverage.test.cjs` now fails if any catalog exercise lacks a two-image media pair or if any mapped asset is an SVG.

## Gap-fill fallback mappings added for FP-015
These exercise ids were missing direct coverage and now use the closest real-life open-source movement pair available from the upstream repos above:

- `neutral-grip-lat-pulldown` → `Close-Grip_Front_Lat_Pulldown` (free-exercise-db)
- `pendlay-row` → `Bent_Over_Barbell_Row` (free-exercise-db)
- `landmine-press` → `Landmine_Linear_Jammer` (free-exercise-db)
- `cable-lateral-raise` → `Cable_Seated_Lateral_Raise` (free-exercise-db)
- `bent-over-rear-delt-raise` → `Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench` (free-exercise-db)
- `y-raise` → `One-Arm_Incline_Lateral_Raise` (free-exercise-db)
- `reverse-pec-deck` → `Cable_Rear_Delt_Fly` (free-exercise-db)
- `single-arm-cable-extension` → `Cable_One_Arm_Tricep_Extension` (free-exercise-db)
- `curtsy-lunge` → `Dumbbell_Rear_Lunge` (free-exercise-db)
- `treadmill-run` → `Running_Treadmill` (free-exercise-db)
- `air-bike-sprint` → `Air_Bike` (free-exercise-db)
- `rowing-sprint` → `Rowing_Stationary` (free-exercise-db)
- `jump-rope` → `Rope_Jumping` (free-exercise-db)
- `battle-rope-waves` → `Battling_Ropes` (free-exercise-db)
- `shuttle-run` → `Single-Cone_Sprint_Drill` (free-exercise-db)
- `stair-climber-push` → `Stairmaster` (free-exercise-db)
- `assault-runner-push` → `Running_Treadmill` (free-exercise-db)
- `cycling-sprint` → `Bicycling_Stationary` (free-exercise-db)
- `sled-pull` → `Sled_Drag_-_Harness` (free-exercise-db)
- `shadow-boxing-intervals` → `Heavy_Bag_Thrust` (free-exercise-db)
- `broad-jump` → `Standing_Long_Jump` (free-exercise-db)
- `skater-hop` → `Single-Leg_Lateral_Hop` (free-exercise-db)
- `split-jump` → `Split_Jump` (free-exercise-db)
- `lateral-bound` → `Lateral_Bound` (free-exercise-db)
- `depth-jump` → `Depth_Jump_Leap` (free-exercise-db)
- `tuck-jump` → `Knee_Tuck_Jump` (free-exercise-db)
- `pogo-hop` → `Single-Leg_Hop_Progression` (free-exercise-db)
- `medicine-ball-slam` → `One-Arm_Medicine_Ball_Slam` (free-exercise-db)
- `rotational-med-ball-throw` → `Medicine_Ball_Full_Twist` (free-exercise-db)

## Follow-up recommendation
- For long-term performance and license control, mirror approved upstream assets into a local, versioned media directory after legal review.
