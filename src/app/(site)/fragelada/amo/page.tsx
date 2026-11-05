import type { Metadata } from "next";
import { FixedBoxPage } from "@/components/fragelada/fixed-box-page";

export const metadata: Metadata = {
  title: "Frågelådan · AMO",
  description: "Skriv en anonym fråga till AMO.",
  robots: { index: false, follow: false },
};

export default function AMOBoxPage() {
  return <FixedBoxPage slug="amo" />;
}
