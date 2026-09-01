import type { Metadata } from "next";
import { SynthesisShell } from "@/components/synthesis/synthesis-shell";
import "./synthesis.css";

export const metadata: Metadata = {
  title: "Wen Yifan - Visual Design Portfolio",
  description: "Selected work in brand identity, packaging, 3D image and interactive experience by Wen Yifan.",
};

export default function SynthesisLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SynthesisShell>{children}</SynthesisShell>;
}
