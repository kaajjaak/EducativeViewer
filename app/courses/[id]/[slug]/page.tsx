"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import AppNavbar from "@/components/edu-viewer/AppNavbar";
import CourseDetailToc from "@/components/edu-viewer/CourseDetailToc";
import { apiPost } from "@/utils/apiClient";
import { getProgress, resetCourseProgress } from "@/utils/localProgress";
import type { ProgressData } from "@/utils/localProgress";

function safeFromPath(path: string | null): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string; slug: string }>();
  const searchParams = useSearchParams();
  const routeId = params?.id ?? "";
  const courseId = Number(routeId);
  const fromPath = safeFromPath(searchParams.get("from"));
  const fromPathsPage = Boolean(fromPath?.startsWith("/paths"));
  const fromProjectsPage = Boolean(fromPath?.startsWith("/projects"));
  const sectionCrumb = fromPathsPage
    ? { label: "Paths", href: fromPath ?? "/paths" }
    : fromProjectsPage
      ? { label: "Projects", href: fromPath ?? "/projects" }
      : { label: "Courses", href: "/courses" };

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<ProgressData>({ course_order: [], completed: {} });
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    if (isNaN(courseId)) { setMissing(true); setLoading(false); return; }
    let cancelled = false;
    apiPost<CourseDetail>("/api/course-details", { course_id: courseId })
      .then((data) => {
        if (cancelled) return;
        setCourse(data);
        setProgress(getProgress());
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setMissing(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [courseId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AppNavbar crumbs={[sectionCrumb, { label: "…" }]} />
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-7">
          {[3,5,2,4].map((count, i) => (
            <div key={i}>
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
              <div className="space-y-2">
                {Array.from({ length: count }).map((_, j) => (
                  <div key={j} className="h-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (missing || !course) return notFound();

  const completedIds: number[] = progress.completed[String(courseId)] ?? [];
  const completedTopicIndices = new Set(completedIds);
  const totalTopics = course.toc.reduce(
    (acc, entry) => acc + ("topics" in entry ? entry.topics.length : 1),
    0,
  );

  const handleResetProgress = () => {
    if (!showConfirmReset) {
      setShowConfirmReset(true);
      return;
    }
    resetCourseProgress(courseId);
    setProgress((p) => {
      const next = { ...p.completed };
      delete next[String(courseId)];
      return { ...p, completed: next };
    });
    setShowConfirmReset(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNavbar crumbs={[sectionCrumb, { label: course.title }]} />
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            {course.type && (
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800 inline-block mb-1">
                {course.type}
              </span>
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{course.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalTopics} lesson{totalTopics !== 1 ? "s" : ""} &middot;{" "}
              {course.toc.length} chapter{course.toc.length !== 1 ? "s" : ""}
            </p>
          </div>

          {completedIds.length > 0 && (
            <button
              onClick={handleResetProgress}
              onMouseLeave={() => setShowConfirmReset(false)}
              className={[
                "shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer",
                showConfirmReset
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
              ].join(" ")}
            >
              {showConfirmReset ? "Confirm Reset" : "Reset progress"}
            </button>
          )}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <CourseDetailToc
          toc={course.toc}
          courseId={courseId}
          slug={course.slug}
          fromPath={fromPath}
          completedTopicIndices={completedTopicIndices}
        />
      </div>
    </main>
  );
}

interface Topic {
  api_url: string;
  course_id: number;
  slug: string;
  title: string;
  topic_index: number;
}

interface Category {
  category: string;
  topics: Topic[];
}

type TocEntry = Category | Topic;

interface CourseDetail {
  id: number;
  slug: string;
  title: string;
  toc: TocEntry[];
  type: string;
}
