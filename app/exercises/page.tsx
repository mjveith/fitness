import { ExerciseCard } from "@/components/exercise-card";
import { SectionHeader } from "@/components/section-header";
import { equipmentOptions, exerciseCategories } from "@/lib/exercise-catalog";
import { listExercises } from "@/lib/db";

export default function ExercisesPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    category?: string;
    equipment?: string;
    type?: string;
    view?: "grid" | "list";
  };
}) {
  const view = searchParams.view === "list" ? "list" : "grid";
  const exercises = listExercises({
    query: searchParams.q,
    category: searchParams.category,
    equipment: searchParams.equipment,
    type: searchParams.type,
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Exercise Library"
        title="Exercises"
        description="Search by name and narrow the catalog by category, equipment, and training type."
      />
      <section className="glass-panel rounded-3xl p-4">
        <form className="grid gap-3">
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Search exercises"
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              name="category"
              defaultValue={searchParams.category ?? "all"}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
            >
              <option value="all">All categories</option>
              {exerciseCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              name="equipment"
              defaultValue={searchParams.equipment ?? "all"}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
            >
              <option value="all">All equipment</option>
              {equipmentOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={searchParams.type ?? "all"}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
            >
              <option value="all">All types</option>
              <option value="strength">Strength</option>
              <option value="bodyweight">Bodyweight</option>
              <option value="cardio">Cardio</option>
              <option value="plyo">Plyo</option>
            </select>
            <select
              name="view"
              defaultValue={view}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
            >
              <option value="grid">Grid view</option>
              <option value="list">List view</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Apply Filters
          </button>
        </form>
      </section>
      <section className={view === "list" ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
        {exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} view={view} />
        ))}
      </section>
    </div>
  );
}
