# PROJECT ARCHITECTURE AUDIT

> **Scope:** Analysis only. No source, dependency, schema, data, or environment changes were made.
> **Audit date:** 2026-10-10 · **HEAD:** `95c2990` ("Adding icons", 2026-08-02)
> **Working tree note:** `git status` lists 35 modified files, but `git diff --ignore-cr-at-eol` shows they are **line-ending-only (CRLF↔LF) changes** (plus `server/.DS_Store`). The working tree is the same as HEAD in substance, so this audit covers both.
>
> **Evidence tags used throughout**
> - **VERIFIED**: read directly in source/config in this repo
> - **INFERRED**: strongly implied by code, but not provable from the repo alone
> - **UNKNOWN**: not verifiable from the current codebase (hosting dashboards, DB contents, third-party settings)
>
> **Secrets policy:** No secret values are printed in this document. Variables holding credentials are shown as *"Configured via environment variable"*.

---

## 1. Executive Summary

This repo is a **two-package MERN monorepo**. There is no root `package.json` and no workspace tooling.

- **`client/`** is a React 19 + Vite 8 SPA in **plain JavaScript (JSX)**. It uses Tailwind v4, Framer Motion, TanStack Query, Zustand, React Router v7 and Clerk. It is a public portfolio, an in-browser memory game ("Labs"), a floating AI chatbot and a full **admin CMS**.
- **`server/`** is an Express 5 (ESM) API on Node with Mongoose 9 / MongoDB Atlas. It handles JWT auth plus a Clerk→JWT bridge, Cloudinary uploads, a GitHub-commit "resume publisher", home-grown analytics counters, a game leaderboard, and a **LangChain RAG chatbot**: Gemini embeddings → in-process FAISS → Groq Llama 3.3 70B.

**What's good (VERIFIED)**
- The backend layering is clean: routes → middleware (auth/zod/multer) → controllers → services → models. Validation is consistent, using Zod 4 behind a `validateRequest` middleware.
- The admin CMS is real. Every admin screen reads and writes live backend data: projects, certificates, skills, experiences, resumes, users, messages and analytics.
- Routes are code-split with `React.lazy`. React Query is configured in one place. The axios client is in one place.

**What's wrong (most important first)**
1. 🔴 **CRITICAL (possible admin account takeover).** `POST /auth/sync-user` and `POST /auth/google` take the **email from the request body** when the Clerk token has no email claim. Clerk session tokens don't include email by default. So anyone who signs in with Google may be able to get a backend JWT for **any** existing user, including the admin. The code path is VERIFIED. Whether it can be exploited depends on Clerk dashboard claim settings, which are UNKNOWN. See §8.
2. 🔴 **Game score theft and spoofing.** The public leaderboard returns `guestId`, and `POST /games/merge` will hand any guest's scores to the caller. Scores are calculated in the browser and the server trusts them.
3. 🟠 **Much of the "API" content is hardcoded.** `GET /resume` returns profile, summary, skills and achievements from `server/src/data/resume.data.js`. Empty collections get **auto-seeded with placeholder data** (e.g. "Independent Projects", "Product Experiments").
4. 🟠 **The chatbot's knowledge doesn't follow the CMS.** The RAG index is built only from `knowledge.md` and `client/public/resume.pdf`. Editing projects or experiences in admin doesn't change what the bot knows. The admin "upload resume for AI" endpoint writes to a collection the bot never reads.
5. 🟠 **The chatbot is told to impersonate the owner and deny being an AI.** That's a trust and compliance risk for a client-facing studio.
6. 🟡 **SEO is close to nonexistent.** It's a client-rendered SPA with one static `<title>`, no meta description, no OG/Twitter tags, no sitemap, no robots.txt, no structured data and no `<h1>` on the home page.
7. 🟡 **There are effectively zero tests.** Each package has one placeholder `expect(true).toBe(true)`.
8. 🟡 **Dead code and dead dependencies.** About 700 lines of a legacy RAG service, an unused context aggregator, unused components, and unused packages (`resend`, `@google/generative-ai`, `@langchain/groq`).

**Bottom line:** Most of the backend can be reused. The frontend's look and routing will be rebuilt for the studio anyway, so moving to Next.js is reasonable. **Fix the auth flaw first**, separately from any redesign.

---

## 2. Current Stack

| Layer | Technology | Version (installed / declared) | Evidence |
|---|---|---|---|
| Frontend framework | React | ^19.2.4 | VERIFIED `client/package.json` |
| Build tool | Vite | ^8.0.1 (`@vitejs/plugin-react` ^6) | VERIFIED |
| Language | JavaScript (JSX). **No TypeScript** (only `@types/react` for editor hints) | — | VERIFIED |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | ^4.2.2 | VERIFIED |
| Animation | Framer Motion | ^12.38.0 (used in 39 files) | VERIFIED |
| Routing | react-router-dom | ^7.13.2 (`BrowserRouter`, declarative `<Routes>`) | VERIFIED |
| Server state | @tanstack/react-query | ^5.95.2 | VERIFIED |
| Client state | Zustand | ^5.0.12 (4 stores) | VERIFIED |
| Forms / validation | react-hook-form + @hookform/resolvers + Zod | ^7.72 / ^5.2 / ^4.3.6 | VERIFIED |
| HTTP | axios | ^1.13.6 (single instance) | VERIFIED |
| Auth (client) | @clerk/clerk-react | ^5.61.4 | VERIFIED |
| Charts | chart.js + react-chartjs-2 | ^4.5 / ^5.3 (admin only) | VERIFIED |
| Icons | lucide-react, react-icons | ^0.473 / ^5.6 | VERIFIED |
| Client testing | Vitest + Testing Library + jsdom | ^4.1 | VERIFIED (placeholder test only) |
| Backend runtime | Node.js, ESM (`"type": "module"`) | Node version not pinned (no `engines`, no `.nvmrc`) | VERIFIED / UNKNOWN version |
| Backend framework | Express | 5.2.1 installed | VERIFIED |
| ODM / DB | Mongoose → MongoDB (Atlas, `mongodb+srv` scheme in local `.env`) | 9.8.0 installed | VERIFIED |
| Server validation | Zod | 4.4.3 installed | VERIFIED |
| Auth (server) | jsonwebtoken, bcryptjs, @clerk/clerk-sdk-node | ^9 / ^3 / ^4.13 | VERIFIED |
| Uploads | multer (memory storage) → Cloudinary | ^2.1 / ^2.9 | VERIFIED |
| AI / RAG | LangChain (`@langchain/community` FAISS, `@langchain/google-genai` embeddings, `@langchain/textsplitters`, `@langchain/classic` TextLoader), `faiss-node`, `groq-sdk` | various | VERIFIED |
| Doc parsing | pdf-parse, mammoth (legacy path only) | ^2.4 / ^1.12 | VERIFIED |
| Rate limiting | express-rate-limit (AI chat only) | ^8.3 | VERIFIED |
| Server testing | Jest + supertest | ^30 / ^7 | VERIFIED (placeholder test only) |

---

## 3. Complete Project Tree

Excludes `node_modules/` and `.git/`. Generated/ignored items are marked.

```
PORTFOLIO/
├── README.md                    # 1,060-line project README (some claims outdated, see §19)
├── .agents/                     # empty directory
├── .DS_Store                    # macOS artifact (untracked at root; server/.DS_Store IS tracked)
│
├── client/                      # ── React/Vite SPA ─────────────────────────────────────
│   ├── index.html               # Single HTML shell: static <title>, Google Fonts, no SEO meta
│   ├── vite.config.js           # react() + tailwindcss() plugins, base "/"
│   ├── vitest.config.js         # jsdom env, setup file
│   ├── eslint.config.js         # flat config: js recommended + react-hooks + react-refresh
│   ├── package.json             # scripts: dev, build, lint, test, preview
│   ├── .env / .env.example      # VITE_CLERK_PUBLISHABLE_KEY, VITE_API_BASE_URL (.env untracked)
│   ├── .gitignore               # NOTE: ignores itself (`*.gitignore`), so it is NOT tracked
│   ├── client.log               # stray log (ignored)
│   ├── dist/                    # [GENERATED] last Vite build output (ignored, not tracked)
│   ├── public/                  # Static files served at site root
│   │   ├── favicon.svg          # ⚠ 942 KB SVG favicon (loaded on every page)
│   │   ├── favic.svg            # ⚠ 803 KB, apparently unused duplicate
│   │   ├── icons.svg            # sprite
│   │   ├── hero/arif.png        # 552 KB hero portrait
│   │   └── resume.pdf           # Static resume. ALSO the RAG source and the GitHub-publisher target
│   └── src/
│       ├── main.jsx             # Entry: StrictMode → QueryClientProvider → ToastProvider → ClerkProvider → App
│       ├── App.jsx              # BrowserRouter, all route definitions, global sync components
│       ├── index.css            # Tailwind v4 entry + theme tokens (51 lines)
│       ├── App.css              # 184 lines, NOT imported anywhere (dead)
│       ├── __tests__/           # setup.js + one placeholder test
│       ├── assets/              # hero.png, memorization-logo.png (⚠ 871 KB), vite/react svgs
│       ├── context/
│       │   └── ToastContext.jsx # Only React Context: global toast queue (loading/update/success/error)
│       ├── store/               # Zustand stores
│       │   ├── useAuthStore.js          # user + JWT, mirrored to localStorage (module-scope read)
│       │   ├── useDefaultResumeStore.js # default resume metadata + Cache Storage warmup
│       │   ├── useGameStore.js          # guestId + best scores (localStorage-backed)
│       │   └── useMemoryGameStore.js    # live memory-game board state + persistence
│       ├── lib/                 # Framework-agnostic helpers
│       │   ├── api.js                   # axios instance, Bearer interceptor, 401 → hard redirect
│       │   ├── auth.js                  # Clerk user → backend /auth/sync-user
│       │   ├── queryClient.js           # React Query defaults (staleTime 30s, retry 1)
│       │   ├── tracking.js              # analytics metadata + once-per-session dedupe (sessionStorage)
│       │   ├── defaultResumeCache.js    # pre-downloads resume PDF into Cache Storage
│       │   ├── resumeDownload.js        # blob download via cache → /download-resume fallback
│       │   ├── gameRegistry.js / gameStorage.js / scoringEngine.js  # Labs game framework
│       │   └── logger.js                # dev-only console logger with key masking
│       ├── hooks/               # Data + behavior hooks
│       │   ├── usePortfolioApi.js       # public queries/mutations (projects, certs, resume, skills, contact, chat)
│       │   ├── useAdminApi.js           # all admin CRUD queries/mutations (466 lines)
│       │   ├── useGameApi.js            # game catalog/leaderboard/scores/progress/merge
│       │   ├── useBackendAuthSync.js    # Clerk session → backend JWT exchange
│       │   ├── useUnifiedLogout.js      # clears local JWT + Clerk signOut
│       │   ├── usePageTracking.js       # route-change → POST /analytics/visit
│       │   ├── useTrackEvent.js         # section view/click → POST /analytics/event
│       │   ├── useGameMergeCheck.js     # prompts guest→user score merge on login
│       │   ├── useMemoryGame.js, useDebouncedValue.js, useInViewMount.js (only used by dead component)
│       ├── schemas/             # Client-side Zod schemas (forms.js, adminForms.js)
│       ├── utils/date.js        # date formatting
│       ├── pages/               # Route-level components (thin wrappers around sections)
│       │   ├── Home, Projects, Experience, Certificates, About, Contact, Games(Labs), MemoryGame
│       │   ├── Login, Register, SSOCallback
│       │   └── admin/ Dashboard, Resume, Certificates, Projects, Skills, Experiences, Users
│       └── components/
│           ├── layout/          # Container, SectionWrapper, PageTransition, LazyMountSection (unused)
│           ├── navigation/      # Navbar, ProfileMenu, UserProfileModal
│           ├── hero/            # HeroSection, HeroContent, CTAButtons, ModeSwitcher, RoleRotator, hero.constants (hardcoded copy & socials)
│           ├── home/            # HomeWhatIAm, HomeHighlights, HomeAchievements, HomeContactCta, HomeFooter, Skill* (graph/bubble/modal/preview), SkillsShowcase (unused)
│           ├── about/           # AboutHeroIntro, ProfessionalSummary, SkillsTechStack, ExperienceTimeline, AchievementsStats, EducationList (hardcoded)
│           ├── sections/        # Full-page sections: Projects, Certificates, Experience, About, Contact, Game, CodingProfilesHighlights (hardcoded), AIChatbotSection (unused)
│           ├── experience/      # ExperienceCard, ExperienceTimeline
│           ├── chatbot/         # GlobalChatbot (533 lines, floating widget)
│           ├── games/           # GameCard, GameTopBar, GameStatsBar, LeaderboardPanel, modals, memory/ board+cards, 32 tech SVGs ("assests" typo dir)
│           ├── admin/           # AdminLayout, AdminSidebar, AdminTable, AdminChart, AdminFormModal, AdminStatCard, ConfirmDialog, FileUploadField, ResumePreviewModal, admin.constants
│           ├── auth/            # AuthForm, InputField, ProtectedRoute, PublicAuthRoute
│           ├── common/          # EmptyState, ImageWithSkeleton, SectionHeader, SectionSkeleton
│           └── ui/              # Button, Card, Input (minimal design-system primitives)
│
└── server/                      # ── Express API ────────────────────────────────────────
    ├── index.js                 # App bootstrap: env, DB connect, CORS, logging, routes, error handlers, listen, deferred RAG init
    ├── package.json             # scripts: dev (nodemon), test (jest). ⚠ NO "start" script
    ├── jest.config.js
    ├── .env / .env.example      # (.env untracked) see §13
    ├── .gitignore               # ignores itself (`.gitignore` listed), so NOT tracked; ignores src/rag/data/cache/
    ├── server.log               # stray log (ignored)
    ├── uploads/                 # empty; legacy (multer uses memory storage)
    ├── tests/setup.test.js      # placeholder test
    └── src/
        ├── config/
        │   ├── env.js           # dotenv + required-var check (JWT_SECRET, MONGO_URI) → exits if missing
        │   └── db.js            # mongoose.connect (+ localhost fallback), logs user count, exits on failure
        ├── routes/              # 12 routers mounted under /api/v1 (see §6)
        ├── middlewares/
        │   ├── auth.middleware.js         # protect (Bearer JWT → req.user), admin (role check)
        │   ├── optionalAuth.middleware.js # attaches req.user if valid token, never rejects
        │   ├── rateLimiter.js             # aiRateLimiter: 20 req/min/IP
        │   ├── upload.middleware.js       # multer memory storage, 5 MB, MIME allow-lists, error mapper
        │   └── errorMiddleware.js         # notFound + JSON errorHandler (stack unless NODE_ENV=production)
        ├── validations/         # Zod request schemas per resource + validateRequest() + objectIdSchema
        ├── controllers/         # 12 controllers (auth, project, certificate, experience, skill, resume, adminResume, adminUser, contact, analytics, ai, game)
        ├── services/
        │   ├── cloudinary.service.js        # lazy config, buffer→data-URI upload, URL validation
        │   ├── github.service.js            # downloads default resume PDF, commits it to GitHub (prod) or writes client/public/resume.pdf (non-prod), then triggers RAG rebuild
        │   ├── defaultResume.service.js     # enforces exactly-one isDefault resume (self-healing)
        │   ├── seedData.service.js          # inserts resume.data.js placeholders into empty collections
        │   ├── date.service.js, experienceTimeline.service.js, timelineSort.service.js  # date normalization & sort pipelines
        │   ├── resumeKnowledge.service.js   # ⚠ 819 lines; LEGACY keyword-RAG. Only 2 exports still used
        │   └── contextAggregator.service.js # ⚠ DEAD: builds context from DB; not imported anywhere
        ├── models/              # 11 Mongoose models (see §7)
        ├── data/resume.data.js  # Hardcoded profile/skills/achievements/experience/projects/certs seed
        ├── utils/
        │   ├── generateToken.js # JWT sign (1d) with ⚠ hardcoded fallback secret
        │   └── logger.js        # leveled console logger, masks some keys & emails
        └── rag/                 # Active chatbot pipeline (LangChain)
            ├── index.js         # init/rebuild orchestration, readiness flag, query routing, answerWithRag
            ├── loaders/         # TextLoader(knowledge.md) + PDFLoader(client/public/resume.pdf)
            ├── embeddings/      # Gemini `gemini-embedding-001` wrapper (batch 5, 150 ms delay)
            ├── vectorStore/     # FAISS build/load/save + hash-based disk cache + atomic swap
            ├── retriever/       # top-k = 5
            ├── chain/           # Groq chat completion (llama-3.3-70b-versatile, temp 0.3, last 20 msgs)
            ├── prompts/         # 3 system prompts (portfolio / general / greeting), persona = owner
            ├── utils/classifyQuery.js # regex router: portfolio / general / greeting (EN + Hinglish)
            └── data/
                ├── knowledge.md # Hand-written knowledge base (contains personal phone & email)
                └── cache/       # [GENERATED, ignored] faiss.index, docstore.json, hash.txt
```

