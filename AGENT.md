# AGENT.md - SpellboundMaze

## Project Overview
SpellboundMaze is a React-based educational spelling game where kids navigate a maze collecting letters to spell words. Parents manage word lists and profiles.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **State:** React hooks + localStorage (no backend)
- **Deployment:** Static build served via LAN or GitHub Pages

## Project Structure
```
react-app/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Route-level page components
│   ├── lib/           # Game engine, persistence, utilities
│   ├── types/         # TypeScript type definitions
│   └── App.tsx        # Root component with routing
├── public/
│   └── avatars/       # Avatar images
├── vite.config.ts     # Vite config (base: './', host: 0.0.0.0)
└── dist/              # Production build output (gitignored)
```

## Development Commands
```powershell
cd react-app
npm install          # Install dependencies
npm run dev          # Start dev server (LAN accessible on port 5173)
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
```

## Key Conventions
- Use TypeScript for all new files (`.tsx` / `.ts`)
- Use `@/` alias for imports from `src/` (e.g., `@/lib/persistence`)
- Use `import.meta.env.BASE_URL` for asset paths — never hardcode `/`
- Keep game logic in `src/lib/gameCore.js` separate from React components
- Store user data via `src/lib/persistence.ts` — all reads/writes go through this module

## Asset Paths
The app uses `base: './'` in Vite config for relative paths. Always reference public assets like:
```ts
const src = import.meta.env.BASE_URL + 'avatars/example.png';
```

## Testing
- No test framework currently configured
- Test LAN access by running `npm run dev` and connecting from another device on the same network

## Common Pitfalls
- **Broken links after build:** Always use relative paths via `BASE_URL`, not absolute `/` paths
- **Network access not working:** Ensure Windows Firewall allows TCP port 5173 (inbound rule needed)
- **Data not shared across devices:** localStorage is per-device — this is a known limitation

## Git Workflow
- Single `master` branch
- Always `git pull` before pushing to avoid merge conflicts
- Commit messages follow: `type: short description` (e.g., `fix:`, `feat:`, `docs:`)