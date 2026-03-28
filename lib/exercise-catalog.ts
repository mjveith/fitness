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

type Point = {
  x: number;
  y: number;
};

type Pose = {
  head: Point;
  neck: Point;
  shoulderLeft: Point;
  shoulderRight: Point;
  elbowLeft: Point;
  elbowRight: Point;
  wristLeft: Point;
  wristRight: Point;
  hipLeft: Point;
  hipRight: Point;
  kneeLeft: Point;
  kneeRight: Point;
  ankleLeft: Point;
  ankleRight: Point;
  arrow: string;
};

function point(x: number, y: number): Point {
  return { x, y };
}

function figurePose(movement: Blueprint["movement"], phase: "start" | "end"): Pose {
  const end = phase === "end";
  const standing: Pose = {
    head: point(100, 35),
    neck: point(100, 52),
    shoulderLeft: point(79, 64),
    shoulderRight: point(121, 64),
    elbowLeft: point(65, 96),
    elbowRight: point(135, 96),
    wristLeft: point(58, 130),
    wristRight: point(142, 130),
    hipLeft: point(87, 116),
    hipRight: point(113, 116),
    kneeLeft: point(84, 155),
    kneeRight: point(116, 155),
    ankleLeft: point(81, 193),
    ankleRight: point(119, 193),
    arrow: "M36 104 C58 92, 72 80, 84 66",
  };

  switch (movement) {
    case "press":
      return {
        ...standing,
        elbowLeft: end ? point(74, 48) : point(68, 88),
        elbowRight: end ? point(126, 48) : point(132, 88),
        wristLeft: end ? point(76, 20) : point(72, 58),
        wristRight: end ? point(124, 20) : point(128, 58),
        arrow: "M58 88 C66 64, 70 42, 76 24",
      };
    case "fly":
      return {
        ...standing,
        elbowLeft: end ? point(66, 88) : point(38, 90),
        elbowRight: end ? point(134, 88) : point(162, 90),
        wristLeft: end ? point(78, 76) : point(20, 104),
        wristRight: end ? point(122, 76) : point(180, 104),
        arrow: "M26 110 C48 100, 64 88, 78 72",
      };
    case "pushup":
      return {
        head: point(44, 94),
        neck: point(58, 102),
        shoulderLeft: point(74, 110),
        shoulderRight: point(104, 110),
        elbowLeft: end ? point(66, 123) : point(76, 118),
        elbowRight: end ? point(92, 123) : point(102, 118),
        wristLeft: point(63, 142),
        wristRight: point(89, 142),
        hipLeft: point(129, end ? 108 : 118),
        hipRight: point(149, end ? 108 : 118),
        kneeLeft: point(162, end ? 110 : 124),
        kneeRight: point(176, end ? 110 : 124),
        ankleLeft: point(184, end ? 112 : 126),
        ankleRight: point(194, end ? 112 : 126),
        arrow: "M154 98 C138 108, 120 118, 102 126",
      };
    case "pull":
      return {
        ...standing,
        elbowLeft: end ? point(74, 78) : point(54, 86),
        elbowRight: end ? point(126, 78) : point(146, 86),
        wristLeft: end ? point(70, 44) : point(38, 54),
        wristRight: end ? point(130, 44) : point(162, 54),
        arrow: "M42 54 C56 70, 68 82, 80 92",
      };
    case "row":
      return {
        ...standing,
        head: point(96, 39),
        neck: point(98, 57),
        shoulderLeft: point(78, 73),
        shoulderRight: point(118, 77),
        elbowLeft: end ? point(65, 104) : point(44, 110),
        elbowRight: end ? point(133, 108) : point(154, 114),
        wristLeft: end ? point(81, 114) : point(24, 116),
        wristRight: end ? point(117, 118) : point(174, 120),
        hipLeft: point(90, 116),
        hipRight: point(116, 120),
        kneeLeft: point(82, 156),
        kneeRight: point(114, 158),
        ankleLeft: point(74, 193),
        ankleRight: point(122, 195),
        arrow: "M170 118 C146 118, 126 112, 108 104",
      };
    case "squat":
      return {
        ...standing,
        shoulderLeft: end ? point(77, 72) : standing.shoulderLeft,
        shoulderRight: end ? point(119, 72) : standing.shoulderRight,
        hipLeft: end ? point(88, 128) : standing.hipLeft,
        hipRight: end ? point(112, 128) : standing.hipRight,
        kneeLeft: end ? point(72, 162) : standing.kneeLeft,
        kneeRight: end ? point(128, 162) : standing.kneeRight,
        ankleLeft: end ? point(70, 194) : standing.ankleLeft,
        ankleRight: end ? point(130, 194) : standing.ankleRight,
        elbowLeft: point(61, 95),
        elbowRight: point(139, 95),
        wristLeft: point(42, 88),
        wristRight: point(158, 88),
        arrow: "M156 104 C144 128, 128 148, 108 166",
      };
    case "hinge":
      return {
        ...standing,
        head: end ? point(114, 42) : standing.head,
        neck: end ? point(112, 58) : standing.neck,
        shoulderLeft: end ? point(93, 71) : standing.shoulderLeft,
        shoulderRight: end ? point(129, 75) : standing.shoulderRight,
        elbowLeft: end ? point(86, 106) : point(67, 105),
        elbowRight: end ? point(138, 112) : point(133, 105),
        wristLeft: end ? point(84, 140) : point(60, 139),
        wristRight: end ? point(140, 146) : point(140, 139),
        hipLeft: point(90, 118),
        hipRight: point(116, 118),
        kneeLeft: point(86, 156),
        kneeRight: point(114, 156),
        ankleLeft: point(82, 193),
        ankleRight: point(118, 193),
        arrow: "M148 72 C126 80, 114 96, 112 118",
      };
    case "lunge":
      return {
        ...standing,
        kneeLeft: end ? point(78, 156) : standing.kneeLeft,
        kneeRight: end ? point(138, 140) : standing.kneeRight,
        ankleLeft: end ? point(74, 194) : standing.ankleLeft,
        ankleRight: end ? point(160, 168) : standing.ankleRight,
        hipLeft: end ? point(90, 122) : standing.hipLeft,
        hipRight: end ? point(114, 122) : standing.hipRight,
        elbowLeft: point(64, 101),
        elbowRight: point(136, 101),
        wristLeft: point(44, 118),
        wristRight: point(156, 118),
        arrow: "M46 162 C62 156, 76 148, 90 140",
      };
    case "curl":
      return {
        ...standing,
        elbowLeft: point(69, 96),
        elbowRight: point(131, 96),
        wristLeft: end ? point(78, 64) : point(57, 132),
        wristRight: end ? point(122, 64) : point(143, 132),
        arrow: "M48 132 C56 112, 66 90, 78 68",
      };
    case "extension":
      return {
        ...standing,
        elbowLeft: point(76, 82),
        elbowRight: point(124, 82),
        wristLeft: end ? point(66, 40) : point(68, 66),
        wristRight: end ? point(134, 40) : point(132, 66),
        arrow: "M54 74 C58 60, 62 48, 66 34",
      };
    case "raise":
      return {
        ...standing,
        elbowLeft: end ? point(46, 76) : point(61, 104),
        elbowRight: end ? point(154, 76) : point(139, 104),
        wristLeft: end ? point(24, 76) : point(42, 124),
        wristRight: end ? point(176, 76) : point(158, 124),
        arrow: "M38 124 C46 104, 56 88, 74 76",
      };
    case "carry":
    case "run":
      return {
        ...standing,
        elbowLeft: end ? point(64, 102) : point(61, 90),
        elbowRight: end ? point(139, 90) : point(136, 102),
        wristLeft: end ? point(52, 132) : point(46, 64),
        wristRight: end ? point(154, 64) : point(148, 132),
        hipLeft: point(88, 116),
        hipRight: point(112, 116),
        kneeLeft: end ? point(78, 150) : point(68, 163),
        kneeRight: end ? point(132, 163) : point(122, 150),
        ankleLeft: end ? point(72, 193) : point(58, 184),
        ankleRight: end ? point(144, 184) : point(128, 193),
        arrow: "M28 98 C56 78, 92 70, 136 72",
      };
    case "crunch":
      return {
        head: end ? point(90, 64) : point(100, 86),
        neck: end ? point(94, 80) : point(100, 102),
        shoulderLeft: end ? point(82, 92) : point(84, 114),
        shoulderRight: end ? point(106, 92) : point(116, 114),
        elbowLeft: end ? point(66, 104) : point(62, 124),
        elbowRight: end ? point(122, 104) : point(138, 124),
        wristLeft: end ? point(54, 96) : point(44, 128),
        wristRight: end ? point(134, 96) : point(156, 128),
        hipLeft: point(94, 128),
        hipRight: point(114, 128),
        kneeLeft: point(72, 156),
        kneeRight: point(136, 156),
        ankleLeft: point(58, 188),
        ankleRight: point(150, 188),
        arrow: "M154 124 C132 114, 114 102, 98 88",
      };
    case "rotation":
      return {
        ...standing,
        shoulderLeft: end ? point(84, 66) : point(74, 66),
        shoulderRight: end ? point(126, 62) : point(116, 62),
        hipLeft: end ? point(82, 116) : point(92, 116),
        hipRight: end ? point(108, 120) : point(118, 120),
        elbowLeft: end ? point(67, 92) : point(62, 88),
        elbowRight: end ? point(148, 102) : point(138, 84),
        wristLeft: end ? point(46, 84) : point(52, 60),
        wristRight: end ? point(168, 116) : point(146, 56),
        arrow: "M48 70 C78 52, 116 52, 148 72",
      };
    case "plank":
      return {
        head: point(44, 94),
        neck: point(58, 102),
        shoulderLeft: point(74, 110),
        shoulderRight: point(104, 110),
        elbowLeft: point(70, 132),
        elbowRight: point(94, 132),
        wristLeft: point(67, 144),
        wristRight: point(91, 144),
        hipLeft: point(129, 110),
        hipRight: point(149, 110),
        kneeLeft: point(162, 112),
        kneeRight: point(176, 112),
        ankleLeft: point(186, 114),
        ankleRight: point(196, 114),
        arrow: "M154 104 C138 100, 122 98, 106 100",
      };
    case "jump":
      return {
        ...standing,
        head: end ? point(100, 31) : standing.head,
        shoulderLeft: end ? point(79, 59) : standing.shoulderLeft,
        shoulderRight: end ? point(121, 59) : standing.shoulderRight,
        elbowLeft: end ? point(61, 70) : point(64, 102),
        elbowRight: end ? point(139, 70) : point(136, 102),
        wristLeft: end ? point(44, 48) : point(50, 126),
        wristRight: end ? point(156, 48) : point(150, 126),
        hipLeft: end ? point(88, 112) : standing.hipLeft,
        hipRight: end ? point(112, 112) : standing.hipRight,
        kneeLeft: end ? point(76, 150) : point(76, 150),
        kneeRight: end ? point(124, 150) : point(124, 150),
        ankleLeft: end ? point(64, 180) : point(68, 168),
        ankleRight: end ? point(136, 180) : point(132, 168),
        arrow: "M32 156 C60 128, 84 94, 100 48",
      };
  }
}

