"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteMode } from "./site-types";
import "./site-shell.css";

export function SiteShell({ mode, children }: { mode: SiteMode; children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  const hybrid = mode === "hybrid";
  return (
    <div className={`${mode}-page engineering-grid site-shell`}>
      <header className="site-header">
        <Link className="brand-cell" href="/" aria-label="Open preview index">{hybrid ? <><span>WEN</span> YIFAN</> : <><span>VAN</span>LENT</>}</Link>
        <a className="header-cell header-menu" href="#work">{hybrid ? "PROJECTS" : "M"}</a>
        <div className="header-spacer" />
        <Link className="header-cell mode-link" href={hybrid ? "/reference/vanlent" : "/hybrid"}>{hybrid ? "REF" : "HYBRID"}</Link>
        <a className="header-cell" href="#contact">{hybrid ? "CN / EN" : "PM"}</a>
      </header>
      <div className="scroll-rail" aria-hidden="true"><i style={{ height: `${Math.max(3, progress * 100)}%` }} /></div>
      <div className="ruler" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></div>
      <main>{children}</main>
    </div>
  );
}
