import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "AI Coach",
};

export default function CoachPage() {
  return (
    <ComingSoon
      title="AI Coach"
      description="Chat in the voice of pmarca — practical, strategic, opportunity-focused. Plus one-click Generate Next Action."
      offset={4}
    />
  );
}