function lerp(a: Point, b: Point, t: number): Point {
  return point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
}

function torsoCenter(pose: Pose) {
  return point(
    (pose.shoulderLeft.x + pose.shoulderRight.x + pose.hipLeft.x + pose.hipRight.x) / 4,
    (pose.shoulderLeft.y + pose.shoulderRight.y + pose.hipLeft.y + pose.hipRight.y) / 4,
  );
}

function capsulePath(a: Point, b: Point, radius: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = (-dy / length) * radius;
  const ny = (dx / length) * radius;

  return [
    `M ${a.x + nx} ${a.y + ny}`,
    `Q ${b.x} ${b.y} ${b.x + nx} ${b.y + ny}`,
    `L ${b.x - nx} ${b.y - ny}`,
    `Q ${a.x} ${a.y} ${a.x - nx} ${a.y - ny}`,
    "Z",
  ].join(" ");
}

function torsoShell(pose: Pose) {
  const upperLeft = lerp(pose.shoulderLeft, pose.hipLeft, 0.18);
  const upperRight = lerp(pose.shoulderRight, pose.hipRight, 0.18);
  const lowerLeft = lerp(pose.hipLeft, pose.shoulderLeft, 0.08);
  const lowerRight = lerp(pose.hipRight, pose.shoulderRight, 0.08);

  return [
    `M ${pose.shoulderLeft.x} ${pose.shoulderLeft.y}`,
    `Q ${upperLeft.x} ${upperLeft.y} ${lowerLeft.x} ${lowerLeft.y}`,
    `L ${lowerRight.x} ${lowerRight.y}`,
    `Q ${upperRight.x} ${upperRight.y} ${pose.shoulderRight.x} ${pose.shoulderRight.y}`,
    `Q ${torsoCenter(pose).x} ${pose.neck.y + 12} ${pose.shoulderLeft.x} ${pose.shoulderLeft.y}`,
    "Z",
  ].join(" ");
}

