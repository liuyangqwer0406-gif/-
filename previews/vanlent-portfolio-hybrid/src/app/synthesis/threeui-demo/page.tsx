import type { Metadata } from "next";
import { ThreeUiCurationDemo } from "./threeui-curation-demo";

export const metadata: Metadata = {
  title: "ThreeUI Curation Demo — Wen Yifan",
  description: "An independent portfolio homepage study using a restrained selection of ThreeUI interaction patterns.",
};

export default function ThreeUiDemoPage() {
  return <ThreeUiCurationDemo />;
}
