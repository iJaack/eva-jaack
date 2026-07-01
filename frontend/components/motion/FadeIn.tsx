"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { useReducedMotion } from "./MotionProvider";

type FadeInProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
};

export default function FadeIn({ children, delay = 0, y = 18, ...props }: FadeInProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: reducedMotion ? 0 : 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