function chestPath(pose: Pose) {
  const sternum = lerp(pose.neck, torsoCenter(pose), 0.72);
  const leftInner = lerp(pose.shoulderLeft, sternum, 0.4);
  const rightInner = lerp(pose.shoulderRight, sternum, 0.4);

  return [
    `M ${pose.shoulderLeft.x + 2} ${pose.shoulderLeft.y + 4}`,
    `Q ${leftInner.x} ${leftInner.y} ${sternum.x} ${sternum.y - 2}`,
    `Q ${rightInner.x} ${rightInner.y} ${pose.shoulderRight.x - 2} ${pose.shoulderRight.y + 4}`,
    `L ${sternum.x} ${sternum.y + 16}`,
    "Z",
  ].join(" ");
}

function latPath(pose: Pose, side: "left" | "right") {
  const shoulder = side === "left" ? pose.shoulderLeft : pose.shoulderRight;
  const hip = side === "left" ? pose.hipLeft : pose.hipRight;
  const center = torsoCenter(pose);
  const outer = side === "left" ? shoulder.x - 10 : shoulder.x + 10;
  const waist = side === "left" ? hip.x - 4 : hip.x + 4;

  return [
    `M ${shoulder.x} ${shoulder.y + 4}`,
    `Q ${outer} ${center.y - 6} ${waist} ${hip.y - 4}`,
    `L ${center.x} ${hip.y - 8}`,
    `Q ${center.x + (side === "left" ? -6 : 6)} ${center.y} ${shoulder.x} ${shoulder.y + 4}`,
    "Z",
  ].join(" ");
}

