import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StatGridProps = {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
};

export default function StatGrid({ children, className, columns = 3 }: StatGridProps) {
  return <div className={cn("odds-row", columns === 4 && "odds-row-4", columns === 2 && "odds-row-2", className)}>{children}</div>;
}

export function StatCell({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("stat-cell", className)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
