"use client";

import { motion } from "framer-motion";
import type { Quote } from "@/lib/quotes";

export function QuoteBlock({
  quote,
  className = "",
  large = false,
}: {
  quote: Quote;
  className?: string;
  large?: boolean;
}) {
  return (
    <motion.blockquote
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <p
        className={
          large
            ? "font-display text-2xl leading-snug tracking-tight text-zinc-100 sm:text-3xl md:text-4xl"
            : "font-display text-lg leading-snug text-zinc-200 sm:text-xl"
        }
      >
        “{quote.text}”
      </p>
      <footer className="mt-4 text-sm text-zinc-500">
        — {quote.attribution}
      </footer>
    </motion.blockquote>
  );
}
