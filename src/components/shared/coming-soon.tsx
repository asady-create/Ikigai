"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteBlock } from "@/components/shared/quote-block";
import { getRotatingQuote } from "@/lib/quotes";

/**
 * Lightweight stub for pages we'll flesh out in later iterations.
 */
export function ComingSoon({
  title,
  description,
  offset = 2,
}: {
  title: string;
  description: string;
  offset?: number;
}) {
  const quote = getRotatingQuote(offset);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-8 py-6 text-center"
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
        <Construction className="size-5 text-amber-500" />
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-zinc-400">{description}</p>
      </div>
      <div className="border-l-2 border-zinc-700 pl-5 text-left">
        <QuoteBlock quote={quote} />
      </div>
      <p className="text-sm text-zinc-500">
        Scaffolded and ready to extend. Reflections + Home ship first — iterate
        here next.
      </p>
      <Button asChild variant="outline">
        <Link href="/">
          <ArrowLeft />
          Back to Home
        </Link>
      </Button>
    </motion.div>
  );
}
