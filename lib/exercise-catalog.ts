import { Exercise, ExerciseCategory, ExerciseType } from "@/lib/types";

type Blueprint = {
  name: string;
  category: ExerciseCategory;
  type: ExerciseType;
  equipment: string[];
  movement:
    | "press"
    | "fly"
    | "pushup"
    | "pull"
    | "row"
    | "squat"
    | "hinge"
    | "lunge"
    | "curl"
    | "extension"
    | "raise"
    | "carry"
    | "crunch"
    | "rotation"
    | "plank"
    | "run"
    | "jump";
  primary: string[];
  secondary: string[];
  description: string;
  cues: string[];
  defaultSets: number;
  defaultReps: string;
  defaultRestSeconds: number;
};

const catalogBlueprints: Blueprint[] = [
  ...createBlueprints("chest", "strength", "press", [
    ["Barbell Bench Press", ["barbell", "bench"]],
    ["Incline Dumbbell Press", ["dumbbells", "bench"]],
    ["Decline Bench Press", ["barbell", "bench"]],
    ["Machine Chest Press", ["machine"]],
    ["Smith Machine Bench Press", ["smith machine", "bench"]],
  ], {
    primary: ["pectorals"],
    secondary: ["front delts", "triceps"],
    description: "Drive the load away from the torso with the rib cage stacked and shoulders anchored.",
    cues: ["Pin the shoulder blades back.", "Press through the mid palm.", "Finish with straight wrists."],
    defaultSets: 4,
    defaultReps: "6-10",
    defaultRestSeconds: 90,
  }),
  ...createBlueprints("chest", "strength", "fly", [
    ["Dumbbell Fly", ["dumbbells", "bench"]],
    ["Incline Dumbbell Fly", ["dumbbells", "bench"]],
    ["Cable Crossover", ["cable"]],
    ["Low Cable Fly", ["cable"]],
  ], {
    primary: ["pectorals"],
    secondary: ["front delts"],
    description: "Sweep the arms in a hugging arc to load the chest through a long range of motion.",
    cues: ["Keep a soft bend in the elbows.", "Stretch without dumping the shoulders forward.", "Meet the handles over the sternum."],
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
  }),
  ...createBlueprints("chest", "bodyweight", "pushup", [
    ["Push-Up", ["none"]],
    ["Incline Push-Up", ["bench"]],
    ["Deficit Push-Up", ["parallettes"]],
    ["Chest Dip", ["dip bars"]],
  ], {
    primary: ["pectorals"],
    secondary: ["front delts", "triceps", "core"],
    description: "Own the body line while pressing the floor or bars away under control.",
    cues: ["Brace the abs before each rep.", "Lower as one unit.", "Finish by actively pushing the floor away."],
    defaultSets: 3,
    defaultReps: "8-15",
    defaultRestSeconds: 60,
  }),
  ...createBlueprints("back", "strength", "pull", [
    ["Wide-Grip Lat Pulldown", ["cable"]],
    ["Neutral-Grip Lat Pulldown", ["cable"]],
    ["Assisted Pull-Up", ["machine"]],
    ["Close-Grip Pulldown", ["cable"]],
    ["Straight-Arm Pulldown", ["cable"]],
  ], {
    primary: ["lats"],
    secondary: ["mid back", "biceps"],
    description: "Pull the elbows to the ribs and keep the chest lifted without overextending the low back.",
    cues: ["Lead with the elbows.", "Avoid shrugging into the ears.", "Pause with the bar near the collarbone."],
    defaultSets: 4,
    defaultReps: "8-12",
    defaultRestSeconds: 75,
  }),
  ...createBlueprints("back", "strength", "row", [
    ["Barbell Row", ["barbell"]],
    ["Pendlay Row", ["barbell"]],
    ["Seated Cable Row", ["cable"]],
    ["Chest-Supported Row", ["dumbbells", "bench"]],
    ["Single-Arm Dumbbell Row", ["dumbbells", "bench"]],
  ], {
    primary: ["mid back"],
    secondary: ["lats", "rear delts", "biceps"],
    description: "Brace the trunk and row by driving the elbows behind the torso.",
    cues: ["Lock the torso before pulling.", "Keep the wrists neutral.", "Squeeze the shoulder blades together."],
    defaultSets: 4,
    defaultReps: "6-12",
    defaultRestSeconds: 75,
  }),
  ...createBlueprints("back", "bodyweight", "pull", [
    ["Pull-Up", ["pull-up bar"]],
    ["Chin-Up", ["pull-up bar"]],
    ["Inverted Row", ["bar", "rack"]],
  ], {
    primary: ["lats"],
    secondary: ["biceps", "mid back", "core"],
    description: "Keep the ribs down and pull the torso to the bar with full-body tension.",
    cues: ["Start from a dead hang.", "Drive elbows down.", "Avoid kicking through the rep."],
    defaultSets: 3,
    defaultReps: "5-10",
    defaultRestSeconds: 90,
  }),
  ...createBlueprints("shoulders", "strength", "press", [
    ["Standing Overhead Press", ["barbell"]],
    ["Seated Dumbbell Press", ["dumbbells", "bench"]],
    ["Arnold Press", ["dumbbells"]],
    ["Landmine Press", ["landmine"]],
    ["Machine Shoulder Press", ["machine"]],
  ], {
    primary: ["front delts"],
    secondary: ["side delts", "triceps", "upper chest"],
    description: "Press overhead through a stacked torso and finish with the biceps near the ears.",
    cues: ["Squeeze the glutes to stay tall.", "Keep forearms vertical.", "Move the head through at lockout."],
    defaultSets: 4,
    defaultReps: "6-10",
    defaultRestSeconds: 90,
  }),
  ...createBlueprints("shoulders", "strength", "raise", [
    ["Dumbbell Lateral Raise", ["dumbbells"]],
    ["Cable Lateral Raise", ["cable"]],
    ["Bent-Over Rear Delt Raise", ["dumbbells"]],
    ["Front Raise", ["plate"]],
    ["Face Pull", ["cable"]],
    ["Upright Row", ["barbell"]],
    ["Y-Raise", ["bench", "dumbbells"]],
    ["Reverse Pec Deck", ["machine"]],
  ], {
    primary: ["side delts"],
    secondary: ["rear delts", "upper traps"],
    description: "Float the arms away from the body without shrugging the shoulders up.",
    cues: ["Lead with the elbows.", "Keep the neck relaxed.", "Control the lowering phase."],
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
  }),
  ...createBlueprints("arms", "strength", "curl", [
    ["Barbell Curl", ["barbell"]],
    ["EZ-Bar Curl", ["ez bar"]],
    ["Alternating Dumbbell Curl", ["dumbbells"]],
    ["Hammer Curl", ["dumbbells"]],
    ["Preacher Curl", ["ez bar", "bench"]],
    ["Cable Curl", ["cable"]],
  ], {
    primary: ["biceps"],
    secondary: ["forearms"],
    description: "Flex the elbow hard while keeping the upper arm quiet and the torso still.",
    cues: ["Stay tall through the chest.", "Do not swing the hips.", "Squeeze at the top."],
    defaultSets: 3,
    defaultReps: "8-14",
    defaultRestSeconds: 60,
  }),
  ...createBlueprints("arms", "strength", "extension", [
    ["Cable Triceps Pressdown", ["cable"]],
    ["Overhead Rope Extension", ["cable"]],
    ["Skull Crusher", ["ez bar", "bench"]],
    ["Close-Grip Bench Press", ["barbell", "bench"]],
    ["Dumbbell Kickback", ["dumbbells", "bench"]],
    ["Bench Dip", ["bench"]],
    ["Single-Arm Cable Extension", ["cable"]],
  ], {
    primary: ["triceps"],
    secondary: ["front delts"],
    description: "Lock the elbow in place and drive extension to finish with a full triceps squeeze.",
    cues: ["Pin the elbows close.", "Move only through the elbow joint.", "Control the return."],
    defaultSets: 3,
    defaultReps: "10-15",
    defaultRestSeconds: 60,
  }),
  ...createBlueprints("legs", "strength", "squat", [
    ["Back Squat", ["barbell", "rack"]],
    ["Front Squat", ["barbell", "rack"]],
    ["Goblet Squat", ["dumbbell"]],
    ["Hack Squat", ["machine"]],
    ["Leg Press", ["machine"]],
    ["Bulgarian Split Squat", ["dumbbells", "bench"]],
  ], {
    primary: ["quads"],
    secondary: ["glutes", "core"],
    description: "Sit between the hips with the feet rooted and stand by driving through the full foot.",
    cues: ["Brace before the descent.", "Track knees over toes.", "Finish with hips and ribs stacked."],
    defaultSets: 4,
    defaultReps: "6-12",
    defaultRestSeconds: 90,
  }),
  ...createBlueprints("legs", "strength", "hinge", [
    ["Romanian Deadlift", ["barbell"]],
    ["Trap Bar Deadlift", ["trap bar"]],
    ["Stiff-Leg Deadlift", ["barbell"]],
    ["Good Morning", ["barbell"]],
    ["Hip Thrust", ["barbell", "bench"]],
    ["Glute Bridge", ["barbell"]],
  ], {
    primary: ["hamstrings"],
    secondary: ["glutes", "low back"],
    description: "Load the posterior chain by pushing the hips back while keeping the spine long.",
    cues: ["Unlock the knees slightly.", "Keep the bar close to the legs.", "Stand tall by squeezing the glutes."],
    defaultSets: 4,
    defaultReps: "6-10",
    defaultRestSeconds: 90,
  }),
  ...createBlueprints("legs", "strength", "lunge", [
    ["Walking Lunge", ["dumbbells"]],
    ["Reverse Lunge", ["dumbbells"]],
    ["Step-Up", ["dumbbells", "box"]],
    ["Curtsy Lunge", ["dumbbells"]],
  ], {
    primary: ["glutes"],
    secondary: ["quads", "hamstrings"],
    description: "Stay tall through the torso and push the floor away to return from each stride.",
    cues: ["Land softly.", "Drive through the front heel.", "Keep the pelvis level."],
    defaultSets: 3,
    defaultReps: "8-12 / side",
    defaultRestSeconds: 75,
  }),
  ...createBlueprints("core", "bodyweight", "crunch", [
    ["Crunch", ["mat"]],
    ["Reverse Crunch", ["mat"]],
    ["V-Up", ["mat"]],
    ["Hollow Body Rock", ["mat"]],
  ], {
    primary: ["abs"],
    secondary: ["hip flexors"],
    description: "Curl the rib cage toward the pelvis without yanking on the neck.",
    cues: ["Exhale into the contraction.", "Keep the low back controlled.", "Avoid using momentum."],
    defaultSets: 3,
    defaultReps: "12-20",
    defaultRestSeconds: 45,
  }),
  ...createBlueprints("core", "bodyweight", "rotation", [
    ["Russian Twist", ["medicine ball"]],
    ["Dead Bug", ["none"]],
    ["Bicycle Crunch", ["mat"]],
    ["Mountain Climber", ["none"]],
  ], {
    primary: ["obliques"],
    secondary: ["abs", "hip flexors"],
    description: "Rotate or resist rotation while keeping the lower trunk locked in place.",
    cues: ["Move from the trunk, not the shoulders alone.", "Keep breathing through the reps.", "Stay long through the spine."],
    defaultSets: 3,
    defaultReps: "20 total",
    defaultRestSeconds: 45,
  }),
  ...createBlueprints("core", "bodyweight", "plank", [
    ["Front Plank", ["none"]],
    ["Side Plank", ["none"]],
    ["Bear Crawl Hold", ["none"]],
    ["Plank Shoulder Tap", ["none"]],
    ["Hanging Knee Raise", ["pull-up bar"]],
  ], {
    primary: ["core"],
    secondary: ["shoulders", "glutes"],
    description: "Create full-body tension and hold a rigid trunk against gravity.",
    cues: ["Tuck the ribs and pelvis together.", "Push the floor away.", "Breathe behind the brace."],
    defaultSets: 3,
    defaultReps: "30-45 sec",
    defaultRestSeconds: 45,
  }),
  ...createBlueprints("cardio", "cardio", "run", [
    ["Treadmill Run", ["treadmill"]],
    ["Air Bike Sprint", ["air bike"]],
    ["Rowing Sprint", ["rower"]],
    ["Jump Rope", ["jump rope"]],
    ["Battle Rope Waves", ["battle ropes"]],
    ["Shuttle Run", ["cones"]],
    ["Farmer Carry March", ["kettlebells"]],
    ["Stair Climber Push", ["stair climber"]],
    ["Assault Runner Push", ["runner"]],
    ["Cycling Sprint", ["bike"]],
    ["Sled Push", ["sled"]],
    ["Sled Pull", ["sled"]],
    ["Shadow Boxing Intervals", ["none"]],
  ], {
    primary: ["conditioning"],
    secondary: ["legs", "core", "shoulders"],
    description: "Move with rhythm and posture while sustaining repeatable output.",
    cues: ["Stay tall through the trunk.", "Relax the jaw and shoulders.", "Match the pace to the interval target."],
    defaultSets: 8,
    defaultReps: "20-60 sec",
    defaultRestSeconds: 40,
  }),
  ...createBlueprints("plyo", "plyo", "jump", [
    ["Box Jump", ["box"]],
    ["Broad Jump", ["none"]],
    ["Jump Squat", ["none"]],
    ["Skater Hop", ["none"]],
    ["Split Jump", ["none"]],
    ["Lateral Bound", ["none"]],
    ["Depth Jump", ["box"]],
    ["Tuck Jump", ["none"]],
    ["Pogo Hop", ["none"]],
    ["Burpee", ["none"]],
    ["Medicine Ball Slam", ["medicine ball"]],
    ["Rotational Med Ball Throw", ["medicine ball", "wall"]],
    ["Kettlebell Swing", ["kettlebell"]],
  ], {
    primary: ["power"],
    secondary: ["glutes", "quads", "calves", "core"],
    description: "Produce force explosively, land quietly, and reset for repeatable power output.",
    cues: ["Load the hips before takeoff.", "Drive the arms with intent.", "Stick the landing softly."],
    defaultSets: 4,
    defaultReps: "5-10",
    defaultRestSeconds: 75,
  }),
];