function glutePath(pose: Pose, side: "left" | "right") {
  const hip = side === "left" ? pose.hipLeft : pose.hipRight;
  const inner = side === "left" ? pose.hipLeft.x + 6 : pose.hipRight.x - 6;

  return [
    `M ${hip.x} ${hip.y - 2}`,
    `Q ${inner} ${hip.y + 10} ${hip.x + (side === "left" ? -8 : 8)} ${hip.y + 16}`,
    `Q ${hip.x + (side === "left" ? -10 : 10)} ${hip.y + 4} ${hip.x} ${hip.y - 2}`,
    "Z",
  ].join(" ");
}

function corePath(pose: Pose) {
  const upper = lerp(pose.neck, torsoCenter(pose), 0.72);
  const lower = lerp(point((pose.hipLeft.x + pose.hipRight.x) / 2, pose.hipLeft.y), upper, -0.18);

  return [
    `M ${upper.x - 10} ${upper.y}`,
    `L ${upper.x + 10} ${upper.y}`,
    `Q ${lower.x + 14} ${lower.y - 6} ${lower.x + 8} ${lower.y + 16}`,
    `L ${lower.x - 8} ${lower.y + 16}`,
    `Q ${lower.x - 14} ${lower.y - 6} ${upper.x - 10} ${upper.y}`,
    "Z",
  ].join(" ");
}

function obliquePath(pose: Pose, side: "left" | "right") {
  const shoulder = side === "left" ? pose.shoulderLeft : pose.shoulderRight;
  const hip = side === "left" ? pose.hipLeft : pose.hipRight;
  const inset = side === "left" ? 10 : -10;

  return [
    `M ${shoulder.x + inset * 0.2} ${shoulder.y + 18}`,
    `L ${hip.x + inset} ${hip.y - 2}`,
    `L ${hip.x + inset * 0.1} ${hip.y + 10}`,
    `L ${shoulder.x + inset * 0.55} ${shoulder.y + 28}`,
    "Z",
  ].join(" ");
}

function hipFlexorPath(pose: Pose, side: "left" | "right") {
  const hip = side === "left" ? pose.hipLeft : pose.hipRight;
  const knee = side === "left" ? pose.kneeLeft : pose.kneeRight;
  return capsulePath(point(hip.x, hip.y + 2), lerp(hip, knee, 0.28), 4);
}

