"use client";

import { FormEvent, useState } from "react";
import { ParticleOrb } from "@/components/sites/vanlent-dev-4f352424/root-8a5edab2/particle-orb";
import { SiteShell } from "@/components/sites/vanlent-dev-4f352424/root-8a5edab2/site-shell";
import "./reference.css";

const ASSET_ROOT = "/sites/vanlent-dev-4f352424/root-8a5edab2/images";

const projects = [
  {
    name: "NEO",
    year: "2024",
    type: "Creative development",
    description: "A spatial digital platform pairing an architectural grid with precise, responsive motion.",
    image: `${ASSET_ROOT}/neo_desktop_poster.jpg`,
    alt: "NEO website shown in a dark desktop interface",
  },
  {
    name: "MACADA",
    year: "2024",
    type: "Development · Design",
    description: "A clear, editorial web experience that turns a broad archive into a focused journey.",
    image: `${ASSET_ROOT}/macada_desktop_poster.jpg`,
    alt: "Macada website shown in a warm desktop interface",
  },
  {
    name: "HERO",
    year: "2023",
    type: "Front-end development",
    description: "A commerce experience built around motion, product detail, and a confident visual rhythm.",
    image: `${ASSET_ROOT}/hero_desktop_poster.jpg`,
    alt: "Hero website displayed on a desktop viewport",
  },
] as const;

const capabilities = [
  {
    label: "WEB DEVELOPMENT",
    short: "01",
    description: "Complete digital builds shaped around the idea, the audience, and the way every interaction should feel.",
  },
  {
    label: "FRONT END DEVELOPMENT",
    short: "02",
    description: "Responsive interfaces with deliberate motion, clean architecture, and a sharp eye for the last ten percent.",
  },
  {
    label: "BACK END DEVELOPMENT",
    short: "03",
    description: "Dependable systems that keep content structured, integrations connected, and the experience fast.",
  },
  {
    label: "WEB DESIGN",
    short: "04",
    description: "Distinctive visual systems that translate a brand into type, space, imagery, and interaction.",
  },
  {
    label: "UX / UI DESIGN",
    short: "05",
    description: "Clear journeys and useful interfaces, balancing expressive form with confident everyday use.",
  },
  {
    label: "MOTION DESIGN",
    short: "06",
    description: "Purposeful movement that explains structure, rewards attention, and gives the interface a physical quality.",
  },
] as const;

const testimonials = [
  {
    quote: "Tim combines technical depth with a rare sensitivity for the visual idea. The result feels exact, not overworked.",
    byline: "Creative partner · Amsterdam",
  },
  {
    quote: "From the first prototype to launch, every decision was considered and the collaboration stayed clear and direct.",
    byline: "Studio founder · The Netherlands",
  },
] as const;

function Arrow({ direction }: { direction: "left" | "right" }) {
  return <span aria-hidden="true">{direction === "left" ? "←" : "→"}</span>;
}

