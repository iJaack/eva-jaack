"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotion } from "./MotionProvider";

type StaggerChildrenProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
};

export default function StaggerChildren({ children, className, stagger = 0.08 }: StaggerChildrenProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}
