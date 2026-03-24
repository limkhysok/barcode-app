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
├── app/                                        # App Router — pages only (no API routes)
│   ├── (auth)/                                 # Route group — auth pages
│   │   ├── login/
│   │   │   └── page.tsx                        # /login
│   │   └── register/
│   │       └── page.tsx                        # /register
│   │
│   ├── (dashboard)/                            # Route group — protected pages
│   │   ├── layout.tsx                          # Auth guard, redirect if unauthenticated
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
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
│   │   ├── Spinner.tsx
│   │   └── index.ts                            # Barrel export
│   ├── features/                               # Domain-aware components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
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
├── services/                                   # ← ALL API CALLS TO DJANGO DRF
│   ├── api.ts                                  # Base fetch/axios instance (baseURL, interceptors)
│   ├── auth.service.ts                         # login(), register(), logout(), refreshToken()
│   ├── user.service.ts                         # getUser(), updateUser(), deleteUser()
│   └── post.service.ts                         # getPosts(), createPost(), updatePost()
│
├── lib/                                        # Shared utilities
│   ├── utils.ts                                # cn(), formatDate(), slugify()
│   ├── constants.ts                            # API_BASE_URL, ROUTES, APP_NAME
│   └── validations/                            # Zod schemas — client-side form validation
│       ├── auth.schema.ts
│       ├── user.schema.ts
│       └── post.schema.ts
│
├── hooks/                                      # Custom React hooks
│   ├── useAuth.ts                              # Login state, token refresh
│   ├── useUser.ts
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
│
├── store/                                      # Zustand global client state
│   ├── auth.store.ts                           # accessToken, user, isAuthenticated
│   └── ui.store.ts                             # Sidebar open, theme, toast
│
├── types/                                      # TypeScript types (mirror Django models)
│   ├── index.d.ts
│   ├── auth.types.ts                           # LoginPayload, TokenResponse
│   ├── user.types.ts                           # User, UserProfile
│   └── api.types.ts                            # PaginatedResponse<T>, ApiError
│
├── middleware.ts                               # Route protection at edge (reads cookie/token)
│
├── tests/
│   ├── unit/                                   # Vitest — hooks, utils, stores
│   └── e2e/                                    # Playwright — full browser flows
│
├── public/                                     # Static assets
│   └── images/
│
├── .env.local                                  # NEXT_PUBLIC_API_URL=http://localhost:8000
├── .env.example
├── next.config.ts                              # CORS headers, image domains (Django media)
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts

```
