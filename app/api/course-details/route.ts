import { NextResponse } from "next/server";
import { row } from "@/utils/db";

interface CourseRow {
  id: number;
  slug: string;
  title: string;
  type: string;
  toc_json: string | null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const courseId = Number(body.course_id);
  if (!Number.isFinite(courseId)) {
    return NextResponse.json(
      { error: "Missing required field: course_id" },
      { status: 400 },
    );
  }

  const r = row<CourseRow>(
    `SELECT id, slug, title, type, toc_json
     FROM courses
     WHERE id = ? AND COALESCE(is_active, 1) = 1`,
    [courseId],
  );
  if (!r) {
    return NextResponse.json(
      { error: `Course id=${courseId} not found` },
      { status: 404 },
    );
  }

  let toc: unknown = [];
  try {
    toc = JSON.parse(r.toc_json || "[]");
  } catch {
    toc = [];
  }

  return NextResponse.json({
    id: r.id,
    slug: r.slug,
    title: r.title,
    type: r.type,
    toc,
  });
}
