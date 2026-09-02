import type { Metadata } from "next";
import { SignalOrbDemo } from "./signal-orb-demo";

export const metadata: Metadata = {
  title: "Signal Orb Demo — Wen Yifan",
  description: "An original spring-driven SVG interaction study for the Wen Yifan portfolio.",
};

export default function OrbDemoPage() {
  return <SignalOrbDemo />;
}
