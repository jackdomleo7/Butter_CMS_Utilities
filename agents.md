# Agent Instructions: Butter CMS Utilities

## Project Overview

**Butter CMS Utilities** is an unofficial, privacy-first client-side utility suite for [Butter CMS](https://buttercms.com/). It provides tools not available out of the box, runs entirely in the browser, and stores all configurations locally.

**Current features:** Search Content (across pages, collections, and blog posts)

**Stack:** Vue 3 (Composition API), TypeScript (Strict), Vite, Pinia, SCSS, Vitest, pnpm

---

## Commands

```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (http://localhost:5173)
pnpm run build        # Build for production
pnpm run typecheck    # TypeScript type checking
pnpm run lint         # ESLint with auto-fixes
pnpm run format       # Format with Prettier
pnpm run test:unit    # Run Vitest (add file path for specific tests)
```

---

## Core Coding Principles

- **Always use `<script setup lang="ts">`** for Vue components
- **PascalCase filenames** (e.g., `SearchItem.vue`)
- **Props:** `defineProps<{ ... }>()` with full types; **Events:** `defineEmits<{ ... }>()` with camelCase names
- **No `any`** - use `unknown` or interfaces from `@/types.ts`
- **No Options API** - never use `data()`, `methods`, or `computed()` outside `<script setup>`
- **Don't mutate props** - emit events to parent instead
- **Reactivity:** `ref()` for primitives/arrays, `reactive()` only for complex objects, `computed()` for derived state
- **Use `v-memo`** on `v-for` lists to prevent unnecessary re-renders
- **Keep components focused** - single responsibility

---

## State Management

Uses **Pinia** with **localStorage** for persistence:

1. App loads → hydrates from `localStorage.butter_cms_config`
2. User updates config → Pinia watchers save changes to localStorage
3. Components access via store computed properties

```typescript
import { useStore } from '@/stores'

const store = useStore()
store.token = 'new_token'  // Auto-persists to localStorage
```

Store structure: Single `config` ref with deep watchers. Cleans up `selectedScopes` when page types/collection keys are deleted.

**Important:** Maintain backwards compatibility when adding new config properties—users may have old localStorage schemas.

---

## Conventional Commits

Format: `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`

Examples:
```
feat(search): add filter by date range
fix(store): persist collection keys to localStorage
test(searchContent): add unit tests for filtering
```

---

## Quality Standards

- **Accessibility:** Must be high—use semantic HTML and ARIA where appropriate
- **@src/core coverage:** Minimum **98%+ unit test coverage** with meaningful tests covering multiple scenarios
- **Component reuse:** Always use existing components from `@/components` (`Btn.vue`, `TextInput.vue`, `Modal.vue`, `InfoBanner.vue`, `Chip.vue`, etc) instead of creating new HTML/CSS
- **WhatsNew.vue:** Displays changelog to users on revisit. Add new features to the `features` array with `utcDatetimeAdded` timestamps. Modal auto-shows only new items based on `butter_cms_last_visit` localStorage key.

---

## For AI Agents: Auto-Update This File When You:

- Add new core features
- Change tech stack or major dependencies
- Establish new coding conventions or patterns
- Modify state management or API structure
- Change project structure

**Do NOT update for:** bug fixes, minor refactors, or individual component changes.

---

## Before Submitting Changes

```bash
pnpm run typecheck  # Verify type safety
pnpm run lint       # Fix linting issues
pnpm run format     # Format code
pnpm run test:unit  # Run tests (especially @src/core with 98%+ coverage)
```
