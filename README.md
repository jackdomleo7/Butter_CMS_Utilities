# Butter CMS Utilities

An unofficial collection of client-side utilities for Butter CMS. These tools fill gaps in the Butter CMS workflow that are not available out of the box.

## 🎯 What This Is

A simple, focused web application that provides utilities for working with Butter CMS content. All operations run entirely in your browser - no servers, no data collection, no third-party tracking.

## 🔒 Privacy & Security

**Everything happens in your browser:**
- No API tokens stored on servers
- No usage analytics or tracking
- No server-side logging
- No data shared with third parties
- Your Butter CMS token makes direct API calls to Butter CMS only
- Settings stored locally in your browser's localStorage

**Only requires a read-only API token.** This application never writes or modifies your Butter CMS content.

## 🚀 Usage

1. Visit [buttercmsutilities.jackdomleo.dev](https://buttercmsutilities.jackdomleo.dev/)
2. Enter your read-only Butter CMS API token
3. Configure your page types and collection keys (optional, for search functionality)
4. Use the utilities

Your configuration is saved locally in your browser for convenience.

## 🛠️ Current Utilities

### Search Content
Search for specific content across your Butter CMS account:
- Search across blog posts, page types, and collections simultaneously
- Search for items containing OR NOT containing specific terms
- See exactly where matches were found with context snippets
- Highlighted matches for easy scanning
- Include draft content or published only

## 🔧 Development

Built with:
- **Vue 3** (Composition API with `<script setup>`)
- **TypeScript** (Strict mode)
- **Vite** for lightning-fast development
- **Pinia** for state management
- **SCSS** for styling
- **Vitest** for unit testing

### Setup

```bash
pnpm install
pnpm run dev
```

### Commands

```bash
pnpm run build        # Build for production
pnpm run typecheck    # TypeScript type checking
pnpm run lint         # ESLint with auto-fixes
pnpm run format       # Format with Prettier
pnpm run test:unit    # Run unit tests
```

## 📝 Contributing

Contributions welcome! Please ensure:

```bash
pnpm run typecheck  # Must pass with 0 errors
pnpm run lint       # Must pass with 0 errors
pnpm run format     # Format all code
pnpm run test:unit  # All tests must pass
```

See [agents.md](agents.md) for detailed coding guidelines.

## 📄 License

MIT - Feel free to use, modify, and share!

## ⚠️ Disclaimer

This is an unofficial tool and is not affiliated with or endorsed by Butter CMS.
