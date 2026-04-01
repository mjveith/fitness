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

type Props = {
  diagrams: string[];
  imageUrls?: [string, string] | null;
};

export function ExerciseDiagramToggle({ diagrams, imageUrls }: Props) {
  const [index, setIndex] = useState(0);
  const activeLabel = labels[index] ?? labels[0];
  const currentDiagram = diagrams[index] ?? diagrams[0] ?? "";
  const currentImageUrl = imageUrls?.[index] ?? imageUrls?.[0] ?? null;

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
      {currentImageUrl ? (
        <figure className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
          <div className="bg-slate-950/70 p-4">
            <img
              src={currentImageUrl}
              alt={`${activeLabel.button} for exercise demonstration`}
              className="h-auto w-full object-contain"
              loading="lazy"
            />
          </div>
          <figcaption className="border-t border-white/10 px-4 py-3 text-sm text-slate-300">
            {activeLabel.button}
          </figcaption>
        </figure>
      ) : (
        <DiagramCard svg={currentDiagram} title={activeLabel.title} />
      )}
    </section>
  );
}
