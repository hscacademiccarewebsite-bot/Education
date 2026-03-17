"use client";

import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20, filter: "blur(2px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function RevealSection({ children, className = "", noStagger = false, viewportMargin = "-5%", as = "div" }) {
  const Component = motion[as];
  return (
    <Component
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: viewportMargin }}
      variants={noStagger ? fadeInUp : staggerContainer}
      className={className}
    >
      {children}
    </Component>
  );
}

export function RevealItem({ children, className = "", as = "div" }) {
  const Component = motion[as];
  return (
    <Component 
      variants={{
        ...fadeInUp,
        exit: { opacity: 0, scale: 0.95, filter: "blur(2px)", transition: { duration: 0.2 } }
      }} 
      className={className}
    >
      {children}
    </Component>
  );
}
