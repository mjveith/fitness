"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/schedule", label: "Schedule", icon: "S" },
  { href: "/log", label: "Log", icon: "L" },
  { href: "/exercises", label: "Exercises", icon: "E" },
  { href: "/progress", label: "Progress", icon: "P" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-4 pb-5 sm:max-w-lg">
      <div className="glass-panel grid grid-cols-4 rounded-[2rem] p-2 shadow-glow">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-[1.4rem] px-2 py-3 text-xs font-medium transition",
                isActive
                  ? "bg-sky-400/15 text-sky-100"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200",
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-slate-900/70 text-sm">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
