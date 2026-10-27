import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Panel · Lehonor Enoboutique",
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return children;
}
