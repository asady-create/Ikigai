import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Goals Portfolio",
};

export default function GoalsPage() {
  return (
    <ComingSoon
      title="Goals Portfolio"
      description="Goals as bets — categories, milestones, skills acquired, opportunities pursued, risk/return thinking."
      offset={3}
    />
  );
}
