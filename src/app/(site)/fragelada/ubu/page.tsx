import type { Metadata } from "next";
import { FixedBoxPage } from "@/components/fragelada/fixed-box-page";

export const metadata: Metadata = {
  title: "Frågelådan · UBU",
  description: "Skriv en anonym fråga till UBU.",
  robots: { index: false, follow: false },
};

export default function UBUBoxPage() {
  return <FixedBoxPage slug="ubu" />;
}
