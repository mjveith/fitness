import type { CardioStatus } from "@/hooks/use-swap-state-persistence";

type CardioLogSectionProps = {
  cardioOptions: Array<{ id: string; name: string }>;
  cardioExerciseId: string;
  cardioDuration: string;
  cardioNotes: string;
  cardioStatus: CardioStatus;
  onCardioExerciseIdChange: (value: string) => void;
  onCardioDurationChange: (value: string) => void;
  onCardioNotesChange: (value: string) => void;
  onCardioStatusChange: (value: CardioStatus) => void;
  ensureSessionStarted: (value?: string) => void;
  onStatusClear: () => void;
};

export function CardioLogSection({
  cardioOptions,
  cardioExerciseId,
  cardioDuration,
  cardioNotes,
  cardioStatus,
  onCardioExerciseIdChange,
  onCardioDurationChange,
  onCardioNotesChange,
  onCardioStatusChange,
  ensureSessionStarted,
  onStatusClear,
}: CardioLogSectionProps) {
  return (
    <section className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-50">Cardio Add-On</h3>
        <p className="mt-1 text-sm text-slate-400">Keep cardio, mark it skipped, or remove it from this session entirely.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            onCardioStatusChange("completed");
            ensureSessionStarted("1");
            onStatusClear();
          }}
          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${cardioStatus === "completed" ? "bg-sky-300 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"}`}
        >
          Complete cardio
        </button>
        <button
          type="button"
          onClick={() => {
            onCardioStatusChange("skipped");
            ensureSessionStarted("1");
            onStatusClear();
          }}
          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${cardioStatus === "skipped" ? "bg-amber-300 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"}`}
        >
          Mark skipped
        </button>
        <button
          type="button"
          onClick={() => {
            onCardioStatusChange("removed");
            onCardioDurationChange("");
            onCardioNotesChange("");
            onStatusClear();
          }}
          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${cardioStatus === "removed" ? "bg-slate-200 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"}`}
        >
          Remove cardio
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-300">
          Activity
          <select
            value={cardioExerciseId}
            onChange={(event) => {
              onCardioExerciseIdChange(event.target.value);
              if (cardioStatus === "removed") {
                onCardioStatusChange("completed");
              }
              onStatusClear();
            }}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
          >
            {cardioOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          Duration (min)
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={cardioDuration}
            onChange={(event) => {
              const nextValue = event.target.value;
              onCardioDurationChange(nextValue);
              if (nextValue.trim()) {
                onCardioStatusChange("completed");
              }
              ensureSessionStarted(nextValue);
              onStatusClear();
            }}
            placeholder="20"
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
          />
        </label>
      </div>
      <input
        type="text"
        value={cardioNotes}
        onChange={(event) => {
          const nextValue = event.target.value;
          onCardioNotesChange(nextValue);
          if (nextValue.trim() && cardioStatus === "removed") {
            onCardioStatusChange("skipped");
          }
          ensureSessionStarted(nextValue);
          onStatusClear();
        }}
        placeholder="Notes (incline, speed, distance, intervals, etc.)"
        className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
      />
    </section>
  );
}
