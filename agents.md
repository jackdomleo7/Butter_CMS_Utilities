# Agent Instructions: Butter CMS Utilities

## Project Overview

**Butter CMS Utilities** is an unofficial, client-side utility suite for [Butter CMS](https://buttercms.com/). It provides tools not available out of the box, runs entirely in the browser, and stores all configurations in the browser local storage.

**Current features:** Search Content (across pages, collections, and blog posts), Audit for ugly HTML (across pages, collections, and blog posts)

**Stack:** Vue 3 (Composition API), TypeScript (Strict), Vite, Pinia, SCSS, Vitest, pnpm

---

## Commands

```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (http://localhost:5173)
pnpm run build        # Build for production
pnpm run typecheck    # TypeScript type checking - must pass before completion
pnpm run lint         # ESLint with auto-fixes - must pass before completion
pnpm run format       # Format with Prettier - must pass before completion
pnpm run test:unit    # Run Vitest (add file path for specific tests) - must pass before completion
```

---

## Core Coding Principles

**Vue Components:**
- Always use `<script setup lang="ts">` with Composition API
- PascalCase filenames (e.g. `SearchContent.vue`)
- Full prop types: `defineProps<{ ... }>()`
- Emit events with camelCase names: `defineEmits<{ ... }>()`
- Never mutate props - emit events to parent instead

**TypeScript:**
- Strict mode enabled - no `any` types
- Use type inference where clear, explicit types for props/interfaces
- Prefer `unknown` over `any` for truly dynamic values

**Reactivity & performance:**
- `ref()` for primitives and arrays
- `shallowRef()` for large arrays/objects that are always replaced wholesale, never mutated deeply (e.g., search result lists)
- `reactive()` only for complex objects
- `computed()` for derived state
- `v-memo` on `v-for` lists to optimize re-renders
- Use `defineAsyncComponent()` where appropriate
- Fail fast and handle errors gracefully

**Component Design:**
- Single responsibility principle
- Reuse existing components before creating new ones

**Design:**
- All design tokens are defined in [_variables.scss](src/assets/styles/_variables.scss) and [_colors.scss](src/assets/styles/_colors.scss)
- Use clean, legibility-first design
- No UI frameworks
- Use existing components from `src/components/` where possible
- Aim for WCAG 2.2 AA accessibility standard

**Testing:**
- New unit tests to be added for everything
- `src/core/` and `src/features/` aim for 95%+ coverage
- Everything else aim for 90%+ coverage
- All tests should test something meaningful

---

## State Management

**Pinia** with **localStorage** persistence:
1. App loads → hydrates from `localStorage.butter_cms_config`
2. User updates config → watchers save to localStorage
3. Store has single `config` ref with deep watchers

**Important:** Maintain backwards compatibility for localStorage schemas

---

## Branding & Content

- **Tone:** Professional, helpful, concise
- **Privacy:** Emphasize client-side execution, zero data collection, read-only token (never write permission token)

---

## Updates & Relevance

- Add new features to `features` array in `src/components/WhatsNew.vue`. Modal auto-shows based on `butter_cms_last_visit` localStorage key.
- Update `./README.md` and `./agents.md` when key changes are made to the project