function regionPath(region: string, pose: Pose) {
  switch (region) {
    case "chest":
    case "upper-chest":
      return chestPath(pose);
    case "front-delts":
    case "side-delts":
    case "rear-delts":
      return [
        capsulePath(pose.shoulderLeft, lerp(pose.elbowLeft, pose.shoulderLeft, 0.35), 7),
        capsulePath(pose.shoulderRight, lerp(pose.elbowRight, pose.shoulderRight, 0.35), 7),
      ].join("");
    case "lats":
      return `${latPath(pose, "left")}${latPath(pose, "right")}`;
    case "mid-back":
      return capsulePath(lerp(pose.neck, torsoCenter(pose), 0.35), lerp(torsoCenter(pose), point((pose.hipLeft.x + pose.hipRight.x) / 2, pose.hipLeft.y), 0.8), 10);
    case "biceps":
      return [
        capsulePath(pose.shoulderLeft, pose.elbowLeft, 6),
        capsulePath(pose.shoulderRight, pose.elbowRight, 6),
      ].join("");
    case "triceps":
      return [
        capsulePath(lerp(pose.shoulderLeft, pose.elbowLeft, 0.1), lerp(pose.shoulderLeft, pose.elbowLeft, 0.9), 5),
        capsulePath(lerp(pose.shoulderRight, pose.elbowRight, 0.1), lerp(pose.shoulderRight, pose.elbowRight, 0.9), 5),
      ].join("");
    case "forearms":
      return [
        capsulePath(pose.elbowLeft, pose.wristLeft, 4.5),
        capsulePath(pose.elbowRight, pose.wristRight, 4.5),
      ].join("");
    case "abs":
    case "core":
      return corePath(pose);
    case "obliques":
      return `${obliquePath(pose, "left")}${obliquePath(pose, "right")}`;
    case "hip-flexors":
      return `${hipFlexorPath(pose, "left")}${hipFlexorPath(pose, "right")}`;
    case "glutes":
      return `${glutePath(pose, "left")}${glutePath(pose, "right")}`;
    case "quads":
      return `${capsulePath(pose.hipLeft, pose.kneeLeft, 7)}${capsulePath(pose.hipRight, pose.kneeRight, 7)}`;
    case "hamstrings":
      return `${capsulePath(lerp(pose.hipLeft, pose.kneeLeft, 0.04), pose.kneeLeft, 6)}${capsulePath(lerp(pose.hipRight, pose.kneeRight, 0.04), pose.kneeRight, 6)}`;
    case "calves":
      return `${capsulePath(pose.kneeLeft, pose.ankleLeft, 5)}${capsulePath(pose.kneeRight, pose.ankleRight, 5)}`;
    case "low-back":
      return capsulePath(
        point((pose.hipLeft.x + pose.hipRight.x) / 2, pose.hipLeft.y - 2),
        point((pose.hipLeft.x + pose.hipRight.x) / 2, pose.hipLeft.y - 22),
        8,
      );
    default:
      return "";
  }
}

function resolveMuscleRegions(muscles: string[]) {
  const aliases: Record<string, string[]> = {
    pectorals: ["chest"],
    "front delts": ["front-delts"],
    "side delts": ["side-delts"],
    "rear delts": ["rear-delts"],
    shoulders: ["front-delts", "side-delts"],
    "upper chest": ["upper-chest"],
    lats: ["lats"],
    "mid back": ["mid-back"],
    biceps: ["biceps"],
    triceps: ["triceps"],
    forearms: ["forearms"],
    quads: ["quads"],
    glutes: ["glutes"],
    hamstrings: ["hamstrings"],
    calves: ["calves"],
    "low back": ["low-back"],
    abs: ["abs"],
    obliques: ["obliques"],
    "hip flexors": ["hip-flexors"],
    core: ["abs", "obliques"],
    conditioning: ["core", "quads", "calves"],
    legs: ["quads", "hamstrings", "calves"],
    power: ["glutes", "quads", "calves"],
  };

  return Array.from(
    new Set(
      muscles.flatMap((muscle) => aliases[muscle] ?? []),
    ),
  );
}

function muscleHighlights(pose: Pose, primary: string[], secondary: string[]) {
  const colors = {
    primary: "#7dd3fc",
    secondary: "#64748b",
  };

  const renderRegions = (regions: string[], fill: string, opacity: number) =>
    regions
      .map((region) => {
        const d = regionPath(region, pose);
        return d
          ? `<path d="${d}" fill="${fill}" fill-opacity="${opacity}" stroke="${fill}" stroke-opacity="${Math.min(opacity + 0.18, 0.8)}" stroke-width="1.25" vector-effect="non-scaling-stroke" />`
          : "";
      })
      .join("");

  return [
    `<g>${renderRegions(resolveMuscleRegions(secondary), colors.secondary, 0.42)}</g>`,
    `<g>${renderRegions(resolveMuscleRegions(primary), colors.primary, 0.72)}</g>`,
  ].join("");
}

