import type { Metadata } from "next";
import { ThreeUiLab } from "@/components/synthesis/threeui-lab/threeui-lab";

export const metadata: Metadata = {
  title: "ThreeUI Lab — Wen Yifan",
  description: "An isolated ThreeUI Community motion study adapted to the Wen Yifan portfolio system.",
};

export default function ThreeUiLabPage() {
  return <ThreeUiLab />;
}
