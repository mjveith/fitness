import { z } from "zod";

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const numericValueSchema = z.union([z.number(), z.string().trim().regex(/^-?\d+(?:\.\d+)?$/, "Expected numeric value")]);
const optionalNumericValueSchema = z.union([numericValueSchema, z.literal("")]).optional();
const formScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const formValueSchema = z.union([formScalarSchema, z.array(formScalarSchema)]);
const stringArrayFromFormValueSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value : value === undefined ? value : [value]),
  z.array(z.string().trim().min(1)).min(1),
);
const exerciseTypeArrayFromFormValueSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value : value === undefined ? value : [value]),
  z.array(z.enum(["strength", "bodyweight", "cardio", "plyo"])).min(1),
);

function getFirstValue(log: Record<string, unknown>, key: string) {
  const value = log[key];
  return Array.isArray(value) ? value[0] : value;
}

function isNumericLike(value: unknown) {
  return optionalNumericValueSchema.safeParse(value).success;
}

export const offlineLogSchema = z
  .object({
    date: dateStringSchema,
    dayName: z.string().trim().min(1),
    weekStartDate: dateStringSchema,
    planId: z.string().optional(),
    durationMinutes: numericValueSchema,
    sessionNotes: z.string().optional(),
    exerciseId: stringArrayFromFormValueSchema,
    exerciseName: stringArrayFromFormValueSchema,
    exerciseType: exerciseTypeArrayFromFormValueSchema,
  })
  .catchall(formValueSchema)
  .superRefine((log, context) => {
    if (log.exerciseName.length !== log.exerciseId.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exerciseName"],
        message: "exerciseName must match exerciseId length",
      });
    }

    if (log.exerciseType.length !== log.exerciseId.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exerciseType"],
        message: "exerciseType must match exerciseId length",
      });
    }

    for (const exerciseId of log.exerciseId) {
      const setCountValue = getFirstValue(log, `${exerciseId}-setCount`);
      const setCountResult = z.coerce.number().int().min(0).safeParse(setCountValue);
      if (!setCountResult.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`${exerciseId}-setCount`],
          message: "Expected non-negative integer set count",
        });
        continue;
      }

      const completedValue = getFirstValue(log, `${exerciseId}-completed`);
      if (completedValue !== undefined && completedValue !== "true" && completedValue !== "false" && typeof completedValue !== "boolean") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`${exerciseId}-completed`],
          message: "Expected boolean completion value",
        });
      }

      const statusValue = getFirstValue(log, `${exerciseId}-status`);
      if (statusValue !== undefined && !["completed", "skipped", "removed"].includes(String(statusValue))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`${exerciseId}-status`],
          message: "Expected completed, skipped, or removed status",
        });
      }

      for (let setIndex = 0; setIndex < setCountResult.data; setIndex += 1) {
        for (const field of ["reps", "weight", "duration"] as const) {
          const key = `${exerciseId}-${setIndex}-${field}`;
          const value = getFirstValue(log, key);
          if (value !== undefined && !isNumericLike(value)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: [key],
              message: "Expected numeric value",
            });
          }
        }
      }
    }
  });

export const offlineLogsSyncPayloadSchema = z.object({
  logs: z.array(offlineLogSchema),
});

export const swapPayloadSchema = z.object({
  weekStartDate: dateStringSchema,
  dayIndex: z.number().int().min(0),
  exerciseIndex: z.number().int().min(0),
  newExerciseId: z.string().trim().min(1),
});

export type OfflineLogPayload = z.infer<typeof offlineLogSchema>;
export type OfflineLogsSyncPayload = z.infer<typeof offlineLogsSyncPayloadSchema>;
export type SwapPayload = z.infer<typeof swapPayloadSchema>;
