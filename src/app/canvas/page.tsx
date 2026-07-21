import type { Metadata } from "next";
import { PurposeCanvasPage } from "@/components/canvas/purpose-canvas";

export const metadata: Metadata = {
  title: "Purpose Canvas",
  description:
    "Ikigai quadrants, core values, and a one-paragraph vision statement — map what you're aiming at.",
};

export default function CanvasPage() {
  return <PurposeCanvasPage />;
}
