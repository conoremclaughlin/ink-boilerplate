# Agent Guidelines

This is the **canonical reference** for all AI agents working in this repository. If you're Claude, Gemini, GPT, or any other model: this file is for you. Model-specific files (CLAUDE.md, GEMINI.md) point here.

## Session Initialization (IMPORTANT)

**At the start of every new session**, establish identity and call bootstrap:

### Step 1: Determine Your Identity

Identity is resolved in layers. **Stop at the first match** — do not continue checking lower layers:

1. **System prompt override**: If the system prompt contains an "Identity Override" section specifying your agent ID, use that. **Stop here.**
2. **Environment variable**: Run `echo $AGENT_ID` in a shell. If it returns a non-empty value, use that as your agentId. **Stop here.**
3. **Repo-level identity**: Read `.ink/identity.json` in the current repo.
4. **Central config**: Read `~/.ink/config.json` agentMapping.

### Step 2: Load User Config

Read from `~/.ink/config.json`:

```json
{"userId": "...", "email": "...", "agentMapping": {"claude-code": "wren", ...}}
```

### Step 3: Call Bootstrap with Identity

```
bootstrap(userId: "<from config>", agentId: "<your identity>")
```

### Step 4: Start or Resume Session

Read `studioId` from `.ink/identity.json` (if present) and pass it to `start_session`.

Throughout the session, use `update_session_phase` for structural status changes and `remember` for decisions, insights, and important events.

**Note**: Never commit PII (emails, user IDs) to the repository. Always read from config files.

## Project Overview

<!-- Replace this section with your project's description -->

This is a yarn workspaces monorepo:

- **`packages/web`** — Next.js web application (Next.js 16, React 19, Tailwind v4, shadcn/ui on Base UI, TanStack Query)

## UI Components (required)

UI is built from [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com), with Tailwind CSS v4. Components live in `packages/web/src/components/ui/`, added by the shadcn CLI and owned by this repo.

- **Never hand-build a component the library already has.** Import it: `import { Button } from '@/components/ui/button'`.
- **Add a missing one with the CLI, from `packages/web`**, rather than copying code from the docs or another project:

  ```bash
  npx shadcn@latest add <component> --dry-run   # see what it will write
  npx shadcn@latest add <component>
  ```

  `components.json` records the setup (style `base-nova`, base colour `neutral`, lucide icons). Commit a generated file before changing it, then make any change in its own commit, so the diff shows it. If the CLI offers to overwrite a file you've changed, say no.

- **Theme in one place.** Colours, radius and fonts are CSS variables in `src/app/globals.css` (light and `.dark`). Use the roles (`bg-primary`, `text-muted-foreground`, `border-border`) rather than raw colours, so a theme change reaches every component.
- **Start from shadcn's defaults.** Learn from them before departing from them, and when you do depart, make the change in the theme or in the component, not in one page.

## Architecture

```
packages/
  web/
    src/
      app/           # Next.js App Router pages
      components/    # React components
      lib/           # Utilities and shared logic
```

## Coding Conventions

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full reference on coding style, git conventions, and PR process. Key points:

- Strict TypeScript, avoid `any`
- Angular commit convention: `feat(scope): description`
- Do not squash commits on merge
- camelCase for variables/functions, PascalCase for types/components

## Development Commands

```bash
# Root
yarn install          # Install all workspaces
yarn dev              # Web dev server
yarn build            # Build all packages
yarn lint             # Lint all packages
yarn type-check       # Type-check all packages
yarn test             # Run all tests
```
