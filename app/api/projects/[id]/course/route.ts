import { NextResponse } from "next/server";
import { row } from "@/utils/db";

interface Joined {
  id: number;
  project_author_id: string;
  project_collection_id: string;
  project_work_id: string;
  project_title: string | null;
  project_url_slug: string | null;
  scraped_at: string;
  course_id: number;
  course_slug: string | null;
  course_title: string | null;
  course_type: string | null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  const r = row<Joined>(
    `SELECT p.id, p.project_author_id, p.project_collection_id, p.project_work_id,
            p.project_title, p.project_url_slug, p.scraped_at,
            c.id AS course_id, c.slug AS course_slug, c.title AS course_title,
            c.type AS course_type
     FROM projects p
     JOIN courses c ON c.project_id = p.id
     WHERE p.id = ? AND COALESCE(p.is_active, 1) = 1 AND COALESCE(c.is_active, 1) = 1`,
    [projectId],
  );

  if (!r) {
    return NextResponse.json(
      { error: `Project id=${projectId} not found` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    project: {
      id: r.id,
      project_author_id: r.project_author_id,
      project_collection_id: r.project_collection_id,
      project_work_id: r.project_work_id,
      project_title: r.project_title,
      project_url_slug: r.project_url_slug,
      scraped_at: r.scraped_at,
    },
    course: {
      id: r.course_id,
      slug: r.course_slug,
      title: r.course_title,
      type: r.course_type,
    },
  });
}