function line(a: Point, b: Point) {
  return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
}

function joint(pointValue: Point, radius: number) {
  return `<circle cx="${pointValue.x}" cy="${pointValue.y}" r="${radius}" />`;
}

function buildDiagram(
  name: string,
  category: ExerciseCategory,
  movement: Blueprint["movement"],
  phase: "start" | "end",
  primary: string[],
  secondary: string[],
) {
  const pose = figurePose(movement, phase);
  const label = phase === "start" ? "Start Position" : "End Position";
  const animationName = `flow-${slugify(name)}-${phase}`;
  const headRadius = movement === "pushup" || movement === "plank" ? 10 : 14;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" role="img" aria-label="${name} ${label}" shape-rendering="geometricPrecision">
      <defs>
        <marker id="arrow-${slugify(name)}-${phase}" viewBox="0 0 14 14" refX="12" refY="7" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 14 7 L 0 14 z" fill="#7dd3fc" />
        </marker>
        <filter id="glow-${slugify(name)}-${phase}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <style>
        @keyframes ${animationName} {
          from { stroke-dashoffset: 26; }
          to { stroke-dashoffset: 0; }
        }
      </style>
      <rect width="200" height="220" rx="30" fill="#081121" />
      <rect x="12" y="12" width="176" height="196" rx="26" fill="rgba(15, 23, 42, 0.84)" stroke="rgba(148, 163, 184, 0.24)" />
      <text x="22" y="34" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="12" letter-spacing="1.5">${label.toUpperCase()}</text>
      <text x="22" y="52" fill="${category === "cardio" || category === "plyo" ? "#38bdf8" : "#7dd3fc"}" font-family="Arial, sans-serif" font-size="11">${name}</text>
      ${muscleHighlights(pose, primary, secondary)}
      <g fill="none" stroke="#f8fafc" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">
        <path d="${torsoShell(pose)}" fill="rgba(248, 250, 252, 0.08)" />
        ${line(pose.neck, point((pose.shoulderLeft.x + pose.shoulderRight.x) / 2, (pose.shoulderLeft.y + pose.shoulderRight.y) / 2))}
        ${line(pose.shoulderLeft, pose.elbowLeft)}
        ${line(pose.elbowLeft, pose.wristLeft)}
        ${line(pose.shoulderRight, pose.elbowRight)}
        ${line(pose.elbowRight, pose.wristRight)}
        ${line(pose.hipLeft, pose.kneeLeft)}
        ${line(pose.kneeLeft, pose.ankleLeft)}
        ${line(pose.hipRight, pose.kneeRight)}
        ${line(pose.kneeRight, pose.ankleRight)}
        ${line(pose.hipLeft, pose.hipRight)}
      </g>
      <circle cx="${pose.head.x}" cy="${pose.head.y}" r="${headRadius}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      <g fill="#cbd5e1" stroke="#f8fafc" stroke-width="1.5" vector-effect="non-scaling-stroke">
        ${joint(pose.shoulderLeft, 3.6)}
        ${joint(pose.shoulderRight, 3.6)}
        ${joint(pose.elbowLeft, 3.2)}
        ${joint(pose.elbowRight, 3.2)}
        ${joint(pose.hipLeft, 3.4)}
        ${joint(pose.hipRight, 3.4)}
        ${joint(pose.kneeLeft, 3.2)}
        ${joint(pose.kneeRight, 3.2)}
      </g>
      <path d="${pose.arrow}" fill="none" stroke="#7dd3fc" stroke-width="5.5" stroke-linecap="round" stroke-dasharray="8 8" marker-end="url(#arrow-${slugify(name)}-${phase})" filter="url(#glow-${slugify(name)}-${phase})" vector-effect="non-scaling-stroke" style="animation:${animationName} 1.1s linear infinite" />
      <line x1="24.5" y1="196.5" x2="175.5" y2="196.5" stroke="rgba(148, 163, 184, 0.26)" stroke-width="1.5" stroke-dasharray="6 7" vector-effect="non-scaling-stroke" />
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
      buildDiagram(
        blueprint.name,
        blueprint.category,
        blueprint.movement,
        "start",
        blueprint.primary,
        blueprint.secondary,
      ),
      buildDiagram(
        blueprint.name,
        blueprint.category,
        blueprint.movement,
        "end",
        blueprint.primary,
        blueprint.secondary,
      ),
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