**Not present anywhere (VERIFIED absent):** root workspace config, Dockerfile, `render.yaml`, `vercel.json`, `netlify.toml`, `_redirects`, CI workflows (`.github/`), `.nvmrc`, `.gitattributes`, `robots.txt`, `sitemap.xml`, TypeScript config, Prettier config, React error boundaries.

---

## 4. Frontend Architecture

### 4.1 Entry points (VERIFIED)

| Concern | File | Notes |
|---|---|---|
| HTML shell | `client/index.html` | `<title>Mohd Arif Ansari</title>`, Josefin Sans from Google Fonts, no meta description/OG |
| JS entry | `client/src/main.jsx` | Throws on boot if `VITE_CLERK_PUBLISHABLE_KEY` is missing, so **the whole site needs Clerk configured** even for anonymous visitors |
| Provider order | main.jsx | `StrictMode › QueryClientProvider › ToastProvider › ClerkProvider › App` |
| Router | `App.jsx` | `BrowserRouter` › `AppShell` (uses `useLocation`) › `Suspense` › `AnimatePresence mode="wait"` › `Routes` keyed by pathname |
| Global CSS | `src/index.css` (Tailwind v4 `@import`, theme tokens). `App.css` is not imported |
| Global side-effect components | App.jsx | `<AuthSync/>` (Clerk→JWT), `<DefaultResumeSync/>` (fetch default resume on mount + **on every window focus / visibilitychange**), `<GameMergeSync/>` (merge modal) |
| Global UI | App.jsx | `Navbar`, `GlobalChatbot`, `HomeFooter`, hidden on `/admin*` and `/game/*` |
| Error boundaries | **None** (README claims otherwise) | A render error white-screens the app |

### 4.2 Route map (VERIFIED from `App.jsx`)

| Route | Component | Purpose | Auth | Backend dependency | Key children |
|---|---|---|---|---|---|
| `/` | `pages/Home` (lazy) | Landing page | Public | `GET /resume`, `GET /projects`, `GET /certificates`, `GET /skills` | HeroSection, HomeWhatIAm, HomeHighlights (projects + skill graph), CodingProfilesHighlights (static), HomeContactCta |
| `/projects` | `pages/Projects` | Project grid w/ category filter | Public | `GET /projects?category=` (default limit 12, **no pagination UI**) | ProjectsSection |
| `/experience` | `pages/Experience` | Timeline | Public | `GET /resume` (experience embedded) | ExperienceSection → ExperienceTimeline |
| `/certificates` | `pages/Certificates` | Certificate gallery | Public | `GET /certificates` | CertificatesSection |
| `/about` | `pages/About` | Bio, skills, education | Public | `GET /resume`, `GET /skills` | AboutHeroIntro, ProfessionalSummary, SkillsTechStack, ExperienceTimeline, AchievementsStats, EducationList (hardcoded) |
| `/contact` | `pages/Contact` | Contact form + social links | Public | `POST /contact` | ContactSection (form + hardcoded PROFILES) |
| `/labs` | `pages/Games` | Game hub | Public | none directly (local `gameRegistry`) | GameSection → GameCard |
| `/game/memorization` | `pages/MemoryGame` | Memory game (full-screen, no navbar/footer) | Public (guest or user) | `/games/*` (leaderboard, scores, progress) | MemoryBoard, LeaderboardPanel, GameCompleteModal |
| `/games` | redirect → `/labs` | legacy alias | — | — | — |
| `/ai` | redirect → `/` | legacy alias | — | — | — |
| `/login` | `pages/Login` (eager) | Email/password + Clerk Google button | Guests only (`PublicAuthRoute`) | `POST /auth/login` | AuthForm, Clerk `SignInButton` |
| `/register` | `pages/Register` (eager) | Local sign-up | Guests only | `POST /auth/register` | AuthForm |
| `/sso-callback` | `pages/SSOCallback` (eager) | Clerk OAuth redirect handler → backend JWT | Public | `POST /auth/sync-user` | Clerk `AuthenticateWithRedirectCallback` |
| *(empty `ProtectedRoute`)* | — | "Reserved for future protected user pages" | User | — | — |
| `/admin` → `/admin/dashboard` | `AdminLayout` + `AdminDashboardPage` | KPIs, chart, activity, messages | **Admin** (client check of `user.role`) | `/analytics/summary` (10 s polling), `/analytics/daily×3`, `/analytics/monthly`, `GET /contact` | AdminStatCard, AdminChart, AdminTable, MessageModal |
| `/admin/resume` | `AdminResumePage` | Resume library, default selection, preview | Admin | `/admin/resumes` CRUD, `PATCH /resume/set-default/:id` | ResumePreviewModal, FileUploadField |
| `/admin/certificates` | `AdminCertificatesPage` | Certificate CRUD | Admin | `/certificates` CRUD | AdminFormModal |
| `/admin/projects` | `AdminProjectsPage` | Project CRUD | Admin | `/projects` CRUD (fetches all pages of 50) | AdminFormModal |
| `/admin/skills` | `AdminSkillsPage` | Skill CRUD (logo, %, order, active) | Admin | `/skills/all`, `/skills` CRUD | — |
| `/admin/experiences` | `AdminExperiencesPage` | Experience CRUD | Admin | `/admin/experiences` CRUD | — |
| `/admin/users` | `AdminUsersPage` | List users, change role, delete | Admin | `/admin/users` | ConfirmDialog |
| `/admin-dashboard` | redirect → `/admin/dashboard` | legacy alias | Admin | — | — |
| `*` | inline 404 | Not found | Public | — | — |

### 4.3 Component categories

| Category | Components | Reusable? |
|---|---|---|
| UI primitives | `ui/Button`, `ui/Card`, `ui/Input` | ✅ Reusable (small; no variants system beyond props) |
| Layout | `layout/Container`, `SectionWrapper`, `PageTransition`, `LazyMountSection` (unused) | ✅ Reusable |
| Navigation | `navigation/Navbar`, `ProfileMenu`, `UserProfileModal`, `home/HomeFooter` | ⚠ Portfolio-specific links |
| Hero | `hero/*` + `hero.constants.js` (all copy hardcoded: name, roles, "Hire Me") | ❌ Portfolio-specific |
| Sections | `sections/*`, `home/*`, `about/*` | ❌ Mostly portfolio-specific |
| Cards | `experience/ExperienceCard`, `games/GameCard`, inline project/cert cards | Partially |
| Forms | `auth/AuthForm`, `auth/InputField`, `admin/AdminFormModal`, `admin/FileUploadField`, Contact form | ✅ Admin form pieces reusable |
| Modals | `admin/AdminFormModal`, `ConfirmDialog`, `ResumePreviewModal`, `home/SkillModal`, `games/*Modal`, inline `MessageModal` | Partially |
| Dashboard / charts | `admin/AdminLayout`, `AdminSidebar`, `AdminTable`, `AdminStatCard`, `AdminChart` (Chart.js) | ✅ Reusable for studio admin |
| AI/chatbot | `chatbot/GlobalChatbot` (active), `sections/AIChatbotSection` (dead) | ⚠ Persona-coupled |
| Loading/empty | `common/SectionSkeleton`, `ImageWithSkeleton`, `EmptyState` | ✅ Reusable |
| Auth | `auth/ProtectedRoute`, `PublicAuthRoute` | ⚠ react-router-specific |
| Games | `games/*`, `lib/gameRegistry`, `scoringEngine`, `gameStorage` | Self-contained module |

**Dead/unused (VERIFIED, not imported):** `components/home/SkillsShowcase.jsx`, `components/sections/AIChatbotSection.jsx`, `components/layout/LazyMountSection.jsx` (so `useInViewMount` is effectively dead), `App.css`, `public/favic.svg` (INFERRED unused), `useGamesQuery` (calls a non-existent `GET /games`), `useAnalyticsMutation`.

### 4.4 State management

| Mechanism | Location | What it holds | Why |
|---|---|---|---|
| React Query | `lib/queryClient.js`, `hooks/use*Api.js` | All server data (public + admin) | Caching, dedupe, invalidation on admin mutations |
| Zustand `useAuthStore` | `store/useAuthStore.js` | `user`, `token`, `isAuthenticated` | Global auth. **Reads `localStorage` at module load** |
| Zustand `useDefaultResumeStore` | `store/` | Default resume metadata, in-flight dedupe | Resume download buttons across pages |
| Zustand `useGameStore` / `useMemoryGameStore` | `store/` | Guest ID, best scores, live board | Game state + resume-on-reload |
| React Context `ToastContext` | `context/ToastContext.jsx` | Toast queue | Global notifications |
| localStorage | `portfolio_token`, `portfolio_user`, `portfolio_cached_default_resume`, `game:*` keys (versioned), `guest_id` | Auth persistence, game persistence, resume cache version |
| sessionStorage | `visit:<path>`, `section-view:*` | 30-min analytics dedupe |
| Cache Storage API | `portfolio-default-resume-v1` | **Full resume PDF pre-downloaded** for instant download |
| Local component state | Chatbot messages (lost on reload), forms, modals | — |
| Theme | None (dark-only; no theme state) | — |

### 4.5 API layer (VERIFIED)

