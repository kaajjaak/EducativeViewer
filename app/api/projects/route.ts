import { NextResponse } from "next/server";
import { rows } from "@/utils/db";

export async function GET() {
  const data = rows(
    `SELECT p.id, c.id AS course_id, p.project_author_id, p.project_collection_id,
            p.project_work_id, p.project_title, p.project_url_slug, p.scraped_at,
            c.slug AS course_slug, c.title AS course_title, c.type AS course_type
     FROM projects p
     LEFT JOIN courses c ON c.project_id = p.id
     WHERE COALESCE(p.is_active, 1) = 1
       AND (c.is_active IS NULL OR c.is_active = 1)
     ORDER BY p.id`,
  );
  return NextResponse.json(data);
}
