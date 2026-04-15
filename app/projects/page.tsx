"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppNavbar from "@/components/edu-viewer/AppNavbar";
import { apiGet } from "@/utils/apiClient";

interface ProjectItem {
  id: number;
  course_id: number;
  project_author_id: string;
  project_collection_id: string;
  project_work_id: string;
  project_title: string | null;
  project_url_slug: string | null;
  scraped_at: string;
  course_slug: string | null;
  course_title: string | null;
  course_type: string | null;
}

function projectDisplayName(p: ProjectItem): string {
  return (
    p.project_title?.trim() ||
    p.project_url_slug?.trim() ||
    `${p.project_author_id}/${p.project_collection_id}/${p.project_work_id}`
  );
}

function parsePositiveInt(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const selectedProjectId = parsePositiveInt(searchParams.get("project"));

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<ProjectItem[]>("/api/projects")
      .then((data) => { if (!cancelled) setProjects(Array.isArray(data) ? data : []); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load projects"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNavbar crumbs={[{ label: "Projects" }]} />

      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Open a project to jump to its linked course.</p>
          </div>
          <Link href="/courses" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
            Browse Courses
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map((i) => <div key={i} className="h-28 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No projects found.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const active = project.id === selectedProjectId;
              const courseSlug = project.course_slug?.trim() || String(project.course_id);
              const courseTitle = project.course_title?.trim() || `Course ${project.course_id}`;
              const fromPath = `/projects?project=${project.id}`;
              const href = `/courses/${project.course_id}/${courseSlug}?from=${encodeURIComponent(fromPath)}`;
              return (
                <Link key={project.id} href={href} className={[
                  "block rounded-xl border bg-white dark:bg-gray-900 p-5 transition-colors",
                  active
                    ? "border-indigo-400 dark:border-indigo-700 ring-2 ring-indigo-100 dark:ring-indigo-900/50"
                    : "border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700",
                ].join(" ")}>
                  <div className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    Project ID: {project.id}
                  </div>
                  <h2 className="mt-3 text-base font-bold text-gray-900 dark:text-gray-100">{projectDisplayName(project)}</h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">{courseTitle}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Course ID: {project.course_id}{project.course_type ? ` · ${project.course_type}` : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        {selectedProject && (
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Selected project: {projectDisplayName(selectedProject)}</p>
        )}
      </div>
    </div>
  );
}
