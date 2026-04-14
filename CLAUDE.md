# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server with Turbopack on :3000
- `npm run build` - Build the Next.js application for production
- `npm run lint` - Run ESLint to check code quality
- `npm run test` - Run tests with Vitest (watch mode)
- `npm run test -- --run` - Run tests once without watch mode
- `npm run test -- <pattern>` - Run a single test file or pattern (e.g. `npm run test -- ChatInterface`)
- `npm run setup` - Install dependencies, generate Prisma client, and run database migrations (run first)
- `npm run db:reset` - Reset the database (force migrate reset)

## Architecture Overview

UIGen is an AI-powered React component generator that uses a virtual file system to create and preview components without writing files to disk.

### Request Flow

```
User prompt → ChatContext → POST /api/chat { messages, files, projectId }
  → Claude streams tool calls → FileSystemContext.handleToolCall()
  → VirtualFileSystem updated → PreviewFrame re-renders iframe
  → Project saved to Prisma (authenticated users only)
```

### Virtual File System

The core is `VirtualFileSystem` (`src/lib/file-system.ts`) — an in-memory file abstraction:

- All paths must be normalized to `/path/format` (leading slash, no trailing slash)
- Serializes/deserializes file state as plain JSON for database persistence via `serialize()` / `deserializeFromNodes()`
- Integrates with AI tools through `FileSystemContext`

### AI Integration & Tools

- Uses Anthropic Claude via Vercel AI SDK (`src/app/api/chat/route.ts`)
- `/api/chat` receives `{ messages, files, projectId }` — `files` is serialized VirtualFileSystem state
- Two custom tools defined in `src/lib/tools/`:
  - `str_replace_editor` — create and edit files; `old_str` must match exactly (whitespace-sensitive, use 3+ context lines)
  - `file_manager` — rename and delete files
- System prompt (`src/lib/prompts/generation.tsx`) directs Claude to always create `/App.jsx` as the entry point using `@/` imports and Tailwind
- Max steps: 40 (real API), 4 (mock). Without `ANTHROPIC_API_KEY`, `MockLanguageModel` (`src/lib/provider.ts`) returns a static multi-step demo (Counter → Form → Card)
- Prompt caching is enabled via Anthropic ephemeral cache control on the system prompt

### Code Transformation & Preview

`src/lib/transform/jsx-transformer.ts` handles client-side Babel transformation of generated JSX:

- CSS imports are detected via regex and stripped from the Babel pass; they're injected into the preview separately
- Produces ES modules with blob URLs used in import maps for live preview in a sandboxed iframe
- Local `@/` and `/` paths → blob URLs; third-party packages (e.g. `react`, `lucide-react`) → esm.sh CDN URLs
- Preview auto-detects `/App.jsx` or `/index.jsx` as the entry point — preview fails if neither exists

### Authentication & Sessions

- JWT HS256 sessions (`src/lib/auth.ts`): 7-day expiry, stored in `auth-token` httpOnly cookie
- Server actions in `src/actions/`: `signUp`, `signIn`, `signOut`, `getUser`, `createProject`, `getProject`, `getProjects`
- Anonymous users' work is tracked in localStorage via `src/lib/anon-work-tracker.ts` but not persisted across sessions

### Project Persistence

- SQLite via Prisma; Prisma client generated to `src/generated/prisma` (not the default location)
- `Project.messages` — JSON array of chat messages (serialized string)
- `Project.data` — JSON object of VirtualFileSystem state (serialized string)
- `userId` is nullable; only authenticated users' projects survive across sessions

### Context Providers

- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — owns the `VirtualFileSystem` instance, processes AI tool calls, exposes file operations
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — wraps Vercel AI SDK's `useChat`, integrates with `FileSystemContext`, handles persistence

### Tests

Tests use Vitest + React Testing Library (jsdom). Files live in `__tests__/` subdirectories alongside their source — e.g. `src/lib/__tests__/file-system.test.ts`, `src/components/chat/__tests__/ChatInterface.test.tsx`. Coverage spans `lib/`, `lib/contexts/`, `lib/transform/`, `components/chat/`, `components/editor/`, and `hooks/`.

### Code Conventions

| Area | Convention |
|------|-----------|
| **Imports** | `@/` path aliases for all internal imports |
| **React** | Server components by default; `"use client"` only where state/hooks are needed |
| **Styling** | Tailwind v4 + Radix UI primitives; no inline styles |
| **TypeScript** | Strict mode; no implicit `any` |
| **Paths** | Always start with `/`, no trailing slash; normalize before all VirtualFileSystem operations |
| **Entry point** | AI must create `/App.jsx` first; preview will fail without it |

## Critical Gotchas

1. **Missing `/App.jsx`** — Preview fails silently if the entry point isn't created first
2. **Path normalization** — VirtualFileSystem operations will break with un-normalized paths
3. **CSS handling** — CSS imports must be separated from Babel output and injected into the preview separately
4. **Exact string match** — `str_replace_editor` requires `old_str` to match exactly (including whitespace)
5. **Prisma client location** — Generated to `src/generated/prisma`, not the default `node_modules/@prisma/client`

## Development Best Practices

- Use comments sparingly. Only comment complex code.
- Follow the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/#specification) for commit messages.
- Always use context7 when you need code generation, setup or configuration steps, or library/API documentation. Use the Context7 MCP tools to resolve library id and get library docs automatically.
