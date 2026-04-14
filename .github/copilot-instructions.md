# UIGen — AI-Powered React Component Generator

See [CLAUDE.md](../CLAUDE.md) for full architecture, commands, and detailed guidance.

## Code Style

- **Language**: TypeScript (strict mode, ESM)
- **Imports**: Use `@/` path aliases for internal imports (e.g., `@/components/editor`)
- **React**: Server components by default; `"use client"` only where state/hooks needed
- **Styling**: Tailwind v4 + Radix UI primitives (no inline styles)
- **Testing**: Vitest + React Testing Library in jsdom environment

## Architecture

UIGen's core innovation is the **Virtual File System** — an in-memory file abstraction that enables code generation and preview without disk writes.

### Key Concepts
- **VirtualFileSystem** ([src/lib/file-system.ts](../src/lib/file-system.ts)): Manages files in JSON-serializable state; paths always normalized to `/path/format`
- **AI Integration** ([src/app/api/chat/route.ts](../src/app/api/chat/route.ts)): Uses Anthropic Claude with 2 custom tools (`str_replace_editor`, `file_manager`) to generate code
- **System Prompt** ([src/lib/prompts/generation.tsx](../src/lib/prompts/generation.tsx)): Directs Claude to create `/App.jsx` entry point using `@/` imports and Tailwind
- **Code Transformation** ([src/lib/transform/jsx-transformer.ts](../src/lib/transform/jsx-transformer.ts)): Client-side Babel transform → ES modules with blob URLs for live preview
- **State Contexts**: [FileSystemContext](../src/lib/contexts/file-system-context.tsx) owns file state; [ChatContext](../src/lib/contexts/chat-context.tsx) manages messages and persistence

## Build and Test

```bash
npm run setup       # Install deps, generate Prisma, migrate DB (run first)
npm run dev         # Start dev server (Turbopack, :3000)
npm run build       # Build for production
npm run lint        # ESLint check
npm run test        # Vitest (watch mode)
npm run db:reset    # Force reset SQLite database
```

Database: SQLite at `prisma/dev.db` (auto-created). Use `.env` to set `ANTHROPIC_API_KEY`.

## Conventions

| Area | Convention | Notes |
|------|-----------|-------|
| **Paths** | Always start with `/`, no trailing `/` | Normalize before VirtualFileSystem operations |
| **Imports** | `@/components/...`, `@/lib/...` | Non-library imports always use alias |
| **Entry Point** | Must create `/App.jsx` first | Preview auto-detects App.jsx or index.jsx |
| **CSS** | Separate from JS via regex | CSS imports detected and removed from Babel; handled in preview separately |
| **Tool str_replace** | `old_str` must match exactly | Case-sensitive including whitespace; use 3+ context lines |
| **Serialization** | Call `fileSystem.serialize()` before DB save | Must handle JSON roundtrip for persistence |
| **maxSteps Limit** | 40 steps for Claude, 4 for mock | Prevents runaway generation; be aware when designing complex flows |
| **API Key** | Optional for development | Without `ANTHROPIC_API_KEY`, app returns static code (mock provider) |

## Critical Gotchas

1. **Missing `/App.jsx`** — Preview fails if entry point isn't created first
2. **Path normalization** — All VirtualFileSystem operations require normalized paths (`/path/format`)
3. **CSS handling** — CSS imports separated from Babel output; must be injected into preview separately
4. **Tool exact match** — `str_replace_editor` tool requires exact `old_str` match (whitespace-sensitive)
5. **TypeScript strict** — No implicit `any`; use explicit types or assertions
6. **Sandbox restrictions** — Preview iframe needs proper permissions for blob URLs in import maps
7. **Anonymous sessions** — Work is tracked but not persisted across sessions (null userId projects)

## Testing Guidance

Test files use Jest/Vitest patterns. Key examples:
- [Component tests](../src/components/chat/__tests__) use `vi.mock()` for hooks
- [VirtualFileSystem tests](../src/lib/__tests__/file-system.test.ts) verify path normalization and operations
- Run `npm run test` to watch; tests run in jsdom environment

For more details on testing patterns and context providers, see CLAUDE.md.
