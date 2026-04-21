"use client";

import { motion } from "framer-motion";
import { AnimatedShaderBackground } from "@/components/ui/animated-shader-background";

export default function MotionPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <AnimatedShaderBackground />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
      >
        {children}
      </motion.div>
    </div>
  );
}
