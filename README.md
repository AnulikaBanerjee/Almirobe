# My Wardrobe

A React + TypeScript wardrobe organizer with looks, laundry tracking, and photo uploads.

## Prerequisites

- **Node.js 18+** (recommended: latest LTS or current via Homebrew)
- **npm** (ships with Node)

Check your versions:

```bash
node -v
npm -v
```

### Install Node.js (macOS)

If `node` is not found:

```bash
brew install node
```

Or download from [nodejs.org](https://nodejs.org/).

## Local setup

From the project root:

```bash
cd /Users/anulika/Downloads/Wardrobe
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).

## Available scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run lint` | ESLint |

## Quick smoke test

After `npm run dev`:

1. Log in with any email/password (demo auth).
2. Open a wardrobe → **Open the Wardrobe**.
3. Add an item, toggle favorite/laundry, create a look.
4. Switch to **Looks** and **Laundry** tabs.

## Project structure

```
src/
  App.tsx              # Root state & routing between views
  data.ts              # Seed wardrobe data
  types.ts             # Shared TypeScript types
  components/          # UI components
  imageUtils.ts        # Photo resize helper
```

## Environment variables

Copy `.env.example` to `.env` when customizing providers (optional for local demo).

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_AUTH_PROVIDER` | `demo` | Auth backend (`demo` today; `supabase` future) |
| `VITE_STORAGE_PROVIDER` | `local` | Persistence backend (future) |
| `VITE_IMAGE_PROVIDER` | `auto` | Photo storage: `local-disk`, `indexeddb`, `supabase`, or `auto` |
| `VITE_SUPABASE_URL` | — | Supabase project URL (for cloud photos) |
| `VITE_SUPABASE_ANON_KEY` | — | Supabase anon key |

### Photo storage (persists across restarts)

| Mode | When | Where photos live |
|------|------|-------------------|
| **local-disk** (default in dev) | `npm run dev` | `data/uploads/` on disk, served at `/uploads/...` |

Wardrobe data in dev is saved to **`data/wardrobe-data.json`** (not just browser localStorage), so it survives refresh and server restarts. Use **http://localhost:5173** only — multiple dev servers on different ports each had separate browser storage (this is now prevented with `strictPort`).
| **indexeddb** | Production build without Supabase | Browser IndexedDB |
| **supabase** | `VITE_SUPABASE_URL` + key set | Supabase Storage bucket `wardrobe-images` |

To use Supabase Storage:

1. Create a Supabase project and a **public** bucket named `wardrobe-images`.
2. Copy `.env.example` → `.env` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_IMAGE_PROVIDER=supabase`.
3. `npm run dev` — uploads go to Supabase instead of the local folder.

## Auth architecture (swappable)

Sign-in uses a pluggable **AuthProvider** — same pattern as storage. Current mode is **demo** (simulated login, no real accounts).

```
src/auth/
  types.ts               # AuthUser + AuthProvider interface
  demoAuthProvider.ts    # Current backend (local simulation)
  createAuthProvider.ts  # Factory switch point (+ VITE_AUTH_PROVIDER)
  index.ts
```

To add Supabase Auth later: implement `AuthProvider`, register in `createAuthProvider()`, set `VITE_AUTH_PROVIDER=supabase`. `LoginScreen` stays unchanged.

A **Demo mode** banner appears on login and in the app so users know auth is not real yet.

## Storage architecture (swappable)

App code never calls `localStorage` directly. To switch to Supabase/cloud later:

1. Add `SupabaseStorageProvider` implementing `WardrobeStorageProvider` in `src/storage/`
2. Extend `StorageProviderKind` in `src/storage/types.ts`
3. Register it in `createStorageProvider()` — change one line in `App.tsx`

```
src/storage/
  types.ts                  # WardrobeData + WardrobeStorageProvider interface
  defaults.ts               # Seed data when nothing is saved
  localStorageProvider.ts   # Current backend
  createStorageProvider.ts  # Factory switch point
  useWardrobeData.ts        # React hook: load, debounced save, setters
  index.ts                  # Public exports
```

Saved key: `my-wardrobe-data-v1` (collections, items, looks, activeCollectionId).

## Recent features

- **First-time onboarding** — after welcome animation: “Book Professional Help” (disabled) or “Setup Wardrobe Yourself”
- **Wardrobe layout** — per wardrobe: display by **category** (tops, bottoms) or **shelf-wise** (Shelf 1, 2, …)
- **Optional season filters** — checkbox when creating/editing a wardrobe
- **Lent & Borrowed** tab — track items lent out or borrowed
- **App menu** (gold icon) — account details, plus placeholder entries for professional help, donation pickup, reports

## Fix plan (sequential)

Each step should be implemented, then verified with **automated checks + manual smoke test** before starting the next.

| Step | Fix | Automated checks | Manual test |
|------|-----|------------------|-------------|
| **0** | Local setup (this README) | `npm install`, `npm run typecheck`, `npm run build` | App loads at localhost:5173 |
| **1** | Lint cleanup (unused imports/vars) | `npm run lint` passes | No behavior change ✅ |
| **2** | Data persistence (pluggable storage + localStorage) | typecheck + build | Add item → refresh → item still there ✅ |
| **3** | Fix look editing (update, not duplicate) | typecheck + build | Edit look → same ID, no duplicate in gallery ✅ |
| **4** | Gallery look viewer item clicks | typecheck + build | From Looks tab, click item in look → detail opens ✅ |
| **5** | Look delete edge case (primary promotion) | typecheck + build | Delete primary item → look shows each piece once ✅ |
| **6** | Season filter UX | typecheck + build | “All seasons” clears filter; “All Season” filters tag ✅ |
| **7** | Minor polish (`ink-850`, favicon, timer cleanup) | lint + build | Laundry gradient renders; no console warnings ✅ |
| **8** | Auth decision (demo provider + banner, remove Supabase dep) | typecheck + build | Demo banner visible; sign-in still works ✅ |
| **9** | Wardrobe management (edit/delete collections) | typecheck + build | Rename/delete custom wardrobe works ✅ |
| **10** | Git init | — | Repo tracks source ✅ (`.env.example` added) |

### Parallel verification per step

Run these together after every code change:

```bash
npm run typecheck && npm run lint && npm run build
```

Then do the manual test for that step in the browser before moving on.
