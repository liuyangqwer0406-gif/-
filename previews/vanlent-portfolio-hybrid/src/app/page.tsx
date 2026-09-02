import Link from "next/link";
import "./preview-index.css";

export default function Home() {
  return (
    <main className="preview-index">
      <header><span>ISOLATED DESIGN STUDY / 2026.08.24</span><span>VANLENT.DEV × WEN YIFAN</span></header>
      <section className="preview-intro">
        <p>Two routes, one controlled comparison.</p>
        <h1>REFERENCE<br /><em>→</em> ADAPTATION</h1>
        <p className="preview-cn">先看结构复刻，再看它如何被改写为你的作品集语言。正式站点未被修改。</p>
      </section>
      <section className="preview-routes" aria-label="Preview routes">
        <Link href="/reference/vanlent"><span>01 / REFERENCE</span><strong>VAN LENT<br />STRUCTURE STUDY</strong><small>Source identity · teal · interaction anatomy</small><b aria-hidden="true">↗</b></Link>
        <Link href="/hybrid"><span>02 / RECOMMENDED</span><strong>WEN YIFAN<br />PORTFOLIO HYBRID</strong><small>Cinema Black · Editorial Paper · Signal Orange</small><b aria-hidden="true">↗</b></Link>
      </section>
      <footer><span>LOCAL PREVIEW ONLY</span><span>DESKTOP / TABLET / MOBILE</span></footer>
    </main>
  );
}
