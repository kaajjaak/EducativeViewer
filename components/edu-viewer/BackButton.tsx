"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

const PREV_PATH_KEY = "ev_prev_path";

function sanitizePath(path: string | null, currentPath: string): string | null {
  if (!path || !path.startsWith("/")) return null;
  const clean = path.split("#")[0];
  if (!clean || clean === currentPath) return null;
  return clean;
}

function isTopicDetailPath(path: string | null): boolean {
  if (!path) return false;
  return /\/courses\/[^/]+\/[^/]+\/topics\/\d+\/[^/]+$/.test(path);
}

function isCourseDetailPath(path: string | null): boolean {
  if (!path) return false;
  return /^\/courses\/[^/]+\/[^/]+$/.test(path);
}

function isParentRouteTarget(currentPath: string | null, targetPath: string): boolean {
  if (!currentPath || !targetPath.startsWith("/")) return false;
  const bareCurrent = currentPath.split("?")[0];
  const bareTarget = targetPath.split("?")[0];
  if (!bareTarget || bareTarget === "/") return false;
  return bareCurrent !== bareTarget && bareCurrent.startsWith(`${bareTarget}/`);
}

function labelFromPath(path: string): string {
  const bare = path.split("?")[0];
  if (bare.includes("/topics/")) return "Topic";
  if (/^\/courses\/[^/]+\/[^/]+$/.test(bare)) return "Course";
  if (bare.startsWith("/courses")) return "Courses";
  if (bare.startsWith("/paths")) return "Paths";
  if (bare.startsWith("/projects")) return "Projects";
  if (bare === "/") return "Home";
  return "Home";
}

export default function BackButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const previousPath = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      return sanitizePath(window.sessionStorage.getItem(PREV_PATH_KEY), pathname ?? "");
    } catch {
      return null;
    }
  }, [pathname]);

  const buttonCls =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-700 dark:hover:text-indigo-400 text-xs font-medium transition-all";

  const resolvedLabel = useMemo(() => {
    if ((label === "Home" || label === "Back") && previousPath) {
      return labelFromPath(previousPath);
    }
    return label;
  }, [label, previousPath]);

  const handleBack = () => {
    if (isTopicDetailPath(pathname) && href && href !== "back") {
      router.push(href);
      return;
    }

    if (
      isCourseDetailPath(pathname) &&
      isTopicDetailPath(previousPath?.split("?")[0] ?? null) &&
      href &&
      href !== "back"
    ) {
      router.push(href);
      return;
    }

    if (href && href !== "back" && isParentRouteTarget(pathname, href)) {
      router.push(href);
      return;
    }

    if (previousPath && typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    if (previousPath) {
      router.push(previousPath);
      return;
    }

    if (href && href !== "back") {
      router.push(href);
      return;
    }

    router.push("/");
  };

  return (
    <button type="button" onClick={handleBack} className={buttonCls}>
      {icon}
      {resolvedLabel}
    </button>
  );
}
