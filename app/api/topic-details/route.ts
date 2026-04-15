import { NextResponse } from "next/server";
import { row, rows } from "@/utils/db";

interface TopicRow {
  topic_name: string;
  topic_slug: string;
  topic_url: string;
  api_url: string;
  status: string;
}

interface ComponentRow {
  component_index: number;
  type: string;
  content_json: string | null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const courseId = Number(body.course_id);
  const topicIndex = Number(body.topic_index);
  if (!Number.isFinite(courseId) || !Number.isFinite(topicIndex)) {
    return NextResponse.json(
      { error: "Missing required field(s): course_id, topic_index" },
      { status: 400 },
    );
  }

  const topic = row<TopicRow>(
    `SELECT topic_name, topic_slug, topic_url, api_url, status
     FROM topics
     WHERE course_id = ? AND topic_index = ?`,
    [courseId, topicIndex],
  );
  if (!topic) {
    return NextResponse.json(
      { error: `Topic course_id=${courseId} topic_index=${topicIndex} not found` },
      { status: 404 },
    );
  }

  const componentRows = rows<ComponentRow>(
    `SELECT component_index, type, content_json
     FROM components
     WHERE course_id = ? AND topic_index = ?
     ORDER BY component_index`,
    [courseId, topicIndex],
  );

  const components = componentRows.map((r) => {
    let content: unknown = {};
    try {
      content = JSON.parse(r.content_json || "{}");
    } catch {
      content = {};
    }
    return { index: r.component_index, type: r.type, content };
  });

  return NextResponse.json({
    course_id: courseId,
    topic_index: topicIndex,
    topic_name: topic.topic_name,
    topic_slug: topic.topic_slug,
    topic_url: topic.topic_url,
    api_url: topic.api_url,
    status: topic.status,
    components,
  });
}
