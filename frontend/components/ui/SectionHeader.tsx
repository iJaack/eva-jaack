import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export default function SectionHeader({ eyebrow, title, description, className, children }: SectionHeaderProps) {
  return (
    <header className={cn("mobile-page-head", className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {children}
    </header>
  );
}
