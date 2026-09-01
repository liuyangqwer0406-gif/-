import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/synthesis/project-detail";
import { getSynthesisProject, synthesisProjects } from "@/data/synthesis-projects";

export function generateStaticParams() {
  return synthesisProjects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getSynthesisProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} - Wen Yifan`,
    description: project.intro,
  };
}

export default async function SynthesisProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getSynthesisProject(slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
