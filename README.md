# Barcode / Product ID Scanner

Next.js barcode scanning app using `html5-qrcode` and Axios.

---

## Camera Scanning Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      CAMERA (html5-qrcode)                  │
│           Continuously detects barcodes at 10 fps           │
└──────────────────────────┬──────────────────────────────────┘
                           │ barcode detected
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND DEDUP GUARD (in-memory Set)           │
│                                                             │
│   scannedSetRef.has(barcode)?                               │
│   YES → ignore silently, show "Already queued"             │
│   NO  → add to Set + push to queue array                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ new barcode
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   SCAN QUEUE (React state)                  │
│                                                             │
│   [ HK10127, HK10128, HK10130, ... ]                       │
│                                                             │
│   - Lives in memory only (cleared on page refresh)         │
│   - Prevents same product from being queued twice           │
│   - User reviews the list before submitting                 │
│   - "Clear" button to discard and start over               │
└──────────────────────────┬──────────────────────────────────┘
                           │ user clicks "Submit"
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           BACKEND  POST /api/process-barcode                │
│                                                             │
│   Receives: { barcodes: string[], timestamp: string }       │
│                                                             │
│   1. Load current data from simple.json                     │
│   2. Build a Set of barcodes saved in the last 10 seconds   │
│   3. For each barcode in the batch:                         │
│      - Already in recent Set? → skipped[]                  │
│      - New? → saved[], add to recent Set (intra-batch dedup)│
│   4. Write saved items to simple.json                       │
│   5. Return { saved[], skipped[] }                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ response
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (post-submit)                    │
│                                                             │
│   - Append saved[] to scan history table                    │
│   - Show "Saved X, skipped Y duplicate(s)"                  │
│   - Clear queue + reset dedup Set                           │
└─────────────────────────────────────────────────────────────┘
```

### Why two layers of dedup?

| Layer | Guards against |
|---|---|
| Frontend `Set` | Camera scanning the same barcode 10x while it's in frame |
| Backend 10s window | Network retries, page refresh mid-session, second device scanning the same product |

### Camera switch
The **BACK / FRONT** button toggles `facingMode` between `"environment"` (rear camera, default) and `"user"` (selfie camera). Switching tears down and re-initializes the scanner automatically.

---

## Getting Started

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Folder structure 

```
my-app/
│
├── app/                                        # App Router — pages + API route handlers
│   ├── (auth)/                                 # Route group (no layout impact)
│   │   ├── login/
│   │   │   └── page.tsx                        # /login
│   │   └── register/
│   │       └── page.tsx                        # /register
│   │
│   ├── (dashboard)/                            # Route group — protected pages
│   │   ├── layout.tsx                          # Auth guard, redirect if unauthenticated
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts                      # Server Actions scoped to this page
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── actions.ts
│   │
│   ├── api/                                    # ← BACKEND REST API
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts                    # POST /api/auth/*  (NextAuth handler)
│   │   ├── users/
│   │   │   ├── route.ts                        # GET /api/users   POST /api/users
│   │   │   └── [id]/
│   │   │       └── route.ts                    # GET PUT DELETE   /api/users/:id
│   │   ├── posts/
│   │   │   ├── route.ts                        # GET /api/posts   POST /api/posts
│   │   │   └── [id]/
│   │   │       └── route.ts                    # GET PUT DELETE   /api/posts/:id
│   │   └── proxy/
│   │       └── route.ts                        # Proxy entry point — forwards to external APIs
│   │
│   ├── layout.tsx                              # Root layout (html, body, providers)
│   ├── page.tsx                                # / home page
│   ├── error.tsx                               # Global error boundary
│   ├── not-found.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                                     # Generic primitives (no domain knowledge)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   └── index.ts                            # Barrel export
│   ├── features/                               # Domain-aware components
│   │   ├── users/
│   │   │   ├── UserCard.tsx
│   │   │   └── UserList.tsx
│   │   └── posts/
│   │       ├── PostCard.tsx
│   │       └── PostForm.tsx
│   └── layouts/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
│
├── server/                                     # ← SERVER-ONLY (never imported by client)
│   ├── db/
│   │   ├── index.ts                            # Prisma/Drizzle singleton client
│   │   └── schema.ts                           # Drizzle schema (skip if using Prisma)
│   ├── services/                               # Business logic layer
│   │   ├── user.service.ts                     # createUser, getUser, updateUser, deleteUser
│   │   ├── post.service.ts
│   │   └── auth.service.ts
│   ├── repositories/                           # Data access layer — DB queries only
│   │   ├── user.repo.ts                        # findById, findAll, insert, update, delete
│   │   └── post.repo.ts
│   ├── lib/                                    # Server-side utilities
│   │   ├── auth.ts                             # NextAuth v5 config
│   │   ├── email.ts                            # Resend / nodemailer setup
│   │   └── session.ts                          # Session helpers
│   └── proxy/                                  # ← PROXY LAYER
│       ├── proxy.ts                            # Core forwarding engine
│       └── proxy.config.ts                     # Allowed hosts, rewrite rules, injected headers
│
├── lib/                                        # Isomorphic utilities (safe for client + server)
│   ├── utils.ts                                # cn(), formatDate(), slugify()
│   ├── constants.ts                            # APP_NAME, ROUTES, LIMITS
│   ├── api-client.ts                           # Typed fetch wrapper for browser usage
│   └── validations/                            # Zod schemas — single source of truth
│       ├── user.schema.ts
│       └── post.schema.ts
│
├── hooks/                                      # Custom React hooks
│   ├── useUser.ts
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
│
├── store/                                      # Zustand global client state
│   ├── auth.store.ts
│   └── ui.store.ts                             # Sidebar open, theme, modals
│
├── types/
│   ├── index.d.ts                              # Global TypeScript types
│   └── api.types.ts                            # Request/response shape types
│
├── middleware.ts                               # Edge middleware — auth guard, CORS, rate-limit
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── tests/
│   ├── unit/                                   # Vitest — services, utils
│   ├── integration/                            # Vitest — API routes with DB
│   └── e2e/                                    # Playwright — full browser flows
│
├── public/                                     # Static assets
│
├── .env.local                                  # DATABASE_URL, NEXTAUTH_SECRET, API keys
├── .env.example
├── next.config.ts                              # Rewrites, proxy headers, CSP, image domains
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts

```
