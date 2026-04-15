const KEY = "ev_progress";

export interface ProgressData {
  course_order: number[];
  completed: Record<string, number[]>;
}

const EMPTY: ProgressData = { course_order: [], completed: {} };

function read(): ProgressData {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, completed: {} };
    const parsed = JSON.parse(raw) as Partial<ProgressData>;
    return {
      course_order: Array.isArray(parsed.course_order) ? parsed.course_order : [],
      completed:
        parsed.completed && typeof parsed.completed === "object"
          ? parsed.completed
          : {},
    };
  } catch {
    return { ...EMPTY, completed: {} };
  }
}

function write(p: ProgressData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* quota, serialization, etc. — ignore */
  }
}

export function getProgress(): ProgressData {
  return read();
}

export function recordTopicVisit(
  courseId: number,
  topicIndex: number,
  completed = false,
): void {
  const p = read();

  p.course_order = [courseId, ...p.course_order.filter((id) => id !== courseId)];

  const key = String(courseId);
  const list = new Set(p.completed[key] ?? []);
  if (completed) list.add(topicIndex);
  else list.delete(topicIndex);
  p.completed[key] = Array.from(list).sort((a, b) => a - b);

  write(p);
}

export function resetCourseProgress(courseId: number): void {
  const p = read();
  p.course_order = p.course_order.filter((id) => id !== courseId);
  delete p.completed[String(courseId)];
  write(p);
}
