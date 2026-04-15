"use client";

import { useState, useEffect } from "react";
import AppNavbar from "@/components/edu-viewer/AppNavbar";
import CoursesListClient from "@/components/edu-viewer/CoursesListClient";
import { apiGet } from "@/utils/apiClient";
import { getProgress } from "@/utils/localProgress";
import type { ProgressData } from "@/utils/localProgress";
import ScrollToTop from "@/components/edu-viewer/ScrollToTop";

interface Course {
  id: number | string;
  title: string;
  description?: string;
  slug?: string;
  type?: string;
  [key: string]: unknown;
}

function isBrowsableCourseType(type: unknown): boolean {
  if (typeof type !== "string") return true;
  const normalized = type.trim().toLowerCase();
  return normalized !== "path" && normalized !== "project";
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<ProgressData>({ course_order: [], completed: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<Course[]>("/api/courses")
      .then((data) => {
        if (cancelled) return;
        setCourses(data.filter((c) => isBrowsableCourseType(c.type)));
        setProgress(getProgress());
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load courses");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AppNavbar crumbs={[{ label: "Courses" }]} />
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mb-5" />
          <div className="space-y-3">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNavbar crumbs={[{ label: "Courses" }]} />
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">All Courses</h1>
          {!error && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {courses.length} course{courses.length !== 1 ? "s" : ""} available
            </p>
          )}
        </div>
      </div>
      <CoursesListClient
        courses={courses}
        courseOrder={progress.course_order}
        error={error ?? undefined}
        isAdmin={false}
        authToken=""
      />
      <ScrollToTop />
    </div>
  );
}