- **Single axios instance:** `client/src/lib/api.js`
  - `baseURL = VITE_API_BASE_URL || 'http://localhost:5001/api/v1'` (dev fallback is baked into production builds if the env var is missing)
  - `timeout: 15s`, `withCredentials: false` (no cookies)
  - **Request interceptor:** reads `localStorage.portfolio_token` → `Authorization: Bearer <jwt>`; dev-only request/payload logging
  - **Response interceptor:** **any 401** → clears token and user, then `window.location.href = '/login'` (hard reload, even for background calls)
  - `getErrorMessage()` normalizes `{message}` / `{errors[]}` responses
- **No retry logic** beyond React Query `retry: 1` (queries) / `0` (mutations). No refresh tokens.
- One raw `fetch` (Cloudinary preview in `ResumePreviewModal`) and one in `defaultResumeCache` (Cloudinary PDF warmup).

| Frontend feature | Endpoint | Method | Purpose |
|---|---|---|---|
| Home/About/Experience/Footer | `/resume` | GET | Profile, skills, achievements (static) + experience (DB) |
| Home, Projects | `/projects?category=` | GET | Project list |
| Home, Certificates | `/certificates` | GET | Certificate list |
| Home, About | `/skills` | GET | Active skills |
| Global (App) | `/resume/default` | GET | Default resume metadata (on mount + every focus) |
| Download buttons | `/download-resume` | GET (blob) | Server-proxied resume download (fallback after Cache Storage) |
| Contact | `/contact` | POST | Submit message |
| Chatbot | `/ai/chat` | POST | `{query, history[]}` → `{item:{answer, chunks}}` |
| Chatbot | `/analytics/chatbot` | POST | Usage counter |
| Every public route change | `/analytics/visit` | POST | Page-view counter (once/30 min/path) |
| Section mounts/clicks | `/analytics/event` | POST | View/click counters |
| Login | `/auth/login` | POST | Local login |
| Register | `/auth/register` | POST | Local sign-up |
| Clerk callback / AuthSync | `/auth/sync-user` | POST | Clerk token → backend JWT |
| Memory game | `/games/catalog`, `/games/leaderboard/:slug`, `/games/my-scores/:slug`, `/games/my-rank/:slug`, `/games/progress[/:slug]` (GET/POST/DELETE), `/games/scores`, `/games/merge` | various | Game backend |
| Admin dashboard | `/analytics/summary` (poll 10 s, even in background), `/analytics/daily?days=7|30|90`, `/analytics/monthly`, `/contact` | GET | KPIs, chart, messages |
| Admin resume | `/admin/resumes` (GET/POST/PATCH/DELETE), `/resume/set-default/:id` (PATCH) | — | Resume library |
| Admin certificates | `/certificates` (GET/POST/PATCH/DELETE) | — | CRUD (multipart) |
| Admin projects | `/projects?limit=50&page=n` (GET, all pages), `/projects` POST, `/projects/:id` PATCH/DELETE | — | CRUD (multipart) |
| Admin skills | `/skills/all` GET, `/skills` POST, `/skills/:id` PATCH/DELETE | — | CRUD (multipart) |
| Admin experiences | `/admin/experiences` (GET/POST/PATCH/DELETE) | — | CRUD (JSON) |
| Admin users | `/admin/users` GET, `/admin/users/:id/role` PATCH, `/admin/users/:id` DELETE | — | User management |
| *(broken)* `useGamesQuery` | `/games` | GET | **Endpoint does not exist** (hook unused) |

---

## 5. Backend Architecture

### 5.1 Bootstrap (`server/index.js`, VERIFIED)

