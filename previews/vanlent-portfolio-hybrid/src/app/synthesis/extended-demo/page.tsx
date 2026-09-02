import type { Metadata } from "next";
import { ExtendedHomeDemo } from "./extended-home-demo";

export const metadata: Metadata = {
  title: "Extended Home Demo — Wen Yifan",
  description: "A scroll-led portfolio homepage layout study using existing work and visual assets.",
};

export default function ExtendedDemoPage() {
  return <ExtendedHomeDemo />;
}
