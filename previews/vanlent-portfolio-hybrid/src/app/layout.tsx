import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Van Lent × Wen Yifan — Isolated design study",
  description: "A local reference study and portfolio hybrid preview.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
