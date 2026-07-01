import type { ReactNode } from "react";
import { statusClassName, statusLabel, type EvaUiStatus } from "@/lib/status";
import { cn } from "@/lib/cn";

type StatusChipProps = {
  status: EvaUiStatus;
  className?: string;
  label?: string;
};

export default function StatusChip({ status, className, label }: StatusChipProps) {
  return <span className={cn(statusClassName(status), className)}>{label ?? statusLabel(status)}</span>;
}

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return <span className={cn("ui-badge", className)}>{children}</span>;
}
