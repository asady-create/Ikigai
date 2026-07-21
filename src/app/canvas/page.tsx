import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Purpose Canvas",
};

export default function CanvasPage() {
  return (
    <ComingSoon
      title="Purpose Canvas"
      description="Wheel of Life, Ikigai quadrants, core values, and a vision statement generator — coming in the next iteration."
      offset={2}
    />
  );
}