function createBlueprints(
  category: ExerciseCategory,
  type: ExerciseType,
  movement: Blueprint["movement"],
  items: Array<[string, string[]]>,
  defaults: Omit<Blueprint, "name" | "category" | "type" | "equipment" | "movement">,
): Blueprint[] {
  return items.map(([name, equipment]) => ({
    name,
    category,
    type,
    equipment,
    movement,
    ...defaults,
  }));
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function figurePose(movement: Blueprint["movement"], phase: "start" | "end") {
  const end = phase === "end";

  switch (movement) {
    case "press":
      return {
        leftArm: end ? "M72 102 L48 56" : "M72 102 L50 82",
        rightArm: end ? "M120 102 L144 56" : "M120 102 L142 82",
        leftLeg: "M84 132 L76 182",
        rightLeg: "M108 132 L116 182",
        torso: "M96 72 L96 132",
        arrow: "M42 78 C52 58, 62 44, 74 30",
      };
    case "fly":
      return {
        leftArm: end ? "M72 102 L58 72" : "M72 102 L28 94",
        rightArm: end ? "M120 102 L134 72" : "M120 102 L164 94",
        leftLeg: "M84 132 L76 182",
        rightLeg: "M108 132 L116 182",
        torso: "M96 72 L96 132",
        arrow: "M36 100 C54 92, 66 84, 78 72",
      };
    case "pushup":
      return {
        leftArm: end ? "M64 108 L92 124" : "M68 112 L88 118",
        rightArm: end ? "M128 108 L100 124" : "M124 112 L104 118",
        leftLeg: "M92 124 L58 164",
        rightLeg: "M100 124 L138 164",
        torso: "M64 108 L128 108",
        arrow: "M148 94 C132 102, 118 110, 104 118",
      };
    case "pull":
      return {
        leftArm: end ? "M72 100 L62 72" : "M72 100 L46 62",
        rightArm: end ? "M120 100 L130 72" : "M120 100 L146 62",
        leftLeg: "M84 130 L76 182",
        rightLeg: "M108 130 L116 182",
        torso: "M96 70 L96 130",
        arrow: "M48 60 C64 74, 74 84, 84 92",
      };
    case "row":
      return {
        leftArm: end ? "M70 106 L54 94" : "M70 106 L40 112",
        rightArm: end ? "M122 106 L138 94" : "M122 106 L152 112",
        leftLeg: "M84 132 L70 184",
        rightLeg: "M108 132 L120 184",
        torso: "M96 74 L96 132",
        arrow: "M150 112 C134 110, 122 104, 108 96",
      };
    case "squat":
      return {
        leftArm: "M72 100 L52 92",
        rightArm: "M120 100 L140 92",
        leftLeg: end ? "M84 132 L66 170" : "M84 132 L74 184",
        rightLeg: end ? "M108 132 L126 170" : "M108 132 L118 184",
        torso: end ? "M96 76 L92 132" : "M96 72 L96 132",
        arrow: "M148 98 C136 118, 122 138, 104 156",
      };
    case "hinge":
      return {
        leftArm: "M72 104 L54 134",
        rightArm: "M120 104 L138 134",
        leftLeg: "M84 132 L78 182",
        rightLeg: "M108 132 L114 182",
        torso: end ? "M96 74 L118 130" : "M96 72 L96 132",
        arrow: "M140 74 C122 82, 112 96, 110 114",
      };
    case "lunge":
      return {
        leftArm: "M72 100 L48 114",
        rightArm: "M120 100 L144 114",
        leftLeg: end ? "M84 132 L66 180" : "M84 132 L76 182",
        rightLeg: end ? "M108 132 L138 160" : "M108 132 L116 182",
        torso: "M96 72 L96 132",
        arrow: "M44 154 C60 148, 72 142, 86 136",
      };
    case "curl":
      return {
        leftArm: end ? "M72 100 L70 70" : "M72 100 L56 132",
        rightArm: end ? "M120 100 L122 70" : "M120 100 L136 132",
        leftLeg: "M84 132 L76 182",
        rightLeg: "M108 132 L116 182",
        torso: "M96 72 L96 132",
        arrow: "M48 132 C54 112, 62 94, 70 80",
      };
    case "extension":
      return {
        leftArm: end ? "M72 100 L58 64" : "M72 100 L58 88",
        rightArm: end ? "M120 100 L134 64" : "M120 100 L134 88",
        leftLeg: "M84 132 L76 182",
        rightLeg: "M108 132 L116 182",
        torso: "M96 72 L96 132",
        arrow: "M44 86 C50 72, 54 62, 60 52",
      };
    case "raise":
      return {
        leftArm: end ? "M72 100 L34 84" : "M72 100 L52 116",
        rightArm: end ? "M120 100 L158 84" : "M120 100 L140 116",
        leftLeg: "M84 132 L76 182",
        rightLeg: "M108 132 L116 182",
        torso: "M96 72 L96 132",
        arrow: "M40 116 C48 102, 58 92, 72 84",
      };
    case "carry":
    case "run":
      return {
        leftArm: end ? "M72 100 L52 126" : "M72 100 L48 82",
        rightArm: end ? "M120 100 L144 82" : "M120 100 L140 126",
        leftLeg: end ? "M84 132 L70 184" : "M84 132 L62 172",
        rightLeg: end ? "M108 132 L132 170" : "M108 132 L118 184",
        torso: "M96 72 L96 132",
        arrow: "M24 92 C54 74, 92 68, 128 72",
      };
    case "crunch":
      return {
        leftArm: end ? "M78 112 L58 96" : "M70 114 L46 118",
        rightArm: end ? "M114 112 L134 96" : "M122 114 L146 118",
        leftLeg: "M90 128 L60 162",
        rightLeg: "M102 128 L132 162",
        torso: end ? "M86 86 L98 128" : "M96 86 L96 128",
        arrow: "M144 118 C126 110, 112 104, 98 96",
      };
    case "rotation":
      return {
        leftArm: end ? "M72 100 L44 88" : "M72 100 L56 80",
        rightArm: end ? "M120 100 L146 118" : "M120 100 L136 80",
        leftLeg: "M84 132 L76 182",
        rightLeg: "M108 132 L116 182",
        torso: end ? "M96 72 L104 132" : "M96 72 L88 132",
        arrow: "M48 70 C76 52, 112 52, 140 70",
      };
    case "plank":
      return {
        leftArm: "M64 108 L88 124",
        rightArm: "M128 108 L104 124",
        leftLeg: "M88 124 L52 164",
        rightLeg: "M104 124 L140 164",
        torso: "M64 108 L128 108",
        arrow: "M148 102 C136 96, 122 94, 108 96",
      };
    case "jump":
      return {
        leftArm: end ? "M72 98 L48 60" : "M72 102 L52 116",
        rightArm: end ? "M120 98 L144 60" : "M120 102 L140 116",
        leftLeg: end ? "M84 132 L68 170" : "M84 132 L68 160",
        rightLeg: end ? "M108 132 L124 170" : "M108 132 L124 160",
        torso: end ? "M96 68 L96 126" : "M96 76 L96 132",
        arrow: "M32 150 C64 122, 88 86, 104 42",
      };
  }
}

function muscleHighlights(category: ExerciseCategory) {
  const common = {
    stroke: "rgba(125, 211, 252, 0.65)",
    fill: "rgba(34, 197, 94, 0.24)",
  };

  const elements: Record<ExerciseCategory, string> = {
    chest: `<ellipse cx="82" cy="92" rx="12" ry="14" fill="${common.fill}" /><ellipse cx="110" cy="92" rx="12" ry="14" fill="${common.fill}" />`,
    back: `<ellipse cx="82" cy="96" rx="12" ry="18" fill="${common.fill}" /><ellipse cx="110" cy="96" rx="12" ry="18" fill="${common.fill}" />`,
    shoulders: `<circle cx="72" cy="98" r="10" fill="${common.fill}" /><circle cx="120" cy="98" r="10" fill="${common.fill}" />`,
    arms: `<ellipse cx="58" cy="118" rx="9" ry="14" fill="${common.fill}" /><ellipse cx="134" cy="118" rx="9" ry="14" fill="${common.fill}" />`,
    legs: `<ellipse cx="82" cy="152" rx="11" ry="24" fill="${common.fill}" /><ellipse cx="110" cy="152" rx="11" ry="24" fill="${common.fill}" />`,
    core: `<rect x="78" y="90" width="36" height="36" rx="12" fill="${common.fill}" />`,
    cardio: `<ellipse cx="82" cy="152" rx="11" ry="24" fill="${common.fill}" /><ellipse cx="110" cy="152" rx="11" ry="24" fill="${common.fill}" /><rect x="82" y="90" width="28" height="34" rx="12" fill="rgba(125,211,252,0.18)" />`,
    plyo: `<ellipse cx="82" cy="152" rx="11" ry="24" fill="${common.fill}" /><ellipse cx="110" cy="152" rx="11" ry="24" fill="${common.fill}" /><rect x="78" y="90" width="36" height="36" rx="12" fill="rgba(249,115,22,0.2)" />`,
  };

  return `<g stroke="${common.stroke}" stroke-width="2">${elements[category]}</g>`;
}

function buildDiagram(name: string, category: ExerciseCategory, movement: Blueprint["movement"], phase: "start" | "end") {
  const pose = figurePose(movement, phase);
  const label = phase === "start" ? "Start Position" : "End Position";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" role="img" aria-label="${name} ${label}">
      <defs>
        <marker id="arrow-${phase}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#7dd3fc" />
        </marker>
      </defs>
      <rect width="192" height="192" rx="28" fill="#081121" />
      <rect x="12" y="12" width="168" height="168" rx="24" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(148, 163, 184, 0.2)" />
      <text x="22" y="34" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="12" letter-spacing="1.5">${label.toUpperCase()}</text>
      <text x="22" y="52" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="11">${name}</text>
      ${muscleHighlights(category)}
      <circle cx="96" cy="54" r="14" fill="#f8fafc" />
      <path d="${pose.torso}" fill="none" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
      <path d="${pose.leftArm}" fill="none" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
      <path d="${pose.rightArm}" fill="none" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
      <path d="${pose.leftLeg}" fill="none" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
      <path d="${pose.rightLeg}" fill="none" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" />
      <path d="${pose.arrow}" fill="none" stroke="#7dd3fc" stroke-width="4" stroke-linecap="round" marker-end="url(#arrow-${phase})" />
      <line x1="24" y1="180" x2="168" y2="180" stroke="rgba(148, 163, 184, 0.2)" stroke-width="2" stroke-dasharray="6 6" />
    </svg>
  `.trim();
}

export const exerciseCatalog: Exercise[] = catalogBlueprints.map((blueprint) => {
  const muscleGroups = [...blueprint.primary, ...blueprint.secondary];

  return {
    id: slugify(blueprint.name),
    name: blueprint.name,
    description: blueprint.description,
    category: blueprint.category,
    muscleGroups,
    equipment: blueprint.equipment,
    type: blueprint.type,
    diagrams: [
      buildDiagram(blueprint.name, blueprint.category, blueprint.movement, "start"),
      buildDiagram(blueprint.name, blueprint.category, blueprint.movement, "end"),
    ],
    cues: blueprint.cues,
    defaultSets: blueprint.defaultSets,
    defaultReps: blueprint.defaultReps,
    defaultRestSeconds: blueprint.defaultRestSeconds,
  };
});

export const exerciseCategories: ExerciseCategory[] = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "core",
  "cardio",
  "plyo",
];

export const equipmentOptions = Array.from(
  new Set(exerciseCatalog.flatMap((exercise) => exercise.equipment)),
).sort();
