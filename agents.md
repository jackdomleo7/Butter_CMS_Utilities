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

**Reactivity:**
- `ref()` for primitives and arrays
- `shallowRef()` for large arrays/objects that are always replaced wholesale, never mutated deeply (e.g., search result lists)
- `reactive()` only for complex objects
- `computed()` for derived state
- `v-memo` on `v-for` lists to optimize re-renders

**Component Design:**
- Single responsibility principle
- Reuse existing components before creating new ones

---

## Performance Optimization

**Shallow Reactivity for Large Collections:**
- Use `shallowRef()` for large arrays/objects (e.g., search results, audit findings) that are always replaced wholesale, never mutated deeply
- Example: `const results = shallowRef<Result[]>([]); results.value = largeArray` (safe)
- Avoid: `results.value.push(item)` with shallowRef (won't trigger updates - use ref instead)
- **Benefit:** Reduces reactivity overhead, faster renders, lower memory usage for datasets with 100+ items

**Code Splitting & Lazy Loading:**
- Use `defineAsyncComponent()` for components loaded conditionally or on-demand
- Currently applied to: Card, SearchContent, AuditContent, WhatsNew
- Keeps main bundle size minimal

**List Rendering Optimization:**
- Always use `v-memo` on `v-for` items when the list or dependencies might change frequently
- Syntax: `v-memo="[item, dependency1, dependency2]"`
- Prevents unnecessary child re-renders

---



All design tokens are defined in [_variables.scss](src/assets/styles/_variables.scss) and [_colors.scss](src/assets/styles/_colors.scss).

**Use CSS custom properties (not SCSS variables):** `--font-size-*`, `--space-*`, `--gray-*`, `--text-*`, `--bg-*`, `--border-*`, `--radius-*`, `--shadow-*`, `--transition-*`

**Font weights:** Hardcode directly: 400 (normal), 500 (medium), 600 (semibold)

**Color strategy:**
- Primary palette: Neutral grays (`--gray-50` through `--gray-900`)
- Links: `--accent-blue` (#0505e5)
- Highlights: `--accent-yellow` (#fbe700) - use sparingly
- All text must meet WCAG AA contrast standards

**SCSS:** Only use for breakpoints, mixins, or computed values where CSS custom properties can't work

---

## Component Library

Always use existing components before creating new ones. Key components:

- **Btn.vue** - Button with loading state, status variants (primary/secondary/tertiary)
- **TextInput.vue** - Input with validation, native HTML icons (✘/✔)
- **Toggle.vue** - Binary switch (role="switch") with keyboard support
- **Accordion.vue** - Collapsible `<details>` with CSS Grid animation
- **Card.vue** - Content wrapper with `skeleton` prop for loading states
- **Chip.vue** - Badge/tag with optional close button
- **InfoBanner.vue** - Status messages (info/warning/error/success)
- **Modal.vue** - Dialog with focus trap, `aria-modal`
- **ApiConfiguration.vue** - Accordion with token input, page types, collections, draft toggle

### Component Patterns

**Toggle vs Checkbox:**
- Single binary choice (yes/no, on/off) → **Toggle**
- Multiple independent selections → **Checkbox**
- Example: Draft content = Toggle, Blog/Page Types = Checkboxes

**Card Component:**
- Skeleton loading: `<Card :skeleton="true" />` (show 3-5 during load)
- Results: `<Card>` wrapper with content slot

**Lazy Loading:**
- Use `defineAsyncComponent()` for Card, Modal, WhatsNew (loaded conditionally)
- SearchContent and ComingSoon are synchronous (rendered immediately)

---

## State Management

**Pinia** with **localStorage** persistence:
1. App loads → hydrates from `localStorage.butter_cms_config`
2. User updates config → watchers save to localStorage
3. Store has single `config` ref with deep watchers

**Important:** Maintain backwards compatibility for localStorage schemas

---

## Error Handling Pattern

**Search Content:**
- Try-catch per scope (blog/page type/collection)
- Log failures: `console.error("Failed to fetch page type 'X':", error)`
- Continue with successful scopes
- Return `failedScopes` array for UI display
- Only return `success: false` if ALL scopes fail

Reference: [searchContent.ts](src/features/searchContent.ts)

---

## Branding & Content

- **Tagline:** "I can't believe it's not Butter CMS!" (keep for personality)
- **Tone:** Professional, helpful, concise
- **Privacy:** Emphasize client-side execution, zero data collection
- **No AI mentions** - removed for professional positioning

---

## Testing Patterns

**General Guidelines:**
- Aim for 90%+ test coverage
- Focus on meaningful tests over coverage numbers
- Test user interactions, not implementation details

**TypeScript in Tests:**
- Avoid explicit `any` types - use type inference
- For component internals, create typed interfaces:
  ```typescript
  interface ComponentInstance extends ComponentPublicInstance {
    store: ReturnType<typeof useStore>
    internalProp: string
  }
  const getVm = (wrapper: ReturnType<typeof mount>) => 
    wrapper.vm as ComponentInstance
  ```

**Non-Null Assertions:**
- Use `!` when you're certain an element exists:
  ```typescript
  const button = wrapper.find('.my-button')!
  ```
- Only use when test context guarantees existence

**Common Patterns:**
- Test component rendering, props, events, and state
- Use `await wrapper.vm.$nextTick()` after state changes
- Mock external dependencies (APIs, localStorage, etc.)
- Test accessibility attributes (aria-label, role, etc.)

---

## Quality Standards

- **Accessibility:** WCAG AA 2.2, semantic HTML, proper ARIA, 24x24px minimum touch targets
- **Test coverage:** 90%+ overall with focus on core business logic
- **Component reuse:** Always use existing components before creating new HTML/CSS
- **Design consistency:** Follow design system tokens consistently
- **Functional minimalism:** Clean, focused UI prioritizing content legibility

---

## WhatsNew.vue Pattern

Add new features to `features` array with `utcDatetimeAdded` timestamps. Modal auto-shows based on `butter_cms_last_visit` localStorage key.

---

## Conventional Commits

Format: `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`

---

## Before Submitting

```bash
pnpm run typecheck  # Must pass with 0 errors
pnpm run lint       # Must pass with 0 errors  
pnpm run format     # Format all code
pnpm run test:unit  # All tests must pass (585+ tests)
```

**All commands must pass without errors.** Do not commit code with TypeScript or linting violations.

---

## For Maintainers

Update this file when you: add core features/components, change tech stack, establish new patterns, modify state management, or update design system.

**Do NOT update for:** bug fixes, minor refactors, or individual component changes.
