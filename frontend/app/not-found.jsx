"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      {/* Background Decorative Elements */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(31,185,167,0.05),transparent_70%)]" />
      
      <RevealSection noStagger className="relative z-10 max-w-2xl">
        <RevealItem>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <h1 className="text-[clamp(120px,20vw,200px)] font-black leading-none tracking-tighter text-slate-900/10">
              404
            </h1>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="text-4xl font-extrabold text-brand-600 sm:text-6xl">Lost?</span>
            </div>
          </motion.div>
        </RevealItem>

        <RevealItem className="space-y-4">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Page Not Found
          </h2>
          <p className="mx-auto max-w-md text-slate-600">
            It looks like this page took a wrong turn or doesn't exist anymore. 
            Don't worry, even the best explorers get lost sometimes.
          </p>
        </RevealItem>

        <RevealItem className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="site-button-primary px-8 py-3 text-base">
            Return to Homepage
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="site-button-secondary px-8 py-3 text-base"
          >
            Go Back
          </button>
        </RevealItem>
      </RevealSection>

      {/* Floating accent shapes */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/4 left-1/4 -z-10 h-24 w-24 rounded-3xl bg-brand-100/50 blur-xl"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute right-1/4 top-1/4 -z-10 h-32 w-32 rounded-full bg-slate-200/50 blur-2xl"
      />
    </main>
  );
}
