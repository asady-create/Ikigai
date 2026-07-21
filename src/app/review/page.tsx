import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Review",
};

export default function ReviewPage() {
  return (
    <ComingSoon
      title="Review"
      description="Momentum dashboards, streak history, and full journal export (Markdown / PDF)."
      offset={5}
    />
  );
}
