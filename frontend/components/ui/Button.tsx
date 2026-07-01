import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "compact";
};

export function Button({ children, className, variant = "secondary", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "mobile-action",
        variant === "primary" && "mobile-action-primary",
        variant === "ghost" && "mobile-action-ghost",
        size === "compact" && "mobile-action-compact",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function ButtonLink({ href, children, className, variant = "secondary" }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "mobile-action",
        variant === "primary" && "mobile-action-primary",
        variant === "ghost" && "mobile-action-ghost",
        className,
      )}
    >
      {children}
    </Link>
  );
}
