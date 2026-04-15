import { NextResponse } from "next/server";
import { rows } from "@/utils/db";

export async function GET() {
  const data = rows(
    `SELECT p.id, p.path_author_id, p.path_collection_id, p.path_url_slug,
            p.path_title, p.scraped_at, COUNT(c.id) AS course_count
     FROM paths p
     LEFT JOIN courses c ON c.path_id = p.id
     WHERE COALESCE(p.is_active, 1) = 1
     GROUP BY p.id, p.path_author_id, p.path_collection_id, p.path_url_slug,
              p.path_title, p.scraped_at
     ORDER BY p.id`,
  );
  return NextResponse.json(data);
}
