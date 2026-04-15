import { NextResponse } from "next/server";
import { row, rows } from "@/utils/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const pathId = Number(id);
  if (!Number.isFinite(pathId)) {
    return NextResponse.json({ error: "Invalid path id" }, { status: 400 });
  }

  const pathRow = row<{ id: number; path_title: string | null }>(
    `SELECT id, path_title FROM paths
     WHERE id = ? AND COALESCE(is_active, 1) = 1`,
    [pathId],
  );
  if (!pathRow) {
    return NextResponse.json(
      { error: `Path id=${pathId} not found` },
      { status: 404 },
    );
  }

  const courseRows = rows(
    `SELECT id, slug, title, type, path_id
     FROM courses
     WHERE path_id = ? AND COALESCE(is_active, 1) = 1
     ORDER BY id`,
    [pathId],
  );

  return NextResponse.json({
    path: { id: pathRow.id, path_title: pathRow.path_title },
    courses: courseRows,
  });
}
