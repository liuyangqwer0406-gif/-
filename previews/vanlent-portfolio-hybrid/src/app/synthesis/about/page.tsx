import type { Metadata } from "next";
import { SynthesisAboutPage } from "@/components/synthesis/synthesis-about-page";

export const metadata: Metadata = {
  title: "关于温一帆 / About Wen Yifan",
  description: "温一帆的中英双语设计简介、工作方法、经历与视觉设计实践。",
};

export default function AboutPage() {
  return <SynthesisAboutPage />;
}
