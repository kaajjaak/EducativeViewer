import { NextResponse } from "next/server";
import { rows } from "@/utils/db";

export async function GET() {
  const data = rows(
    `SELECT id, slug, title, type
     FROM courses
     WHERE COALESCE(LOWER(TRIM(type)), '') NOT IN ('path', 'project')
       AND COALESCE(is_active, 1) = 1
     ORDER BY id`,
  );
  return NextResponse.json(data);
}
