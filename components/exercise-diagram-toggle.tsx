"use client";

import { useState } from "react";
import { DiagramCard } from "@/components/diagram-card";

const labels = [
  {
    button: "Start Position",
    title: "Setup and loading position",
  },
  {
    button: "End Position",
    title: "Finish and movement path",
  },
] as const;

export function ExerciseDiagramToggle({ diagrams }: { diagrams: string[] }) {
  const [index, setIndex] = useState(0);
  const activeLabel = labels[index] ?? labels[0];
  const currentDiagram = diagrams[index] ?? diagrams[0] ?? "";

  return (
    <section className="grid gap-3">
      <div className="inline-flex w-fit rounded-full border border-white/10 bg-slate-950/70 p-1">
        {labels.map((label, buttonIndex) => {
          const active = buttonIndex === index;

          return (
            <button
              key={label.button}
              type="button"
              onClick={() => setIndex(buttonIndex)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active
                  ? "bg-sky-300 text-slate-950"
                  : "text-slate-300 hover:bg-white/5"
              }`}
              aria-pressed={active}
            >
              {label.button}
            </button>
          );
        })}
      </div>
      <DiagramCard svg={currentDiagram} title={activeLabel.title} />
    </section>
  );
}
