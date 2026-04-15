"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppNavbar from "@/components/edu-viewer/AppNavbar";
import { apiGet } from "@/utils/apiClient";

interface PathItem {
  id: number;
  path_author_id: string;
  path_collection_id: string;
  path_url_slug: string | null;
  path_title: string | null;
  scraped_at: string;
  course_count: number;
}

interface CourseItem {
  id: number;
  slug: string | null;
  title: string | null;
  type: string | null;
  path_id: number;
}

interface PathCoursesResponse {
  path: { id: number; path_title: string | null };
  courses: CourseItem[];
}

function pathDisplayName(p: PathItem): string {
  return p.path_title?.trim() || p.path_url_slug?.trim() || `${p.path_author_id}/${p.path_collection_id}`;
}

function parsePositiveInt(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export default function PathsPage() {
  const searchParams = useSearchParams();
  const initialId = parsePositiveInt(searchParams.get("path"));

  const [paths, setPaths] = useState<PathItem[]>([]);
  const [pathsLoading, setPathsLoading] = useState(true);
  const [pathsError, setPathsError] = useState<string | null>(null);

  const [selectedPathId, setSelectedPathId] = useState<number | null>(initialId);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(initialId !== null);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<PathItem[]>("/api/paths")
      .then((data) => { if (!cancelled) setPaths(Array.isArray(data) ? data : []); })
      .catch((err: unknown) => { if (!cancelled) setPathsError(err instanceof Error ? err.message : "Failed to load paths"); })
      .finally(() => { if (!cancelled) setPathsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selectedPathId == null) return;
    let cancelled = false;
    setCoursesLoading(true);
    setCoursesError(null);
    apiGet<PathCoursesResponse>(`/api/paths/${selectedPathId}/courses`)
      .then((payload) => { if (!cancelled) setCourses(Array.isArray(payload?.courses) ? payload.courses : []); })
      .catch((err: unknown) => { if (!cancelled) setCoursesError(err instanceof Error ? err.message : "Failed to load path courses"); })
      .finally(() => { if (!cancelled) setCoursesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedPathId]);

  const selectedPath = useMemo(
    () => paths.find((p) => p.id === selectedPathId) ?? null,
    [paths, selectedPathId],
  );

  function handleSelectPath(pathId: number) {
    setSelectedPathId(pathId);
    setCourses([]);
    const params = new URLSearchParams(searchParams.toString());
    params.set("path", String(pathId));
    window.history.replaceState(null, "", `/paths?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNavbar crumbs={[{ label: "Paths" }]} />

      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Learning Paths</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Select a path to view all linked courses.</p>
          </div>
          <Link href="/courses" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
            Browse Courses
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {pathsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map((i) => <div key={i} className="h-28 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse" />)}
          </div>
        ) : pathsError ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{pathsError}</div>
        ) : paths.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No paths found.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((path) => {
              const active = path.id === selectedPathId;
              return (
                <div
                  key={path.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectPath(path.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelectPath(path.id); }}
                  className={[
                    "relative text-left rounded-xl border bg-white dark:bg-gray-900 p-5 transition-colors cursor-pointer",
                    active
                      ? "border-indigo-400 dark:border-indigo-700 ring-2 ring-indigo-100 dark:ring-indigo-900/50"
                      : "border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700",
                  ].join(" ")}
                >
                  <div className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
                    {Number(path.course_count) || 0} course{Number(path.course_count) === 1 ? "" : "s"}
                  </div>
                  <h2 className="mt-3 text-base font-bold text-gray-900 dark:text-gray-100">{pathDisplayName(path)}</h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Path ID: {path.id}</p>
                </div>
              );
            })}
          </div>
        )}

        {selectedPathId != null && (
          <section className="mt-7 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {selectedPath ? pathDisplayName(selectedPath) : `Path ${selectedPathId}`}
              </h3>
            </div>
            <div className="p-4">
              {coursesLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map((i) => <div key={i} className="h-11 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 animate-pulse" />)}
                </div>
              ) : coursesError ? (
                <div className="text-sm text-red-600 dark:text-red-400">{coursesError}</div>
              ) : courses.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No courses found for this path.</div>
              ) : (
                <div className="space-y-2">
                  {courses.map((course) => {
                    const title = course.title?.trim() || `Course ${course.id}`;
                    const slug = course.slug?.trim() || String(course.id);
                    const fromPath = selectedPath ? `/paths?path=${selectedPath.id}` : "/paths";
                    const href = `/courses/${course.id}/${slug}?from=${encodeURIComponent(fromPath)}`;
                    return (
                      <Link key={course.id} href={href} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2.5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Course ID: {course.id}{course.type ? ` · ${course.type}` : ""}</p>
                        </div>
                        <svg className="w-4 h-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
