"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import TopicLayoutClient from "@/components/edu-viewer/TopicLayoutClient";
import AppNavbar from "@/components/edu-viewer/AppNavbar";
import { apiPost } from "@/utils/apiClient";
import { getProgress } from "@/utils/localProgress";

function safeFromPath(path: string | null): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

interface Component {
  type: string;
  content: Record<string, unknown>;
  index: number;
  width?: string;
}

interface TopicDetail {
  api_url: string;
  components: Component[];
  course_id: number;
  status: string;
  topic_index: number;
  topic_name: string;
  topic_slug: string;
  topic_url: string;
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

interface CourseDetail {
  id: number;
  slug: string;
  title: string;
  toc: Category[];
  type: string;
}

export default function TopicDetailPage() {
  const params = useParams<{ id: string; slug: string; topicIndex: string; topicSlug: string }>();
  const searchParams = useSearchParams();
  const routeId = params?.id ?? "";
  const routeSlug = params?.slug ?? "";
  const routeTopicIndex = params?.topicIndex ?? "";
  const courseId = Number(routeId);
  const topicIdx = Number(routeTopicIndex);
  const fromPath = safeFromPath(searchParams.get("from"));
  const fromPathsPage = Boolean(fromPath?.startsWith("/paths"));
  const fromProjectsPage = Boolean(fromPath?.startsWith("/projects"));
  const sectionCrumb = fromPathsPage
    ? { label: "Paths", href: fromPath ?? "/paths" }
    : fromProjectsPage
      ? { label: "Projects", href: fromPath ?? "/projects" }
      : { label: "Courses", href: "/courses" };

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [initialCompleted, setInitialCompleted] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (isNaN(courseId) || isNaN(topicIdx)) {
      setMissing(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      apiPost<TopicDetail>("/api/topic-details", { course_id: courseId, topic_index: topicIdx }),
      apiPost<CourseDetail>("/api/course-details", { course_id: courseId }).catch(() => null),
    ])
      .then(([topicData, courseData]) => {
        if (cancelled) return;
        setTopic(topicData);
        setCourse(courseData);
        setInitialCompleted(getProgress().completed[String(courseId)] ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setMissing(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [courseId, topicIdx]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <AppNavbar crumbs={[sectionCrumb, { label: "…" }]} />
        <div className="flex flex-1">
          <main className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto px-8 py-10 space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: "65%" }} />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: "100%" }} />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: "92%" }} />
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mt-4" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (missing || !topic) return notFound();

  return (
    <TopicLayoutClient
      courseId={courseId}
      slug={routeSlug}
      fromPath={fromPath}
      course={course}
      topic={topic}
      initialCompleted={initialCompleted}
    />
  );
}
