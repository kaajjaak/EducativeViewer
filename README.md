# EducativeViewer

Read-only viewer for scraped Educative courses. A single Next.js app reads a
SQLite database directly and renders every Educative component type the
scraper captures — code playgrounds, quizzes, widgets, diagrams, and so on.
There is no login, no backend service, and no network dependency except
Judge0 (for code execution) and `cdn.jsdelivr.net` (for Mermaid).

Pairs with the scraper at
<https://github.com/anilabhadatta/educative.io_scraper> — it produces the
SQLite DB and `api` folder this viewer consumes.

## Requirements

- Node.js 20+
- A course SQLite database (`*.db`)
- Optionally, an `api.zip` of static assets from the scraper (images, SVGs)

## Setup

```bash
npm install
```

## Run

```bash
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm start          # run built app
npm run lint       # eslint
```

`/` redirects to `/courses`.

## Configuration

The default DB is `data/javascript-in-detail.db`. Point at a different file
with `DB_PATH`:

```bash
# macOS / Linux / Git Bash
DB_PATH=/absolute/path/to/other-course.db npm run dev
```

```powershell
# Windows PowerShell
$env:DB_PATH = "C:\path\to\other-course.db"
npm run dev
```

The DB is opened in read-only mode (`better-sqlite3`), so the app cannot
mutate scraper output.

## Static assets (images, SVGs, PNGs)

Educative topic content references assets at paths like
`/api/collection/<author>/<collection>/page/<page>/image/<id>`. The scraper
ships these in `api` folder. To serve them:

1. Copy at the repo root so files land under `./api/collection/...`.
2. Start (or restart) the dev server.

A catch-all route at `app/api/collection/[...slug]/route.ts` reads the file
from disk, sniffs the magic bytes (PNG / JPEG / GIF / WebP / SVG), and
serves it with the correct `Content-Type` and a one-year immutable cache
header. Path traversal is rejected.

`./api/` is git-ignored — assets are bulk data, not source.

## Layout

```
app/
  api/                       # JSON + asset route handlers (server-only)
    courses/                 # GET list of courses
    paths/                   # GET learning paths
    projects/                # GET projects + per-project course lookup
    course-details/          # GET course metadata + TOC
    topic-details/           # GET a topic + its components
    collection/[...slug]/    # serves images from ./api/ with sniffed MIME
  courses/                   # course browser UI
    [id]/[slug]/             # course landing
      topics/[topicIndex]/[topicSlug]/   # topic view
  paths/    projects/        # path / project browsers
  service/
    code-test/execute/       # Judge0 proxy for CodeTest widgets
  layout.tsx  page.tsx  not-found.tsx  globals.css
components/
  edu-viewer/                # shell: navbar, sidebars, TOC, nav events,
                             # dark-mode toggle, progress bar, search
  topic-details/             # 44 widget renderers (one per Educative type)
utils/
  db.ts                      # better-sqlite3 singleton
  apiClient.ts               # thin same-origin fetch wrapper
  component-registry.tsx     # type → renderer mapping + feature flags
  localProgress.ts           # completion tracking (localStorage)
  constants.ts               # resolveEduUrl (asset path passthrough)
  use-prepared-image.ts      # async image preparation hook
  image-source.ts  svg-helpers.ts  color-helpers.ts
  monaco-language.ts  text.ts  theme.ts
data/
  javascript-in-detail.db    # example course DB (+ -shm / -wal)
api/                         # extracted asset tree (git-ignored)
```

## Database schema

Six tables produced by the scraper:

| table           | purpose                                          |
| --------------- | ------------------------------------------------ |
| `paths`         | learning paths (grouped courses)                 |
| `courses`       | course metadata, TOC JSON, cloudlab / project id |
| `projects`      | standalone Educative projects                    |
| `topics`        | topic rows, one per page, with slug + url        |
| `components`    | individual components inside each topic          |
| `static_assets` | per-topic asset manifests (image paths)          |

`components.content_json` is the raw Educative component payload; the
renderer map in `utils/component-registry.tsx` picks the React component
for each `type`.

## Supported component types

44 widgets in `components/topic-details/`, including:

- **Text / markup**: MarkdownEditor, SlateHTML, Latex, SpoilerEditor,
  Table, TableHTML, Columns
- **Code**: Code, TabbedCode, EditorCode, CodeTest (Judge0), RunJS,
  Sandpack, WebpackBin, CodeDrawing
- **Media**: Image, Video, File, ButtonLink, Adaptive
- **Diagrams**: Mermaid, Graphviz, MarkMap, SequenceDiagrams, MxGraphWidget,
  DrawIOWidget, CanvasAnimation
- **Data viz**: Chart, Matrix, BinaryTree, NaryTree, LinkedList, Stack,
  HashTable, EducativeArray, Permutation
- **Interactive**: Quiz, StructuredQuiz, MatchTheAnswers, APIWidget,
  InstaCalc, Notepad, LazyLoadPlaceholder

Disable types globally via `DISABLED_COMPONENTS` in `utils/component-registry.tsx`.

## Code execution (CodeTest)

`CodeTest` posts to `/service/code-test/execute`, which proxies
<https://ce.judge0.com>. Language list is cached server-side for 10 minutes.
Multi-file submissions are bundled into a zip via `jszip` before forwarding.
No API key is used — the public Judge0 instance is rate-limited, so heavy
use will eventually 429.

## Progress tracking

Completed topics and recently-visited courses are stored in `localStorage`
under the `ev_progress` key. Per-browser only, no server sync, no account.
Clear site data to reset.

## Tech stack

- **Next.js 16** (App Router, React Server Components)
- **React 19**, **TypeScript 5**, **Tailwind CSS 4**
- **better-sqlite3** for synchronous reads
- **Monaco** + **Sandpack** for in-browser editors
- **Framer Motion**, **lucide-react**, **highlight.js**, **KaTeX**,
  **Chart.js**, **Mermaid** (loaded lazily from jsDelivr)

## Deploying

Because the app reads a SQLite file at runtime, deploy on a host that
supports a writable-ish filesystem and long-lived Node processes — any
Node VM, Docker container, or platform like Railway/Fly/Render. The app
won't work on pure edge/serverless runtimes that forbid filesystem access
(standard Vercel serverless can work if the DB and `./api/` tree are
bundled with the build, but cold starts will be slow on a large DB).

## License

See `LICENSE`.
