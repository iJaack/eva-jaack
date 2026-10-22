"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { useReducedMotion } from "./MotionProvider";

type FadeInProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
};

export default function FadeIn({ children, delay = 0, y: _ignoredShift = 0, ...props }: FadeInProps) {
  const reducedMotion = useReducedMotion();
  void _ignoredShift;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      whileInView={reducedMotion ? undefined : { opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: reducedMotion ? 0 : 0.4, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
