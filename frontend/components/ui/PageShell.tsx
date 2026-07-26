import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import { cn } from "@/lib/cn";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  variant?: "mobile" | "page" | "home";
  id?: string;
};

export default function PageShell({ children, className, variant = "mobile", id = "main-content" }: PageShellProps) {
  const shellClass =
    variant === "home"
      ? "mobile-shell prediction-home"
      : variant === "page"
        ? "page-shell"
        : "mobile-shell";

  return (
    <>
      <Nav />
      <main id={id} className={cn(shellClass, className)} data-eva-design="v2">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