export default function VanLentReferencePage() {
  const [projectIndex, setProjectIndex] = useState(0);
  const [capabilityIndex, setCapabilityIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const project = projects[projectIndex];
  const capability = capabilities[capabilityIndex];
  const testimonial = testimonials[testimonialIndex];

  const changeProject = (step: number) => {
    setProjectIndex((current) => (current + step + projects.length) % projects.length);
  };

  const handleForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <SiteShell mode="reference">
      <h1 className="sr-only">van Lent web developer and designer — local reference study</h1>

      <section className="ref-hero ref-scroll-section" aria-labelledby="ref-hero-title">
        <div className="ref-sticky ref-hero-stage">
          <div className="ref-meta ref-meta-01"><span>01</span> CREATIVE DEVELOPER</div>
          <div className="ref-meta ref-meta-02"><span>02</span> AMSTERDAM BASED</div>
          <address className="ref-meta ref-meta-03">
            <span>03</span>
            <a href="tel:+31652016861">T: +31 6 5201 6861</a>
            <a href="mailto:tim@vanlent.dev">M: TIM@VANLENT.DEV</a>
          </address>
          <div className="ref-meta ref-meta-04"><span>04</span> AVAILABLE FOR WORK <i /></div>

          <div className="ref-hero-orb" aria-hidden="true">
            <ParticleOrb mode="reference" phase={0.35} />
          </div>
          <h2 id="ref-hero-title" className="ref-hero-title">
            <span>SHAPING CONCEPTS</span>
            <span>BUILDING EXPERIENCES</span>
          </h2>
          <a href="#work" className="ref-scroll-cue">
            <span>SCROLL TO EXPLORE</span>
            <i aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="work" className="ref-work ref-scroll-section" aria-labelledby="ref-work-title">
        <div className="ref-sticky ref-work-stage">
          <header className="ref-section-heading ref-work-heading">
            <p><span>01</span> FEATURED PROJECTS</p>
            <h2 id="ref-work-title">SELECTED WORK</h2>
            <p className="ref-deck">A curated collection of web development projects</p>
          </header>

          <div className="ref-workbench">
            <div className="ref-project-image" key={`image-${project.name}`}>
              <img src={project.image} alt={project.alt} />
              <div className="ref-image-index" aria-hidden="true">0{projectIndex + 1} / 0{projects.length}</div>
            </div>

            <article className="ref-project-copy" key={`copy-${project.name}`} aria-live="polite">
              <p>{project.type}</p>
              <h3 data-active-project>{project.name}</h3>
              <p className="ref-project-description">{project.description}</p>
              <div className="ref-project-year"><span>YEAR</span>{project.year}</div>
            </article>

            <div className="ref-project-preview" aria-label="Choose a project">
              {projects.map((item, index) => (
                <button
                  type="button"
                  key={item.name}
                  aria-label={`Preview ${item.name}`}
                  aria-current={index === projectIndex ? "true" : undefined}
                  onClick={() => setProjectIndex(index)}
                >
                  <span>0{index + 1}</span>{item.name}
                </button>
              ))}
            </div>

            <div className="ref-project-controls">
              <button type="button" aria-label="Previous project" onClick={() => changeProject(-1)}><Arrow direction="left" /></button>
              <span aria-live="polite">0{projectIndex + 1} — 0{projects.length}</span>
              <button type="button" data-next-project aria-label="Next project" onClick={() => changeProject(1)}><Arrow direction="right" /></button>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="ref-services ref-scroll-section" aria-labelledby="ref-services-title">
        <div className="ref-sticky ref-services-stage">
          <header className="ref-section-heading ref-services-heading">
            <p><span>02</span> SERVICES</p>
            <p className="ref-services-intro">Code, performance, and design working together.<br />Without compromise.</p>
            <h2 id="ref-services-title" className="sr-only">Services</h2>
          </header>

          <div className="ref-services-statement" aria-hidden="true">
            <span>RELIABLE</span><span>CREATIVE</span><span>VERSATILE</span>
          </div>

          <div className="ref-services-body">
            <div className="ref-capability-list" role="group" aria-label="Select a discipline">
              {capabilities.map((item, index) => (
                <button
                  type="button"
                  key={item.label}
                  aria-pressed={index === capabilityIndex}
                  onClick={() => setCapabilityIndex(index)}
                >
                  <span>{item.short}</span>{item.label}<i aria-hidden="true">↗</i>
                </button>
              ))}
            </div>

            <article className="ref-capability-focus" key={capability.label} aria-live="polite">
              <p>{capability.short} / 06</p>
              <h3>{capability.label}</h3>
              <p>{capability.description}</p>
            </article>

            <div className="ref-services-orb" aria-hidden="true">
              <ParticleOrb mode="reference" phase={1.25} />
            </div>

            <div className="ref-schematic" aria-hidden="true">
              <div><span>CODE</span><span>DESIGN</span><span>MOTION</span></div>
            </div>
          </div>

          <figure className="ref-testimonial">
            <blockquote key={testimonial.quote}>“{testimonial.quote}”</blockquote>
            <figcaption>{testimonial.byline}</figcaption>
            <div className="ref-testimonial-controls">
              <button type="button" aria-label="Previous testimonial" onClick={() => setTestimonialIndex((testimonialIndex + testimonials.length - 1) % testimonials.length)}><Arrow direction="left" /></button>
              <span>{testimonialIndex + 1} / {testimonials.length}</span>
              <button type="button" aria-label="Next testimonial" onClick={() => setTestimonialIndex((testimonialIndex + 1) % testimonials.length)}><Arrow direction="right" /></button>
            </div>
          </figure>
        </div>
      </section>

      <section id="about" className="ref-about ref-scroll-section" aria-labelledby="ref-about-title">
        <div className="ref-sticky ref-about-stage">
          <div className="ref-about-index"><span>03</span> ABOUT</div>
          <div className="ref-about-portrait">
            <img src={`${ASSET_ROOT}/me-w828.webp`} alt="Portrait of Tim van Lent" />
          </div>
          <div className="ref-about-copy">
            <h2 id="ref-about-title">ABOUT</h2>
            <p>From concept to launch, I help bring your ideas to life.</p>
            <div className="ref-about-columns">
              <p>Independent creative developer and designer based in Amsterdam, focused on expressive, efficient websites.</p>
              <p>Working closely with studios, brands, and ambitious people to connect strong ideas with thoughtful execution.</p>
            </div>
            <a href="#contact">START A CONVERSATION <span aria-hidden="true">↘</span></a>
          </div>
        </div>
      </section>

      <footer id="contact" className="ref-contact" aria-labelledby="ref-contact-title">
        <div className="ref-contact-index"><span>04</span> CONTACT</div>
        <h2 id="ref-contact-title">CONTACT</h2>
        <div className="ref-contact-orb" aria-hidden="true"><ParticleOrb mode="reference" phase={2.4} /></div>

        <div className="ref-contact-info">
          <p>LET&apos;S MAKE SOMETHING<br />WORTH REMEMBERING.</p>
          <a href="mailto:tim@vanlent.dev">TIM@VANLENT.DEV</a>
          <a href="tel:+31652016861">+31 6 5201 6861</a>
          <p>AMSTERDAM<br />THE NETHERLANDS</p>
        </div>

        <form className="ref-contact-form" onSubmit={handleForm}>
          <label>
            <span>YOUR NAME</span>
            <input type="text" name="name" autoComplete="name" placeholder="Name" required />
          </label>
          <label>
            <span>YOUR EMAIL</span>
            <input type="email" name="email" autoComplete="email" placeholder="Email address" required />
          </label>
          <label>
            <span>ABOUT THE PROJECT</span>
            <textarea name="message" rows={3} placeholder="A few lines about the idea" required />
          </label>
          <button type="submit">SEND INQUIRY <span aria-hidden="true">↗</span></button>
          <p>This local study does not submit or store form data.</p>
        </form>

        <div className="ref-contact-bottom">
          <span>LOCAL REFERENCE STUDY</span><span>© 2026 VAN LENT</span><a href="#work">BACK TO TOP ↑</a>
        </div>
      </footer>
    </SiteShell>
  );
}
