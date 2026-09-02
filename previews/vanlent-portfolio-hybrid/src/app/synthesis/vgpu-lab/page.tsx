import type { Metadata } from "next";
import { VgpuLab } from "./vgpu-lab";

export const metadata: Metadata = {
  title: "vgpu Signal Lab — Wen Yifan",
  description: "A local WebGPU and WGSL workbench for the Wen Yifan portfolio visual system.",
};

export default function VgpuLabPage() {
  return <VgpuLab />;
}
