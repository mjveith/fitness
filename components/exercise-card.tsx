import Link from "next/link";
import { Exercise } from "@/lib/types";

export function ExerciseCard({ exercise, view = "grid" }: { exercise: Exercise; view?: "grid" | "list" }) {
  const body = (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
        {exercise.imageUrls?.[0] ? (
          <img
            src={exercise.imageUrls[0]}
            alt={`${exercise.name} start position example`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: exercise.diagrams[0] }} />
        )}
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-sky-300">{exercise.category}</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-50">{exercise.name}</h2>
        </div>
        <p className="text-sm leading-6 text-slate-300">{exercise.description}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs text-sky-100">{exercise.type}</span>
          {exercise.equipment.slice(0, 2).map((item) => (
            <span key={item} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {item}
            </span>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <Link
      href={`/exercises/${exercise.id}`}
      className={
        view === "list"
          ? "glass-panel grid grid-cols-[7rem_1fr] gap-4 rounded-3xl p-4"
          : "glass-panel grid gap-4 rounded-3xl p-4"
      }
    >
      {body}
    </Link>
  );
}
