type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.35em] text-sky-300">{eyebrow}</p>
      <h1 className="text-3xl font-semibold text-slate-50">{title}</h1>
      <p className="max-w-sm text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}
