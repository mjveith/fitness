export function DiagramCard({
  svg,
  title,
}: {
  svg: string;
  title: string;
}) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
      <div
        className="[&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption className="border-t border-white/10 px-4 py-3 text-sm text-slate-300">
        {title}
      </figcaption>
    </figure>
  );
}
