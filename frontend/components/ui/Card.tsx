import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  variant?: "default" | "glass" | "spotlight";
  as?: "article" | "section" | "div" | "aside";
};

export default function Card({ children, className, variant = "glass", as: Tag = "article", ...props }: CardProps) {
  return (
    <Tag className={cn("prediction-card", variant === "spotlight" && "card-spotlight", variant === "default" && "card-solid", className)} {...props}>
      {children}
    </Tag>
  );
}