1. `import env` → `dotenv.config()`; **exits** if `JWT_SECRET` or `MONGO_URI` is missing.
2. `connectDB()` (skipped when `NODE_ENV=test`). Logs host and **user count**; `process.exit(1)` on failure.
3. `trust proxy = 1` (needed behind Render's proxy for `req.ip`).
4. **CORS:** allow-list = localhost:5173, localhost:3000, `https://arif-ansari.onrender.com`, `CLIENT_URL`, **plus any origin ending in `.onrender.com`**. No-origin requests are allowed. `credentials: true`.
5. **Request logger:** `console.log` of every request with origin. Not gated by environment.
6. `express.json({limit:'2mb'})`, `urlencoded`.
7. `GET /` → "API is running...", `GET /api/v1/health`.
8. Mount 12 routers + top-level `GET /api/v1/download-resume`.
9. `notFound` → `errorHandler` (JSON `{success:false,message,stack}`; stack hidden only if `NODE_ENV==='production'`).
10. `listen(PORT=5001 default)`. **5 s later**, `initializeRag()` runs in the background.

No helmet, no compression, no global rate limiter, no request IDs, no structured logging, no graceful shutdown.

### 5.2 Request flow

```
Client (axios, Bearer JWT)
  → Express 5 (CORS → request log → body parsers)
  → Router (/api/v1/<resource>)
  → [protect → admin]           JWT verify → User.findById → role check
  → [multer single(file)]       memory buffer, MIME allow-list, 5 MB, mapped errors
  → [validateRequest(zod)]      req.validated = {body, query, params}
  → Controller                  business logic, status codes, shape responses
  → Service(s)                  Cloudinary / GitHub / date / seed / RAG
  → Mongoose Model              MongoDB Atlas
  → res.json({ success, item | items, meta?, fallbackMessage?, warning? })
  → errorHandler on next(err)
```

Response envelope convention (VERIFIED, mostly consistent): `{ success, item }` for single, `{ success, items, meta?, fallbackMessage }` for lists. **Games endpoints deviate** (`entries`, `scores`, `ranks`, `progress`, `merged`). **AI chat always returns HTTP 200**, even on internal errors.

### 5.3 Cross-cutting

| Concern | Implementation | Gaps |
|---|---|---|
| Validation | Zod 4 schemas for auth, projects, certs, experiences, skills, resumes, users, contact, analytics, AI | **Games routes have no Zod validation** (hand-checks only); `GET /projects/:id` and `POST /projects/:id/view` unvalidated |
| AuthN | `protect` (Bearer JWT) | No cookie support, no token revocation |
| AuthZ | `admin` (role === 'admin') | Single role tier |
| Rate limiting | `aiRateLimiter` 20/min/IP on `/ai/chat` only | Auth, contact, analytics, game scores unthrottled (contact has in-memory 20 s cooldown) |
| Uploads | multer memory → Cloudinary (`portfolio/projects|certificates|skills|resumes`) | MIME from client header (admin-only, low risk) |
| Errors | central handler + per-controller `statusCode` propagation | Stack traces exposed unless `NODE_ENV=production` |
| Logging | `utils/logger.js` (masks keys/emails) + many raw `console.*` | Unstructured |

---

## 6. API Map

Base path: `/api/v1`. **63 endpoints** (VERIFIED). Auth legend: 🌐 public · 👤 any logged-in user · 🛡 admin (`protect`+`admin`) · ◐ optional auth.

### 6.1 System

| Method | Endpoint | Auth | Handler | DB | External | Frontend |
|---|---|---|---|---|---|---|
| GET | `/` (root) | 🌐 | inline | — | — | — |
| GET | `/api/v1/health` | 🌐 | inline | — | — | — (useful for uptime pings) |

### 6.2 Auth (`auth.routes.js` → `auth.controller.js`)

| Method | Endpoint | Auth | Request | Response | DB | External | Frontend |
|---|---|---|---|---|---|---|---|
| POST | `/auth/register` | 🌐 | `{name,email,password,confirmPassword}` | `{token,user}` 201 | User find(regex)/create | — | Register |
| POST | `/auth/login` | 🌐 | `{email,password}` | `{token,user}` | User find(+password) | — | Login |
| POST | `/auth/google` | 🌐 | `{token,email?,name?,profileImage?}` | `{token,user,created}` | User find/create/update | Clerk `verifyToken` | **unused** |
| POST | `/auth/sync-user` | 🌐 | same + `provider?:'google'` | `{token,user,created}` | User find/create/update | Clerk `verifyToken` | AuthSync, SSOCallback |

### 6.3 Projects (`project.routes.js`)

| Method | Endpoint | Auth | Request | Response | DB | External | Frontend |
|---|---|---|---|---|---|---|---|
| GET | `/projects` | 🌐 | query `category∈{MERN,Django,AI}`, `q`(≤80), `page`, `limit`(≤50, default 12) | `{items,meta,fallbackMessage}` | **seed-if-empty**, aggregate sort by `projectDate→createdAt`, regex search | — | Home, Projects, Admin |
| GET | `/projects/:id` | 🌐 | — | `{item}` | findById | — | unused |
| POST | `/projects/:id/view` | 🌐 | — | `{item}` | `$inc views` | — | **unused** (so `views` never increments) |
| POST | `/projects` | 🛡 | multipart `image` + fields | `{item}` 201 | create | Cloudinary | Admin |
| PATCH | `/projects/:id` | 🛡 | multipart | `{item}` | findByIdAndUpdate | Cloudinary | Admin |
| DELETE | `/projects/:id` | 🛡 | — | `{message}` | delete (Cloudinary asset **not** deleted) | — | Admin |

### 6.4 Certificates (`certificate.routes.js`)

| Method | Endpoint | Auth | Notes | DB | External | Frontend |
|---|---|---|---|---|---|---|
| GET | `/certificates` | 🌐 | seed-if-empty; sorted by issueDate | aggregate | — | Home, Certificates, Admin |
| POST | `/certificates` | 🛡 | multipart `image`; `organization`/`issuer` and `issueDate`/`issuedDate` dual fields | create | Cloudinary | Admin |
| PATCH | `/certificates/:id` | 🛡 | multipart | update | Cloudinary | Admin |
| DELETE | `/certificates/:id` | 🛡 | — | delete | — | Admin |

### 6.5 Skills (`skill.routes.js`)

| Method | Endpoint | Auth | Notes | Frontend |
|---|---|---|---|---|
| GET | `/skills` | 🌐 | `isActive:true`, sort `displayOrder, -percentage` | Home, About |
| GET | `/skills/all` | 🛡 | all skills | Admin |
| GET | `/skills/:id` | 🛡 | — | unused |
| POST | `/skills` | 🛡 | multipart `logo`, case-insensitive duplicate check → 409 | Admin |
| PATCH | `/skills/:id` | 🛡 | multipart | Admin |
| DELETE | `/skills/:id` | 🛡 | — | Admin |

### 6.6 Experiences (`admin.experience.routes.js`, all 🛡)

| Method | Endpoint | Notes | Frontend |
|---|---|---|---|
| GET | `/admin/experiences` | timeline-mapped list | Admin |
| POST | `/admin/experiences` | date-range rules, auto `duration` | Admin |
| PATCH | `/admin/experiences/:id` | merge-with-existing date validation | Admin |
| DELETE | `/admin/experiences/:id` | — | Admin |

*(Public experience data is delivered via `GET /resume`.)*

### 6.7 Resume (`resume.routes.js`, `admin.resume.routes.js`)

| Method | Endpoint | Auth | Behavior | DB | External | Frontend |
|---|---|---|---|---|---|---|
| GET | `/resume` | 🌐 | **Static `resume.data.js`** (profile, summary, skills, achievements, projects, certs) + **DB experiences** (fallback static) | Experience, seed | — | Home, About, Experience, Footer |
| GET | `/resume/default` | 🌐 | default resume metadata; 404 if none | Resume (self-healing writes!) | — | App-wide store |
| GET | `/resume/download` | 🌐 | streams Cloudinary file as attachment | Resume | Cloudinary fetch | unused alias |
| GET | `/resume/download-resume` | 🌐 | same | — | — | unused alias |
| GET | `/download-resume` (top-level) | 🌐 | same | — | — | Download buttons |
| PATCH | `/resume/set-default/:id` | 🛡 | set default → **publish to GitHub/local** → RAG rebuild | Resume | GitHub API | Admin |
| GET | `/admin/resumes` | 🛡 | list (+ ensure default) | Resume | — | Admin |
| POST | `/admin/resumes` | 🛡 | multipart `file` (PDF/DOCX) → Cloudinary raw → maybe publish | Resume | Cloudinary, GitHub | Admin |
| PATCH | `/admin/resumes/:id` | 🛡 | update/replace file → maybe publish | Resume | Cloudinary, GitHub | Admin |
| DELETE | `/admin/resumes/:id` | 🛡 | delete + re-elect default (no republish, Cloudinary asset not deleted) | Resume | — | Admin |

Note: GET endpoints that call `ensureDefaultResumeSelection()` **write to the DB** (normalize URLs, flip `isDefault`). Side effects in GET handlers.

### 6.8 Contact (`contact.routes.js`)

| Method | Endpoint | Auth | Behavior | Frontend |
|---|---|---|---|---|
| POST | `/contact` | 🌐 | Zod-validated; in-memory 20 s cooldown keyed by IP+email; stores `ipAddress`; **no email notification**; response echoes the stored doc incl. IP | Contact |
| GET | `/contact` | 🛡 | latest 100 messages; no pagination, no read/archived status, no delete endpoint | Admin dashboard |

### 6.9 Analytics (`analytics.routes.js`)

| Method | Endpoint | Auth | Behavior | Frontend |
|---|---|---|---|---|
| POST | `/analytics/event` | 🌐 | `type∈{view,visit,click,chatbot,project,game}`, `delta 1–20` → upsert `{page, day}` `$inc` | Section trackers |
| POST | `/analytics/visit` | 🌐 | `views += delta` | Route tracker |
| POST | `/analytics/chatbot` | 🌐 | `chatbotUsage += delta` | Chatbot |
| POST | `/analytics/project` | 🌐 | `projectViews += delta` | unused |
| GET | `/analytics/summary` | 🛡 | totals + per-route + message count + 8 recent (with legacy heuristics) | Admin |
| GET | `/analytics/daily?days=` | 🛡 | daily `views` sum | Admin chart |
| GET | `/analytics/monthly` | 🛡 | 12-month `views` | Admin chart |
| GET | `/analytics/yearly` | 🛡 | yearly `views` | unused |
| GET | `/analytics/:page` | 🌐 | totals for one page (**publicly readable**) | unused |

### 6.10 AI (`ai.routes.js`)

| Method | Endpoint | Auth | Behavior | External | Frontend |
|---|---|---|---|---|---|
| GET | `/ai/status` | 🌐 | legacy ResumeKnowledge status + FAISS status | — | unused |
| POST | `/ai/chat` | 🌐 + rate limit 20/min/IP | Zod `{query 3–500, history ≤20}` → classify → Groq (± FAISS retrieval) → always 200 | Groq, Gemini (query embedding) | GlobalChatbot |
| POST | `/ai/resume/upload` | 🛡 | multipart `resume` → parse PDF/DOCX → **writes `ResumeKnowledge`** (not used by the chatbot) → triggers FAISS rebuild (from unchanged files) | — | **unused** |

### 6.11 Admin Users (`admin.user.routes.js`, all 🛡)

| Method | Endpoint | Behavior |
|---|---|---|
| GET | `/admin/users` | latest 500 users (no pagination) |
| GET | `/admin/users/:id` | single user (unused by UI) |
| PATCH | `/admin/users/:id/role` | `{role:'user'|'admin'}`; blocks self-demotion and last-admin demotion |
| DELETE | `/admin/users/:id` | blocks self-delete and deleting admins; **does not delete the user's GameScores/GameProgress** |

### 6.12 Games (`game.routes.js`, no Zod)

| Method | Endpoint | Auth | Behavior |
|---|---|---|---|
| GET | `/games/catalog` | 🌐 | hardcoded catalog (1 game: `memorization`) |
| GET | `/games/leaderboard/:gameSlug` | 🌐 | personal bests sorted; **returns `userId` and `guestId`** |
| POST | `/games/scores` | ◐ | client-supplied score/time/moves/accuracy; personal-best bookkeeping; guest via `guestId` |
| GET | `/games/my-scores/:gameSlug` | 👤 | user's bests |
| GET | `/games/my-rank/:gameSlug` | 👤 | rank per difficulty (N+1 queries, fine at this scale) |
| POST | `/games/progress` | 👤 | upsert save-slot (`state` = arbitrary Mixed object) |
| GET | `/games/progress/:gameSlug` | 👤 | load save-slot |
| DELETE | `/games/progress/:gameSlug` | 👤 | clear |
| POST | `/games/merge` | 👤 | re-assigns **any** `guestId`'s scores to the caller |

---

## 7. Database Map

**Type:** MongoDB via Mongoose 9 (VERIFIED). **Host:** MongoDB Atlas (INFERRED from the `mongodb+srv` scheme in local `.env`). **Connection:** `mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/portfolio')`. **Connection string:** Configured via environment variable.
**Relationships:** only `GameScore.userId` and `GameProgress.userId` → `User` (ObjectId refs, no populate used). Everything else is standalone documents. **No soft deletion anywhere. No transactions.**

```
User                                  (timestamps)
 ├── name           String req
 ├── email          String req, UNIQUE, lowercase, regex-validated
 ├── password       String (required iff provider=local), select:false, bcrypt(10)
 ├── role           enum user|admin  (default user)
 ├── provider       enum local|google
 └── profileImage   String

Project                               (timestamps)
 ├── title(≤120) req, description(≤2000) req, tags[String]
 ├── category       enum MERN|Django|AI   req, indexed   ← hard-coded taxonomy
 ├── image, github, live   String
 ├── date           String "Mon-YYYY"|"ongoing" (legacy)
 ├── projectDate    Date, indexed (timeline sort)
 └── views          Number (never incremented by UI)

Certificate                           (timestamps)
 ├── title req, image req
 ├── organization / issuer        (duplicated, kept in sync by pre-validate hook)
 └── issueDate (indexed) / issuedDate (duplicated)

Experience                            (timestamps)
 ├── company, role, description req
 ├── startDate req (indexed), endDate, isCurrentlyWorking
 └── duration       String (auto-generated)

Skill                                 (timestamps)
 ├── skill          String req, UNIQUE (+ case-insensitive app check)
 ├── percentage 0–100 req, category, logo
 ├── displayOrder, featured, isActive
 └── index {displayOrder:1, percentage:-1}

Resume                                (timestamps)
 ├── title, category enum fullstack|backend|frontend|python|ai
 ├── fileUrl (Cloudinary) req, fileName, storageProvider enum cloudinary
 └── isDefault      Boolean, indexed  (single-default enforced in service code, not by index)

ResumeKnowledge   (LEGACY, written only by unused /ai/resume/upload)
 ├── sourceName, rawText
 └── chunks[{index, text, tokens[]}]

Message  (contact submissions)        (timestamps)
 ├── name, email, message
 └── ipAddress

Analytics  (daily counters)           (timestamps)
 ├── page String, date Date (local-midnight bucket)
 ├── views, clicks, chatbotUsage, gameUsage, projectViews
 ├── lastEventAt, lastEventMeta (Mixed: route, timestamp, userId)
 └── UNIQUE {page:1, date:1}

GameScore                             (timestamps)
 ├── userId → User (nullable), guestId (nullable), playerName
 ├── gameSlug, difficulty enum, score, time, moves, accuracy, wrongMatches, hintsUsed
 ├── isPersonalBest, completedAt
 └── indexes: {gameSlug,difficulty,score}, {userId,gameSlug,difficulty}, {guestId,gameSlug,difficulty}, {gameSlug,isPersonalBest,score}

GameProgress                          (timestamps)
 ├── userId → User req, gameSlug, difficulty, state (Mixed)
 └── UNIQUE {userId, gameSlug}
```

**Aggregations in use (VERIFIED):** timeline sort (`$addFields` + `$ifNull` chain + `$sort`) for projects and certificates; analytics `$group` by page / `$dateToString` day, month and year.

**Data-integrity observations**
- Analytics day buckets use **server-local midnight** (`setHours(0,0,0,0)`), so the bucket timezone depends on the host TZ (UNKNOWN in production; Render defaults to UTC, INFERRED).
- Duplicate field pairs (`issuer/organization`, `issueDate/issuedDate`, `date/projectDate`) are kept for backward compatibility.
- **Seeding:** `ensureSeedData()` inserts placeholder records from `resume.data.js` into **empty** Project/Certificate/Experience collections the first time a public list endpoint is hit in a process. If an admin deletes every project, the placeholders come back after a restart.
- **Zod 4 partial-update defaults (VERIFIED by evaluating the schema):** `updateProjectSchema` parses `{description:'…'}` into `{…, tags:[], image:'', github:'', live:'', date:''}`. A PATCH that leaves out `github`/`live`/`tags` **resets them to empty**. The current admin UI always sends every field, which hides the bug. Any new client (e.g. a Next.js admin or scripts) will hit it.

---

## 8. Authentication

### 8.1 What exists (VERIFIED)

There are **two identity systems** joined by a token exchange:
1. **Local email/password:** bcrypt hash in MongoDB → backend JWT.
2. **Clerk (Google OAuth):** Clerk session in the browser → exchanged for the **same backend JWT**.

Clerk is never used to authorize API calls directly. The backend JWT is the only API credential.

**Local login**
```
Login.jsx (RHF + zod)
 → POST /api/v1/auth/login {email,password}
 → User.findOne(email, case-insensitive regex).select('+password'); provider must be 'local'
 → bcrypt.compare
 → jwt.sign({id, role}, JWT_SECRET, {expiresIn:'1d'})
 → {token, user}
 → useAuthStore.login() → localStorage.portfolio_token / portfolio_user
 → axios interceptor adds Authorization: Bearer <token> to every request
 → protect: jwt.verify → User.findById (fresh role from DB) → admin: role==='admin'
```

**Google via Clerk**
```
Login.jsx <SignInButton> (Clerk-hosted UI) → Google → Clerk session
 → /sso-callback (AuthenticateWithRedirectCallback) or <AuthSync/> on any page
 → useBackendAuthSync: getToken() (Clerk session JWT) + clerkUser email/name/image
 → POST /api/v1/auth/sync-user {token, email, name, profileImage, provider:'google'}
 → verifyToken(token, {secretKey: CLERK_SECRET_KEY})        (@clerk/clerk-sdk-node)
 → tokenEmail = decoded.email || decoded.email_address || ... || ''
 → incomingEmail = body.email || tokenEmail
 → if tokenEmail && incomingEmail !== tokenEmail → 401      ← only check
 → User.findOne(incomingEmail) → create (provider google) or update name/image
 → backend JWT (1d) → same storage path as local
```

**Logout:** `useUnifiedLogout` clears localStorage and calls Clerk `signOut()`. There's no server-side revocation, so a JWT stays valid for up to 24 h.

**Route protection (client):** `ProtectedRoute` checks the Zustand `isAuthenticated` and `user.role` loaded from localStorage. That's UI-only; every admin API is enforced server-side (VERIFIED).

**Admin bootstrap:** There's no endpoint or script to create the first admin. Promotion must happen directly in the DB or via an existing admin (INFERRED; UNKNOWN how the current admin was created).

### 8.2 Findings

| Severity | Finding | Evidence |
|---|---|---|
| 🔴 Critical | **Email trusted from the request body.** If the Clerk session token has no email claim (Clerk's default session token holds `sub`, `sid`, `iss`, etc., but not email unless customized), `tokenEmail` is `''`, the mismatch check is skipped, and `incomingEmail` comes from the body. **Any** Google user of this Clerk app could send `email: <admin email>` and get an **admin JWT**. The fix direction is to resolve the user from `decoded.sub` via the Clerk Backend API. Exploitability depends on Clerk session-claim config, which is UNKNOWN. | [auth.controller.js:75-92](../server/src/controllers/auth.controller.js#L75-L92) |
| 🔴 Critical (conditional) | Account linking by email: a Google sign-in whose email matches a **local** account gets a JWT for that local account. That's acceptable only when the email is provably verified (see above). | same |
| 🟠 High | JWT stored in `localStorage`, so any future XSS can steal it. No XSS sink was found today (`dangerouslySetInnerHTML` not used; chatbot renders plain text). | `useAuthStore.js`, `api.js` |
| 🟠 High | `@clerk/clerk-sdk-node` is Clerk's **deprecated** Node SDK (successor: `@clerk/express` / `@clerk/backend`). | `server/package.json` |
| 🟡 Medium | Hardcoded fallback JWT secret in `generateToken`. It's unreachable in practice because `env.js` exits without `JWT_SECRET`, but it's a dangerous default if the code is reused elsewhere. | [generateToken.js:6](../server/src/utils/generateToken.js#L6) |
| 🟡 Medium | No rate limiting or lockout on `/auth/login` and `/auth/register`, so brute-forcing is possible. | `auth.routes.js` |
| 🟡 Medium | Two identity systems and duplicated logic (`/auth/google` ≡ `/auth/sync-user`; `/auth/google` unused). Clerk is loaded for every anonymous visitor, and boot **throws** without its key. | `main.jsx`, auth routes |
| 🟡 Medium | Any 401 does a hard redirect to `/login`, including from background/public calls. | `api.js` |
| 🟢 Low | Password policy: min length 6. Email lookups use a case-insensitive regex (no index use) even though emails are stored lowercased. | validations, controller |
| 🟢 Low | No refresh tokens; the 1-day expiry forces re-login (or a Clerk re-sync). | — |

---

## 9. Admin Dashboard

**Access:** `/admin/*`, lazy-loaded, wrapped in `ProtectedRoute requireAdmin`. Backend enforces `protect`+`admin` on every admin endpoint (VERIFIED).
**Layout:** `AdminLayout` (sidebar from `admin.constants.js` + `<Outlet/>`); navbar, chatbot and footer are hidden.

| Section | Capabilities | APIs | Data source classification |
|---|---|---|---|
| Dashboard: KPI cards | Total Visitors, Chatbot Usage, Project Views, Games Usage | `/analytics/summary` (10 s polling, also when the tab is hidden) | **Derived/aggregated backend data**. Note: "Total Visitors" = sum of page *views* (deduped per path per 30 min per browser session), **not unique visitors**. "Project Views"/"Games Usage" include legacy heuristics (page-name `includes('project'|'game'|'ai'|'chat')`) |
| Dashboard: chart | 7D/30D/90D/1Y views | `/analytics/daily?days=7,30,90` + `/analytics/monthly` (4 parallel queries on mount) | **Real aggregated data** |
| Dashboard: Activity Breakdown | 8 most recently updated routes with hits/interactions | `/analytics/summary.recentActivity` | **Real aggregated data** |
| Dashboard: Recent Comms | Last 10 contact messages + modal | `GET /contact` | **Real data** (read-only; no delete/mark-read) |
| Manage Resume | Upload PDF/DOCX → Cloudinary, edit, delete, set default, preview; default publish → GitHub commit of `client/public/resume.pdf` | `/admin/resumes`, `/resume/set-default/:id` | **Real data** |
| Manage Certificates | CRUD w/ image upload | `/certificates` | **Real data** (seeded placeholders if empty) |
| Manage Projects | CRUD w/ image, tags, category (MERN/Django/AI), dates | `/projects` | **Real data** (seeded placeholders if empty) |
| Manage Skills | CRUD w/ logo, %, category, order, featured, active | `/skills` | **Real data** |
| Experiences | CRUD w/ date logic | `/admin/experiences` | **Real data** (seeded placeholders if empty) |
| User Management | List, promote/demote, delete (guards for self/last admin) | `/admin/users` | **Real data** |

**Not manageable from admin (static/hardcoded):**

| Content | Location |
|---|---|
| Name, title, summary, location | `server/src/data/resume.data.js` (served by `/resume`) and `client/.../hero/hero.constants.js` |
| Home "skills" categories, achievements | `resume.data.js` |
| Hero roles, highlights, CTA labels, social links | `hero.constants.js` |
| Education | `about/EducationList.jsx` (`EDUCATION_DATA`) |
| Coding profiles section | `sections/CodingProfilesHighlights.jsx` |
| Contact page profile links | `sections/ContactSection.jsx` (`PROFILES`) |
| Chatbot knowledge | `server/src/rag/data/knowledge.md` (file in repo; requires deploy) |
| Game catalog | `game.controller.js` `GAME_CATALOG` + `client/src/lib/gameRegistry.js` (duplicated) |

**No mock or fake data is shown in the dashboard** (VERIFIED). The only "fake" data risk is the **seeded placeholder content** in the public collections.

---

## 10. AI / Chatbot

### 10.1 Components (VERIFIED)

| Aspect | Implementation |
|---|---|
| Chat LLM | **Groq** `llama-3.3-70b-versatile` (override via `GROQ_MODEL`), temperature **0.3 hardcoded** (`GROQ_TEMPERATURE` env only affects the dead legacy path), non-streaming |
| Embeddings | **Google Gemini** `gemini-embedding-001` via `@langchain/google-genai` (batches of 5, 150 ms delay) |
| Vector store | **FAISS in-process** (`@langchain/community` + `faiss-node`), single global instance, atomic swap on rebuild |
| Chunking | `RecursiveCharacterTextSplitter` 900/150 |
| Retrieval | top-k = 5, no reranking, no score threshold |
| Knowledge sources | `server/src/rag/data/knowledge.md` + `client/public/resume.pdf` (**cross-package file path**) |
| Cache | `server/src/rag/data/cache/{faiss.index, docstore.json, hash.txt}`, keyed by SHA-256 of both sources (git-ignored, so rebuilt on every fresh deploy) |
| Routing | Regex classifier → `portfolio` (RAG) / `general` (no context) / `greeting` (no context); English + Hinglish patterns; default → greeting |
| Prompts | `rag/prompts/prompts.js`: all 3 prompts say **"You ARE Arif Ansari… NEVER say you are an AI"**; strict "answer only from context" for portfolio mode; strict language mirroring |
| History | Client sends the last ≤20 messages; server truncates each to 2,000 chars. **No server-side conversation storage** |
| Rate limiting | 20 req/min/IP (`express-rate-limit`, in-memory store) |
| Error handling | Readiness flag → "warming up" answer; any exception → friendly fallback, **HTTP 200** |
| Usage analytics | Frontend posts `/analytics/chatbot` per message (counter only; no prompt/answer logging, no token or cost tracking) |
| LangChain | Used for loaders, splitter, embeddings and vector store only. The LLM call is the raw `groq-sdk` (no LangChain chain) |

### 10.2 Request flow

```
GlobalChatbot (React state, not persisted)
 ├─ POST /analytics/chatbot (fire-and-forget)
 └─ POST /ai/chat {query, history}
      → aiRateLimiter (20/min/IP) → zod (3–500 chars)
      → isRagReady()? no → "warming up" (200)
      → classifyQuery(query)
          greeting/general → Groq(system prompt, history, query)
          portfolio → initializeRag() → FAISS.asRetriever(5).invoke(query)
                        (Gemini embedding call for the query)
                    → no docs → FALLBACK_MESSAGE
                    → Groq(system prompt + retrieved context, history, query)
      → {success:true, item:{answer, chunks[]}}
```

**Rebuild triggers:** server boot (+5 s); `rebuildVectorStoreInBackground()` after a default-resume publish and after `/ai/resume/upload`. **Not** triggered by project/experience/skill/cert edits.

### 10.3 Issues
- **Knowledge drift:** CMS edits never reach the bot. The fully written DB-backed `contextAggregator.service.js` is not wired in.
- **Misleading admin endpoint:** `/ai/resume/upload` writes `ResumeKnowledge`, which the active RAG never reads.
- **Legacy duplication:** `resumeKnowledge.service.js` (819 lines) contains a second keyword-RAG + Groq pipeline. Only `indexResumeFromFile` and `getResumeKnowledgeStatus` are still referenced.
- **Persona / disclosure:** The bot is told to deny being an AI. On a client-facing business site, that conflicts with user trust and may conflict with AI-disclosure rules in some jurisdictions. Get legal review before reusing it for a studio.
- **PII exposure:** `knowledge.md` contains a personal phone number and email, which the bot will repeat to anyone.
- **Prompt injection:** User text and history go straight to the LLM. The impact is limited (no tools), but the "answer only from context" rule can be talked around.
- **Cold-start cost:** On Render (ephemeral disk) every deploy, and every restart if the cache is missing, re-embeds all chunks with Gemini. Chat says "warming up" until that finishes.
- **Single-process only:** FAISS lives in memory. It can't scale horizontally without an external vector DB (README acknowledges this).

---

## 11. Analytics

**Model:** one document per `{page, day}` with counters (VERIFIED). No sessions, no unique visitors, no referrer, no UTM, no device, no geography, no funnel.

```
Route change (non-admin)        → usePageTracking → sessionStorage dedupe (30 min) → 1 s delay
                                → POST /analytics/visit {page, delta:1, metadata{route,timestamp,userId}}
Section mount / click           → useTrackSectionView → POST /analytics/event {page, type:'view'|'click'|'game'...}
Chatbot message                 → POST /analytics/chatbot
                                        ↓
                       Analytics.findOneAndUpdate({page, date: today-midnight}, {$inc, $set lastEventMeta}, upsert)
                                        ↓
Admin dashboard ← GET /analytics/summary (10 s poll) / daily / monthly
                  + Project.aggregate(sum views) + Message.countDocuments()
```

**Weaknesses (VERIFIED):** All write endpoints are **public and unthrottled**. `delta` can be up to 20 per call, and `page` is any string up to 100 chars, so anyone can inflate counters or create unlimited documents. Bots and crawlers are counted. `metadata.userId` comes from the client. The "Visitors" label is really "page views". `GET /analytics/:page` is publicly readable. Polling every 10 s **in the background** from the admin dashboard costs ~8,640 requests/day/open tab.

---

## 12. External Services

| Service | Purpose | Side | Environment variable(s) | Criticality |
|---|---|---|---|---|
| MongoDB Atlas | Primary DB | Backend | `MONGO_URI`: configured via environment variable | **Critical** (server exits without it) |
| Clerk | Google OAuth / session | Frontend + Backend | `VITE_CLERK_PUBLISHABLE_KEY` (public), `CLERK_SECRET_KEY`: configured via environment variable | **Critical for frontend boot** (app throws without the publishable key); Google login only |
| Cloudinary | Image + resume file storage/CDN | Backend upload; frontend displays/fetches | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: configured via environment variable | High (all admin uploads, resume download) |
| Groq | Chat LLM | Backend | `GROQ_API_KEY`: configured via environment variable; `GROQ_MODEL` | High for chatbot |
| Google Gemini | Embeddings | Backend | `GEMINI_API_KEY` (or `GOOGLE_API_KEY`): configured via environment variable | High for chatbot (RAG can't build without it) |
| GitHub REST API | Commits default resume PDF to repo | Backend (production only) | `GITHUB_TOKEN`: configured via environment variable; `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `GITHUB_FILE_PATH` | Medium (failure is non-fatal and returns a `warning`) |
| Google Fonts | Josefin Sans | Frontend | — | Low |
| Render | Hosting (backend for sure; frontend INFERRED) | Infra | — | Critical (UNKNOWN plan) |
| Resend | *Installed + key present in local `.env`, but **never imported*** | — | `RESEND_API_KEY`, `EMAIL_REPLY_TO`, `ADMIN_EMAIL` | None today (unused) |
| OpenAI | *Key present in local `.env`, **never referenced in code*** | — | `OPENAI_API_KEY`, `OPENAI_MODEL` | None today (unused) |
| Analytics provider (GA/Plausible/etc.) | **None.** Analytics are home-grown | — | — | — |
| Payments | **None** | — | — | — |

---

## 13. Environment Variables

### 13.1 Backend (`server/.env`; template `server/.env.example`)

| Variable | Purpose | Required? | Class | Read in |
|---|---|---|---|---|
| `NODE_ENV` | mode; gates stack traces, logger verbosity, **GitHub vs local resume publishing** | Optional (default `development`) | Config | env.js, many |
| `PORT` | listen port | Optional (default 5001) | Config | env.js |
| `MONGO_URI` | DB connection | **Required** (boot exits) | **Secret** | env.js, db.js |
| `JWT_SECRET` | JWT signing | **Required** (boot exits) | **Secret** | auth middleware, generateToken |
| `CLIENT_URL` | CORS allow-list entry | Optional (default localhost:5173) | Config | index.js |
| `CLERK_SECRET_KEY` | Clerk token verification | Required for Google login (500 otherwise) | **Secret / third-party** | auth.controller |
| `GROQ_API_KEY` | chat LLM | Required for chatbot | **Secret / third-party** | rag/chain, legacy service |
| `GROQ_MODEL` | model override | Optional | Config | rag/chain |
| `GROQ_TEMPERATURE`, `GROQ_TOP_P`, `GROQ_MAX_COMPLETION_TOKENS` | **legacy path only (dead)** | Optional / ineffective | Config | resumeKnowledge.service |
| `GEMINI_API_KEY` (alias `GOOGLE_API_KEY`) | embeddings | Required for chatbot | **Secret / third-party** | rag/embeddings, env.js |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | uploads | Required for admin uploads | **Secret / third-party** | cloudinary.service |
| `GITHUB_TOKEN` | repo write (PAT) | Production-only (resume publish) | **Secret / third-party** (high-privilege) | github.service |
| `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `GITHUB_FILE_PATH` | publish target | Production-only | Config | github.service |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | **unused** (present in local `.env`, not in template) | — | Secret (unused) | — |
| `RESEND_API_KEY`, `EMAIL_REPLY_TO`, `ADMIN_EMAIL` | **unused** (present in local `.env`, not in template) | — | Secret / config (unused) | — |

Observations: the local `.env` has `NODE_ENV=development` **and an Atlas (`mongodb+srv`) URI**. Whether local dev shares the production database is UNKNOWN, so check before running anything destructive locally. The template is missing 5 keys that are present locally.

### 13.2 Frontend (`client/.env`; template `client/.env.example`)

| Variable | Purpose | Required? | Class |
|---|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | ClerkProvider | **Required** (app throws at boot) | Public (embedded in bundle) |
| `VITE_API_BASE_URL` | axios base URL | Required in production (dev fallback `http://localhost:5001/api/v1`) | Public |

All `VITE_*` values are compiled into the public JS bundle. Never put secrets there.

---

## 14. Deployment

### 14.1 What the repo proves

- **No IaC or deploy config** of any kind (no render.yaml, vercel.json, Dockerfile, CI). Every build/start/rewrite setting lives in hosting dashboards → **UNKNOWN**.
- **Backend has no `start` script.** The production start command (e.g. `node index.js`) must be set in the Render dashboard (INFERRED). `nodemon` is in **production** dependencies.
- **SPA fallback:** no `_redirects`/rewrite file in `client/public`, so deep links like `/projects` rely on a host-side rewrite rule (UNKNOWN; if it's missing, refreshes 404).
- **Production frontend URL:** `https://arif-ansari.onrender.com` is hardcoded in CORS and listed as "Portfolio" in the contact links, so the **frontend is INFERRED to be a Render Static Site**. The README says Vercel/Netlify, which contradicts the code.
- **Backend URL:** UNKNOWN (only supplied at build time via `VITE_API_BASE_URL`).
- **Node version:** unpinned → UNKNOWN on host.

### 14.2 Local development architecture

```
Browser :5173  ──(Vite dev server, HMR)──►  client/src
   │  axios → http://localhost:5001/api/v1 (Bearer JWT)
   ▼
Express :5001 (nodemon index.js, NODE_ENV=development)
   ├─► MongoDB Atlas (mongodb+srv from server/.env)   ⚠ possibly shared with prod (UNKNOWN)
   ├─► Cloudinary / Clerk / Groq / Gemini (real third-party keys)
   ├─► RAG cache → server/src/rag/data/cache (persisted locally)
   └─► "Publish default resume" → writes ../client/public/resume.pdf on local disk
```

### 14.3 Production architecture (INFERRED unless noted)

```
Visitor ──► Render Static Site (Vite dist/, CDN)            [INFERRED]
              │  HTTPS, Bearer JWT, CORS
              ▼
           Render Web Service: node index.js (server/)       [VERIFIED: Render-specific CORS + trust proxy]
              ├─► MongoDB Atlas                               [VERIFIED scheme]
              ├─► Cloudinary (uploads, resume streaming proxy)
              ├─► Clerk Backend (token verify)
              ├─► Groq (chat) + Gemini (embeddings)
              ├─► GitHub API: commits client/public/resume.pdf on default change
              │        └─► (INFERRED) push triggers auto-redeploy of static site and API
              └─► Ephemeral disk: FAISS cache lost on each deploy/restart → re-embed on boot
```

**Cold-start implications:** If the backend is on a free/starter Render instance that sleeps (plan UNKNOWN), the first visitor waits for container wake **plus** Mongo connect. The chatbot answers "warming up" until the FAISS rebuild finishes (≥5 s delay + embedding time). Every resume download is proxied through the API, so it hits the cold start too, except when the browser Cache Storage copy is warm. The home page needs **five** API calls before it shows real data.

**Risk:** The production backend assumes the whole monorepo is checked out (it reads `../../../client/public/resume.pdf`). Changing it to a separately deployed frontend package, or a different repo layout, silently breaks RAG.

---

## 15. Dependencies

### 15.1 Frontend

| Category | Packages | Notes |
|---|---|---|
| Framework | react, react-dom (19), vite (8), @vitejs/plugin-react | Bleeding-edge majors (Vite 8, React 19) |
| Routing | react-router-dom 7 | Declarative mode; replaced by Next.js App Router on migration |
| UI / styling | tailwindcss 4, @tailwindcss/vite | v4 CSS-first config; Next needs `@tailwindcss/postcss` instead |
| Animation | framer-motion 12 | 39 files; client-only in Next (`"use client"`). The package has been renamed `motion` upstream |
| State | zustand 5, @tanstack/react-query 5 | Both migrate fine; stores need SSR-safe storage access |
| Networking | axios | Single instance; fine in Next client components |
| Forms / validation | react-hook-form, @hookform/resolvers, zod 4 | Reusable as is |
| Auth | @clerk/clerk-react | → `@clerk/nextjs` |
| Charts | chart.js, react-chartjs-2 | Admin only; client-only |
| Icons | lucide-react, react-icons | Two icon libraries (react-icons for brand icons only: Si/Fa/Lu/Ci). Could merge |
| Testing | vitest, @testing-library/*, jsdom | Barely used |
| Lint | eslint 9 + react-hooks + react-refresh | `react-refresh/vite` config is Vite-specific |

### 15.2 Backend

| Category | Packages | Notes |
|---|---|---|
| Server | express 5, cors | Express 5 async error propagation available but not leaned on |
| Database | mongoose 9 | |
| Auth | jsonwebtoken, bcryptjs, **@clerk/clerk-sdk-node (deprecated)** | |
| Security | express-rate-limit | No helmet |
| Validation | zod 4 | Uses Zod-3-era APIs (`.passthrough()`, `ZodIssueCode`, `required_error`) that are deprecated in v4 |
| AI | @langchain/community, @langchain/google-genai, @langchain/textsplitters, @langchain/classic, @langchain/core (peer), faiss-node (peer of FaissStore), groq-sdk | `faiss-node` is a **native module**, so builds need a compatible platform/toolchain |
| Doc parsing | pdf-parse, mammoth | Legacy path only (also used by PDFLoader → pdf-parse) |
| Uploads | multer 2, cloudinary 2 | |
| Utilities | dotenv | |
| Dev | nodemon (**in dependencies**), jest, supertest | |

### 15.3 Problems

- **Unused (VERIFIED: zero imports):** `resend`, `@google/generative-ai`, `@langchain/groq`.
- **Misplaced:** `nodemon` belongs in devDependencies.
- **Deprecated:** `@clerk/clerk-sdk-node`.
- **Duplicated concepts:** two Groq integrations (active RAG chain + legacy service), two RAG pipelines, two icon libraries, two "resume" knowledge stores.
- **Next.js migration friction:** `react-router-dom` (all navigation/`Link`/`useLocation`/`Navigate`/`Outlet`), `@clerk/clerk-react`, `@tailwindcss/vite`, `import.meta.env` (3 sites), `eslint-plugin-react-refresh`. Vite-specific `import.meta.glob` is **not** used (good).

---

## 16. Security

| # | Severity | Finding | Location |
|---|---|---|---|
| S1 | 🔴 Critical | Clerk sync trusts body email when the token has no email claim → possible takeover of any account incl. admin | [auth.controller.js:75-92](../server/src/controllers/auth.controller.js#L75-L92) |
| S2 | 🔴 High | `POST /games/merge` reassigns **any** `guestId`'s scores. `GET /games/leaderboard/:slug` **publishes** `guestId` and `userId` | [game.controller.js](../server/src/controllers/game.controller.js), [line 141](../server/src/controllers/game.controller.js#L141) |
| S3 | 🟠 High | Game scores are computed client-side and accepted as-is (any number ≥0), unthrottled, so the leaderboard can be spoofed | `submitScore` |
| S4 | 🟠 High | Public, unthrottled analytics writes (delta ≤20, arbitrary `page`), so counters can be inflated and documents created without limit | analytics routes |
| S5 | 🟠 High | No rate limit or lockout on login/register; contact cooldown is in-memory only (resets on restart, grows unbounded, per-instance) | auth/contact |
| S6 | 🟡 Medium | CORS accepts **any `*.onrender.com` origin** with `credentials:true`. Impact is limited today (Bearer token in localStorage, not cookies) but too broad | [index.js:47](../server/index.js#L47) |
| S7 | 🟡 Medium | Unescaped user input in `$regex` on public `GET /projects?q=` (≤80 chars), a ReDoS / regex-injection vector against Mongo | `project.controller.js listProjects` |
| S8 | 🟡 Medium | Stack traces returned unless `NODE_ENV === 'production'` exactly (production value UNKNOWN). The same flag decides GitHub vs local-disk resume publishing | errorMiddleware, github.service |
| S9 | 🟡 Medium | JWT in localStorage (XSS-exfiltratable); 24 h validity, no revocation | client auth |
| S10 | 🟡 Medium | `GITHUB_TOKEN` (repo write) on an internet-facing server; a compromised server lets an attacker push code to the repo, which may auto-deploy | github.service |
| S11 | 🟡 Medium | Cloudinary URL check uses `hostname.endsWith('cloudinary.com')` (also matches e.g. `evilcloudinary.com`) and Zod uses `.includes('cloudinary.com')`. The server **fetches** these URLs (download proxy, GitHub publish), a minor SSRF surface. Admin-only input | [cloudinary.service.js:45](../server/src/services/cloudinary.service.js#L45) |
| S12 | 🟡 Medium | Chatbot persona instructed to deny being an AI; knowledge base contains personal phone and email | rag/prompts, knowledge.md |
| S13 | 🟢 Low | Every request logged with `console.log` in production (noise; no PII beyond path/origin) | [index.js:61](../server/index.js#L61) |
| S14 | 🟢 Low | Contact POST echoes the stored document incl. `ipAddress`; IPs are retained indefinitely (privacy policy implications) | contact.controller |
| S15 | 🟢 Low | Hardcoded fallback JWT secret (currently unreachable) | generateToken.js |
| S16 | 🟢 Low | No `helmet` (security headers); API is JSON-only, so impact is low | index.js |
| S17 | 🟢 Low | `.gitignore` files ignore themselves and are **not tracked**. A fresh clone has no ignore rules, so `.env` could be committed accidentally | client/server `.gitignore` |
| S18 | 🟢 Low | `GameProgress.state` is unvalidated `Mixed`; a user can store arbitrary JSON (2 MB body limit) | game.controller |
| ✅ | — | No secrets committed (`.env` files untracked, VERIFIED via `git ls-files`). Passwords bcrypt-hashed and `select:false`. Admin routes consistently guarded server-side. Zod strips unknown fields (no mass-assignment of `role`). No `dangerouslySetInnerHTML`. Upload MIME/size limits. | — |

---

## 17. Performance

| Area | Finding | Evidence |
|---|---|---|
| Bundle | Last build: main chunk **412 KB** raw, shared `api` chunk 158 KB, Admin dashboard 180 KB (Chart.js), CSS 90 KB. Route-level lazy loading exists | `client/dist/assets` (VERIFIED, build of 2026-08-02) |
| Global providers | Clerk JS + provider loads for **every** visitor, though most never log in | main.jsx |
| Images | ⚠ `favicon.svg` **942 KB** (every page), `favic.svg` 803 KB (unused), `hero/arif.png` 552 KB, `memorization-logo.png` 871 KB. No modern formats/responsive sizes for local assets (Cloudinary images also served without transformation params, INFERRED) | public/, assets/ |
| API waterfall | Home fires `/resume`, `/projects`, `/certificates`, `/skills`, plus global `/resume/default` and `/analytics/visit`: **6 requests** on first paint, all blocked by backend cold start | Home.jsx, App.jsx |
| Resume prefetch | `DefaultResumeSync` refetches `/resume/default` on **every window focus / visibility change**, and may download the full resume PDF into Cache Storage | App.jsx:92, defaultResumeCache.js |
| Admin polling | Summary refetches every 10 s **in background**; chart mounts 4 queries at once | useAdminApi.js:253 |
| React Query | Sensible defaults (staleTime 30 s, no focus refetch, retry 1) | queryClient.js |
| Rendering | `AnimatePresence mode="wait"` around all routes delays each navigation until the exit animation finishes. Framer Motion is used heavily (39 files); `SkillGraph` (416 lines) is the most complex animated component | App.jsx |
| Fonts | Google Fonts via `<link>` (render-blocking CSS; no `font-display` control beyond `&display=swap`) | index.html |
| Backend cold start | Mongo connect + `User.countDocuments()` on boot; RAG rebuild re-embeds everything when the cache is missing (always, on a fresh Render deploy) | db.js, rag/index.js |
| DB queries | Case-insensitive regex email lookup (no index use); `listProjects` regex search unindexed; `getMyRank` N+1 (4 diffs × 2 queries); summary runs two near-identical full `Analytics` aggregations. All fine at current scale | controllers |
| Resume download | Proxied through the API (stream from Cloudinary), so it costs backend bandwidth and suffers cold starts | resume.controller |

---

## 18. SEO

| Check | Status | Evidence |
|---|---|---|
| `<title>` | ⚠ One static title for every route ("Mohd Arif Ansari"); no per-route titles (`document.title` never set) | index.html |
| Meta description | ❌ None | index.html |
| Open Graph / Twitter cards | ❌ None (link shares show no preview) | index.html |
| Canonical URLs | ❌ None | — |
| robots.txt / sitemap.xml | ❌ Neither exists | client/public |
| Structured data (JSON-LD) | ❌ None (no `Person`/`Organization`/`CreativeWork`) | — |
| Rendering | ❌ Pure CSR; crawlers get an empty `<div id="root">` until JS runs and the API answers (with cold start) | Vite SPA |
| Semantic HTML / headings | ⚠ **Home page has no `<h1>`**; sections use `<h2>` via `SectionHeader`; About has an `<h1>` | grep |
| Image alt text | ✅ Mostly present (`alt={alt}`, `alt={skill.skill}`, etc.); some decorative `alt=""` | components |
| Route-level metadata | ❌ None | — |
| Dynamic detail pages | ❌ No `/projects/:slug` pages; projects only appear in grids; `GET /projects/:id` exists but is unused | App.jsx |
| `lang` attribute | ✅ `lang="en"` | index.html |

**What Next.js would improve:** server-rendered or statically generated HTML for every public page; the `metadata` / `generateMetadata` API for per-route titles, descriptions, OG and Twitter tags; `app/sitemap.ts` and `app/robots.ts`; `next/og` for generated OG images; `next/image` for responsive, modern-format images (Cloudinary loader); `next/font` for self-hosted fonts with no layout shift; ISR for content-backed pages (case studies, services, blog) so pages stay fresh **without** being exposed to Render cold starts at request time; easy JSON-LD per page.

---

## 19. Technical Debt

### Critical
1. **Clerk sync email trust** (S1). Fix before anything else, including the redesign.
2. **Game merge / leaderboard ID exposure** (S2) and client-trusted scores (S3).

### High (fix before or during the redesign)
3. **Hardcoded content served as API data** (`resume.data.js`) plus **auto-seeding placeholders** into production collections.
4. **Chatbot knowledge is decoupled from the CMS.** `/ai/resume/upload` writes to an unused store, and `contextAggregator.service.js` is dead.
5. **Zod 4 partial-update defaults wipe fields** on PATCH `/projects/:id` when fields are omitted (VERIFIED by evaluating the schema). Other `*.partial()`/`.default()` combos deserve the same check.
6. **No tests** (one placeholder each side), so a migration has no safety net.
7. **No deployment config in the repo** (no start script, no SPA rewrite file, no Node pin), so production setup is undocumented.
8. **Public analytics write endpoints** are abusable; metrics aren't trustworthy for business decisions.
9. **Persona prompt** ("never reveal you are an AI") and PII in `knowledge.md`.

### Medium
10. ~700 lines of legacy RAG in `resumeKnowledge.service.js`; duplicate Groq client.
11. Unused deps (`resend`, `@google/generative-ai`, `@langchain/groq`); `nodemon` in prod deps; deprecated Clerk SDK; Zod-3-era APIs on Zod 4.
12. Two identity systems; Clerk required even for anonymous visitors; unused `/auth/google`.
13. Large components: `AdminSkillsPage` (559), `GlobalChatbot` (533), `AdminProjectsPage` (492), `AdminResumePage` (474), `useAdminApi` (466), `SkillGraph` (416).
14. GET endpoints with write side effects (`ensureDefaultResumeSelection`, `ensureSeedData`).
15. Duplicated sources of truth: game catalog (client registry + server constant), social links (hero constants, contact section, knowledge.md), profile (hero constants, resume.data.js, knowledge.md).
16. Hard-coded taxonomies in schemas (`Project.category ∈ {MERN, Django, AI}`, `Resume.category`). These are wrong for a studio.
17. Cross-package file coupling: server reads and writes `client/public/resume.pdf`.
18. No error boundaries; 401 → hard redirect.
19. Unbounded in-memory structures (contact cooldown map, rate-limit store) that don't survive restarts and don't scale horizontally.
20. Oversized static assets (favicons ~1.7 MB combined).
21. All 35 files flagged as modified in git are CRLF/LF noise; there's no `.gitattributes`.

### Low
22. Dead files: `App.css`, `SkillsShowcase`, `AIChatbotSection`, `LazyMountSection`/`useInViewMount`, `favic.svg`, `server/uploads/`, `useGamesQuery` (hits a non-existent route), `useAnalyticsMutation`, unused endpoints (`/ai/status`, `/analytics/project`, `/analytics/yearly`, `/projects/:id/view`, alias download routes).
23. Typo directory `components/games/assests/`.
24. Tracked `server/.DS_Store`; stray `*.log` files.
25. README out of sync with code (claims error boundaries, lazy-mount sections, Vercel/Netlify hosting).
26. Cloudinary assets never deleted when records are deleted (storage leak).
27. Deleting a user leaves their game scores and progress orphaned.

---

## 20. Next.js Migration Assessment

### 20.1 Easy to migrate (mostly copy + `"use client"` where needed)
- **Tailwind v4** theme/tokens (`index.css`). Swap the Vite plugin for `@tailwindcss/postcss`.
- **UI primitives and common components:** `ui/*`, `common/*`, `layout/Container|SectionWrapper`.
- **Framer Motion** components, as client components.
- **Pure helpers:** `utils/date.js`, `lib/scoringEngine.js`, `lib/logger.js`, Zod schemas (`schemas/*`), `hero.constants.js` data.
- **React Query hooks** (`usePortfolioApi`, `useAdminApi`, `useGameApi`). They work unchanged inside client components.
- **Admin CRUD screens:** an entirely client-side, authenticated, non-SEO area. Can move almost verbatim under `app/admin/` as client components.

### 20.2 Requires modification
| Item | Why | Scope |
|---|---|---|
| React Router (`Link`, `useLocation`, `useNavigate`, `Navigate`, `Outlet`) | Replace with `next/link`, `usePathname`, `useRouter`, `redirect`, nested `layout.tsx` | ~20 routes, every nav component |
| `localStorage` at **module scope** (`useAuthStore` initial state, `useGameStore` `getItem`) | Crashes during server render/import | Make lazy (`persist` middleware with `skipHydration`, or read in `useEffect`) |
| 26 files using `window`/`document` | Must be client components or guarded | Mechanical |
| `import.meta.env.*` | → `process.env.NEXT_PUBLIC_*` | 3 sites |
| Clerk (`@clerk/clerk-react`, `SignInButton`, `AuthenticateWithRedirectCallback`) | → `@clerk/nextjs` (`ClerkProvider`, `clerkMiddleware`), or remove Clerk (see §24) | Login, SSOCallback, provider |
| Providers (`QueryClientProvider`, `ToastProvider`, `ClerkProvider`) | Move into a `"use client"` `providers.tsx` used by the root layout | Small |
| Lazy routes / `Suspense` fallbacks | Replaced by Next route splitting + `loading.tsx` | Small |
| Chart.js | `dynamic(() => import(...), { ssr:false })` | Admin only |
| Global sync components (`AuthSync`, `DefaultResumeSync`, `GameMergeSync`) | Client-only effects in a client layout | Small |

### 20.3 Needs architectural redesign
- **Routing and layouts:** public marketing layout vs. full-screen game layout vs. admin layout should become route groups (`(marketing)`, `(labs)`, `admin`).
- **Data fetching:** public content should move from client-side React Query to **server components + `fetch` with ISR** (or build-time SSG) against the Express API. That's the main SEO and performance win. The backend's cold start must be designed around it (revalidation tolerates slow responses; the visitor never waits).
- **Metadata/SEO:** per-route `metadata`, `generateMetadata` for case-study/project detail pages (needs **slug** fields, which don't exist today), sitemap, robots, JSON-LD.
- **Authentication model:** the JWT lives in `localStorage`, so **server components can't see auth state**. Options: (a) keep admin fully client-rendered (simplest, works today); (b) move to an httpOnly cookie set by the API on a shared parent domain, or proxied through Next route handlers (requires backend changes: cookie issuance, CORS `credentials`, CSRF consideration).
- **Page transitions:** `AnimatePresence` exit animations keyed on location don't map cleanly to the App Router (layouts persist, pages unmount without exit hooks). The transition design has to be redone (`template.tsx`, enter-only animations, or the View Transitions API).
- **Images:** `next/image` with a Cloudinary loader/remotePatterns; replace oversized local assets.

### 20.4 Potentially problematic
- **Render cold starts × ISR/SSG:** a build or revalidation that hits a sleeping API can time out. Needs generous timeouts, fallbacks, or an always-on API instance.
- **CORS:** a new frontend origin (e.g. `*.vercel.app` previews) isn't in the allow-list. The current `*.onrender.com` wildcard shows how allow-lists tend to sprawl.
- **Resume publishing pipeline:** the server commits to `client/public/resume.pdf` and reads it for RAG. Moving the frontend into a new folder or repo breaks both silently.
- **Hydration mismatches:** components that read `window.innerWidth` in `useState` initializers (e.g. `GlobalChatbot` `isMobile`) or localStorage on first render.
- **Bleeding-edge versions** (React 19.2, Vite 8, Zod 4, Express 5, Mongoose 9) mostly help (Next 15/16 needs React 19), but confirm Next's supported React version at migration time.
- **Two-identity auth** will be the hardest piece to move unless it's simplified first.

**Honest verdict:** The migration is **justified by the repositioning, not by the current code quality.** A studio site lives or dies on SEO, page speed and shareable case-study URLs, and the current CSR SPA can't deliver those without SSR/SSG. The public UI is being redesigned anyway, so there's little UI code to "migrate"; it's mostly a rebuild, while **admin, hooks, schemas and helpers port with modest effort**. If the studio site were a single landing page with no content marketing, a Vite SPA + prerendering would be a cheaper alternative. Given the stated roadmap (case studies, blog, services, SEO), Next.js is the better fit.

---

## 21. Preserve / Refactor / Rebuild

### Preserve as-is (reuse directly)
- Express app skeleton, error middleware, `validateRequest` pattern, upload middleware.
- MongoDB Atlas + Mongoose models: **User, Skill, Experience, Certificate, Resume, Analytics, Message** (extend later, don't replace).
- Cloudinary service (fix the hostname check).
- `defaultResume.service` (single-default logic), timeline/date services.
- Admin user-management guards (self/last-admin protection).
- Local JWT auth core (bcrypt, `protect`/`admin` middleware).

### Preserve but refactor
| Component | Refactor |
|---|---|
| Clerk→JWT sync | Resolve identity from `decoded.sub` via the Clerk API; never trust body email. Or drop Clerk (see §24) |
| Project model + API | Add `slug`, `client`, `industry`, `problem/solution/results`, gallery, `featured`, `status`; free-form categories; fix partial-update defaults. It becomes the **Case Study** entity |
| Contact/Message | Becomes **Lead/Inquiry**: company, budget, timeline, service, source/UTM, status (new/contacted/won/lost), notes; email notification (Resend is already installed); spam protection (rate limit + captcha/honeypot) |
| Analytics | Lock down writes (rate limit, allow-listed pages, bot filtering), or replace with a privacy-friendly provider (Plausible/Umami/PostHog/Vercel Analytics). Keep only business events (lead submitted, CTA clicked) in-house |
| Chatbot / RAG | Studio-assistant persona **with AI disclosure**; build the knowledge base from DB content (start from `contextAggregator.service`); remove the legacy service and the `ResumeKnowledge` path; persist cache or use a managed vector store if multi-instance |
| Admin dashboard | Keep CRUD screens and patterns; split large pages; add new studio entities; fix 10 s background polling |
| API layer (client) | Keep axios + React Query for admin; replace public reads with server-side fetch |
| Resume pipeline | Decouple from the GitHub commit + cross-package file; serve the resume from Cloudinary/CDN directly. Probably de-emphasize for a studio |
| Games/Labs | Keep as an optional "Labs/Playground" showcase if desired; fix merge/leaderboard security; validate scores server-side or drop the leaderboard |

### Rebuild
- **Entire public frontend UI:** homepage, navigation, footer, hero, sections (portfolio-persona copy is hardcoded throughout).
- **Routing/layout** (App Router), SEO/metadata, image pipeline, page transitions.
- **Content source:** move all hardcoded content (`resume.data.js`, hero constants, education, profiles, knowledge.md) into CMS-managed collections.

### Remove / deprecate (strong evidence)
- `server/src/services/contextAggregator.service.js` (dead; *or* revive it for the chatbot, so decide which).
- Legacy portions of `resumeKnowledge.service.js`, the `ResumeKnowledge` model, `POST /ai/resume/upload`, `GET /ai/status` (no consumers).
- `POST /auth/google` (duplicate of `/auth/sync-user`, unused).
- Dead client files: `App.css`, `SkillsShowcase`, `AIChatbotSection`, `LazyMountSection`, `useInViewMount`, `useGamesQuery`, `useAnalyticsMutation`, `public/favic.svg`.
- Unused deps: `resend` (unless wired for leads, which is recommended), `@google/generative-ai`, `@langchain/groq`; move `nodemon` to dev.
- `ensureSeedData()` placeholder seeding in production paths.
- Alias routes `/resume/download`, `/resume/download-resume` (keep one).

---

## 22. Future Software Studio Readiness

| Capability | Status | Basis |
|---|---|---|
| Services pages | **REQUIRES NEW ARCHITECTURE** | No Service model/API/UI. Admin CRUD pattern can be cloned |
| Case studies | **PARTIALLY SUPPORTED** | Project model + admin CRUD + Cloudinary images exist; lacks slug, rich fields, detail pages, SEO |
| Client projects (portfolio of client work) | **PARTIALLY SUPPORTED** | Same as above; no client/industry/testimonial linkage |
| Lead generation | **PARTIALLY SUPPORTED** | Contact form + Message store + admin view exist; no qualification fields, status pipeline, notifications, spam protection, or attribution |
| Contact forms | **SUPPORTED** (basic) | Working end-to-end; needs hardening |
| Project inquiry (multi-step brief) | **REQUIRES NEW ARCHITECTURE** | No model/flow |
| Testimonials | **REQUIRES NEW ARCHITECTURE** | No model |
| Pricing | **REQUIRES NEW ARCHITECTURE** | No model; static page possible |
| Blog / Insights | **REQUIRES NEW ARCHITECTURE** | No Post model, no rich-text/MDX, no slugs, no SSR |
| CMS-like content | **PARTIALLY SUPPORTED** | Solid admin CRUD + uploads pattern; much site copy is hardcoded; no drafts/publish, no versioning, no rich text |
| Admin content management | **PARTIALLY SUPPORTED** | Works for 6 entity types; single admin role |
| SEO | **REQUIRES NEW ARCHITECTURE** | CSR-only (see §18) |
| Analytics | **PARTIALLY SUPPORTED** | Counters + admin charts exist; no unique visitors/referrers/UTM/conversions; abusable |
| AI chatbot | **PARTIALLY SUPPORTED** | Working RAG infra (Groq + Gemini + FAISS); persona, knowledge source, and disclosure need redesign |
| Newsletter | **REQUIRES NEW ARCHITECTURE** | No subscriber model; Resend SDK installed but unused |
| Client dashboard / portal | **REQUIRES NEW ARCHITECTURE** | Auth + user role exist, but no client entities, permissions, projects/invoices/files; the "protected user pages" route group is empty |
| Authentication | **PARTIALLY SUPPORTED** | Local + Google exist; critical flaw; dual-system complexity; single role |
| Future SaaS products | **REQUIRES NEW ARCHITECTURE** | No multi-tenancy, billing, or per-product auth; the API is single-site |

---

## 23. Current Architecture Diagram

### 23.1 System
```
                           ┌───────────────────────────────┐
 Visitor / Admin  ───────► │ React 19 SPA (Vite build)     │  Render Static Site [INFERRED]
                           │ Router v7 · React Query ·     │
                           │ Zustand · Clerk · Framer      │
                           └──────────────┬────────────────┘
                     Bearer JWT (localStorage) │ HTTPS JSON / multipart
                                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Express 5 API (Render Web Service)                                        │
│ CORS → log → json → router → [protect/admin] → [multer] → [zod] → ctrl    │
│                                                                            │
│  auth  projects  certificates  skills  experiences  resume  contact        │
│  analytics  ai(RAG)  games  admin/users  admin/resumes                     │
└───┬──────────────┬───────────────┬───────────────┬──────────────┬─────────┘
    ▼              ▼               ▼               ▼              ▼
 MongoDB Atlas  Cloudinary     Clerk Backend   Groq (LLM)     GitHub API
 (11 colls)     (img/raw)      (verifyToken)   Gemini (emb)   (commit resume.pdf)
                                               FAISS (in-proc, disk cache)
```

### 23.2 Flows (only flows that exist in code)

**Public content (Projects / Certificates / Skills)**
```
Page mount → React Query → GET /projects|/certificates|/skills
 → ensureSeedData() (first call per process) → aggregate/find → JSON → render
```

**Resume content & download**
```
Home/About/Experience → GET /resume → static resume.data.js + Experience docs
App mount/focus → GET /resume/default → ensureDefaultResumeSelection() (may write) → metadata
Download click → Cache Storage hit? → blob : GET /download-resume → stream from Cloudinary
```

**Local login**
```
/login → POST /auth/login → bcrypt → JWT(1d) → localStorage → Bearer on all calls
```

**Google (Clerk) login**
```
Clerk SignIn → Google → Clerk session → /sso-callback or AuthSync
 → POST /auth/sync-user {clerkToken, email…} → Clerk verifyToken → find/create User → JWT → localStorage
```

**Contact form**
```
ContactSection (RHF+zod) → POST /contact → zod → in-memory cooldown → Message.create
 → Admin dashboard GET /contact (no email notification)
```

**Admin CRUD (e.g. project)**
```
AdminProjectsPage → multipart PATCH /projects/:id → protect → admin → multer → zod
 → Cloudinary upload (if file) → findByIdAndUpdate → invalidate React Query cache
```

**Default resume publish**
```
Admin "Set default" → PATCH /resume/set-default/:id → Resume update
 → (prod) download PDF → GitHub PUT contents (client/public/resume.pdf) → RAG rebuild
 → (non-prod) write ../client/public/resume.pdf locally → RAG rebuild
```

**Visitor tracking / analytics**
```
Route change → sessionStorage dedupe → POST /analytics/visit → upsert {page, today} $inc views
Section view/click → POST /analytics/event ; Chat send → POST /analytics/chatbot
Admin → GET /analytics/summary (10 s) + daily/monthly → Chart.js
```

**Chatbot**
```
GlobalChatbot → POST /ai/chat {query, history} → rate limit → zod → ready?
 → classify → [RAG: Gemini query embedding → FAISS top-5] → Groq llama-3.3-70b → {answer}
```

**Game**
```
/game/memorization → play (client-side scoring) → POST /games/scores (guestId or JWT)
 → leaderboard GET ; login → merge modal → POST /games/merge {guestId}
```

---

## 24. Proposed Future Architecture

> Conceptual only, not an implementation plan. Each recommendation states *why*, based on what the codebase shows.

```
                 ┌──────────────────────────────────────────────────────┐
 Visitors ─────► │ Next.js (App Router, TypeScript) on Vercel           │
                 │  (marketing)  SSG/ISR: home, services, case studies, │
                 │               blog, pricing, about, contact          │
                 │  (labs)       optional client-only playground/games  │
                 │  admin/       client-rendered CMS (ported screens)   │
                 │  route handlers: revalidate webhook, lead form proxy │
                 └───────────┬──────────────────────────────────────────┘
       server fetch (ISR)    │   client fetch (admin, chatbot)
                             ▼
                 ┌──────────────────────────────────────────────────────┐
                 │ Existing Express API (hardened), always-on instance  │
                 │  + new resources: services, caseStudies (=projects+), │
                 │    testimonials, posts, leads (=messages+), settings  │
                 │  + on content change → POST Next revalidate webhook   │
                 └──┬─────────┬──────────┬───────────┬────────────┬──────┘
                    ▼         ▼          ▼           ▼            ▼
              MongoDB Atlas Cloudinary  Resend    Groq+Gemini   Auth (one system)
```

| Decision | Recommendation | Why (evidence) |
|---|---|---|
| Frontend framework | **Next.js App Router + TypeScript** | Studio positioning needs SSR/SSG SEO and shareable case-study URLs (§18). The public UI is being rebuilt anyway (§21). React 19 is already in use. TypeScript pays off when you're writing new domain models and API contracts |
| Styling / motion | **Keep Tailwind v4 + Framer Motion (`motion`)** | Already the house style; ports directly (§20.1) |
| Public data fetching | **Server components + ISR against Express**, revalidated by an API webhook on admin writes | Removes the 6-request CSR waterfall and hides Render cold starts from visitors (§14, §17) |
| Admin | **Port existing admin screens as client components**, keep React Query + axios | Most mature, real-data part of the codebase (§9); no SEO need |
| Backend | **Keep Express initially**; harden (rate limits, helmet, CORS allow-list, fix S1–S8) and extend with studio resources using the existing route→zod→controller→service pattern | ~70% reusable; clean layering (§5). Rewriting into Next route handlers buys little and risks regressions with zero test coverage |
| Hosting | API on an **always-on** instance (or keep public pages fully static so a sleeping API only affects admin/chat); frontend on Vercel or Render static | Cold starts directly hurt first impressions and ISR builds (§14) |
| Database | **Keep MongoDB Atlas**; add `slug`, `status: draft/published`, `publishedAt`, SEO fields to content models; separate dev/prod DBs | Models already fit document-shaped content; dev may share the prod DB today (§13) |
| Content source | Move every hardcoded string (`resume.data.js`, hero constants, education, profiles) into a **Settings/Profile** collection managed in admin; remove production seeding | §9 hardcoded table; seeding risk (§7) |
| Authentication | Pick **one** identity system. Visitors don't need accounts on a studio site. **Short-term:** fix the Clerk sync (verify via `sub`) or disable Google login. **Long-term:** if a client portal is planned, use Clerk end-to-end (`@clerk/nextjs` + `@clerk/express`, roles in Clerk metadata, mapped to a local user by `clerkId`); otherwise keep only local admin JWT, ideally in an httpOnly cookie | Dual-system complexity + critical flaw (§8); deprecated SDK |
| Leads | Extend Message into Lead with pipeline status; **wire Resend** (already installed and keyed) for admin notifications + autoresponder; add honeypot/captcha + rate limit | §11, §16, §22 |
| Analytics | Use a hosted privacy-friendly analytics tool for traffic; keep in-house only **conversion events** (lead submitted, CTA clicks) with authenticated/validated writes | Current counters are abusable and lack attribution (§11) |
| AI chatbot | Re-scope as a **studio assistant**: discloses it's an AI, answers about services/case studies/process, can route to the lead form. Build knowledge from DB content (revive `contextAggregator`); delete the legacy pipeline; consider a managed vector store only if scaling beyond one instance | §10 |
| Labs/games | Optional. Keep as a "Playground" credibility piece behind its own layout, after fixing merge/leaderboard security, or retire it | Self-contained module (§4.3); security issues (§16) |
| Repo hygiene | Track `.gitignore` files, add `.gitattributes` (LF), add `start` script + `engines`, add deploy config as code, add CI (lint + tests) | §3, §14, §19 |

---

## 25. Migration Risks

| # | Risk | Likelihood | Impact | Mitigation direction |
|---|---|---|---|---|
| R1 | Shipping the redesign while S1 (auth takeover) is still live | High if not prioritized | Critical | Fix as an isolated hotfix **before** the migration starts |
| R2 | No tests, so silent regressions in admin/API during refactors | High | High | Add API contract tests (supertest) for the endpoints to be kept, before touching them |
| R3 | ISR/SSG builds time out against a sleeping Render API | Medium | High | Always-on API, build-time fallbacks, or static JSON export of content |
| R4 | Breaking the resume→GitHub→RAG coupling when moving folders | Medium | Medium | Decouple RAG sources from `client/public` first |
| R5 | CORS / new origins (Vercel previews) rejected | High | Medium | Explicit allow-list via env, no wildcard suffixes |
| R6 | Auth model mismatch (localStorage JWT vs server components) | High | Medium | Keep admin client-rendered at first; cookie-based auth as a later, separate step |
| R7 | Hardcoded/seeded placeholder content leaking into the new site | Medium | Medium | Content audit + remove `ensureSeedData` before launch |
| R8 | Analytics continuity: old counters not comparable with new tooling | High | Low | Accept a reset; snapshot old data |
| R9 | SEO equity loss when URLs change (`/labs`, `/projects`, the onrender domain) | Medium | Medium | 301 redirects map; custom domain early |
| R10 | Dev environment pointing at the production DB (UNKNOWN) during migration experiments | Unknown | High | Confirm and separate databases before migration work |
| R11 | Page-transition UX regressions (AnimatePresence semantics) | High | Low | Redesign transitions rather than port them |
| R12 | Native `faiss-node` build issues on new hosts/Node versions | Medium | Medium | Pin Node; consider a hosted vector store |
| R13 | Chatbot impersonation persona carried into a business context | Medium | Medium–High (trust/legal) | Rewrite persona with disclosure |
| R14 | Scope creep (client portal / SaaS) before the marketing site launches | Medium | High | Stage: marketing site → leads/CMS → portal |

---

## 26. Unknowns / Questions

*Not verifiable from the current codebase.*

1. **Clerk session token claims:** Has the Clerk instance been customized to include `email` in session tokens? This decides whether S1 can be exploited **today**.
2. **Hosting:** Exact Render services, plans (free/sleeping?), regions, build/start commands, SPA rewrite rules, auto-deploy triggers, and the production `NODE_ENV` value.
3. **Frontend host:** Render static site (code suggests) or Vercel/Netlify (README says)?
4. **Backend production URL** and whether a custom domain exists or is planned.
5. **Database separation:** Do local dev and production share the same Atlas cluster/database?
6. **First admin creation:** How was the current admin user created? Is there more than one admin?
7. **Clerk usage:** How many users signed up via Google vs local? Is visitor login a feature you want to keep for the studio?
8. **GitHub PAT scope:** Fine-grained (single repo, contents:write) or classic broad token?
9. **Content volume:** How many projects/certificates exist in production? (The public projects page shows at most 12, with no pagination.)
10. **Analytics needs:** Is in-house analytics a product requirement, or is a hosted tool acceptable?
11. **Chatbot direction:** Keep a chatbot on the studio site? Should it represent the studio (team voice) or a person?
12. **Games/Labs:** Keep as a showcase, or retire?
13. **Branding:** Will the studio keep the personal name/domain (`arif-ansari`) or move to a new brand domain? This affects SEO redirects.
14. **Team:** Solo freelancer or multiple people? This affects roles (single `admin` today) and testimonials/case-study authorship.
15. **Client portal timeline:** If it's near-term, the auth decision in §24 should favor Clerk end-to-end now.

---

## 27. FINAL RECOMMENDATION

The codebase has a **sound, reusable backend core** and a **working admin CMS**, wrapped in a **portfolio-specific CSR frontend** that can't meet a studio's SEO and performance needs. Before any redesign, fix one critical auth flaw and a handful of abuse vectors. Then rebuild the public frontend in Next.js on top of the existing Express/Mongo API, extended with studio content models.

| Verdict | |
|---|---|
| **Current architecture health** | **5 / 10.** Clean layering, real CMS, consistent validation. Pulled down by a critical auth flaw, zero tests, hardcoded/seeded content, dead code, no deploy-as-code, no SEO |
| **Frontend migration difficulty** | **Moderate.** Public UI is a rebuild anyway; admin/hooks/schemas port with mechanical changes; the hard parts are auth model, data-fetching strategy, and transitions |
| **Backend reuse potential** | **≈ 70%.** Server skeleton, middleware, validation, models, Cloudinary, admin CRUD reused; auth sync, analytics, chatbot knowledge/persona, games security, and content models need refactoring |
| **Recommended** | **Migrate** the frontend to Next.js (staged), **keep** Express + MongoDB |
| **Biggest technical risk** | The Clerk→JWT sync trusting a client-supplied email (possible admin takeover), combined with **no test coverage** to catch regressions during migration |
| **Biggest opportunity** | Turning the existing admin CMS + Cloudinary + API into a **studio content engine** (case studies, services, leads with Resend notifications), served as SSG/ISR pages with real SEO, plus a re-scoped AI assistant that turns visitors into leads |
| **First thing to do AFTER this audit** | **Patch the auth sync** (derive identity from the verified Clerk `sub`, never from the request body), then lock down `/games/merge` + leaderboard ID exposure, then confirm dev/prod DB separation. Do all of this *before* starting redesign work |
