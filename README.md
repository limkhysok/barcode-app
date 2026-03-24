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

Frontend-only Next.js app. All data comes from an external backend API (`NEXT_PUBLIC_API_URL`).

```
barcode-app/
│
├── app/                                        # App Router — pages only, no API routes
│   ├── layout.tsx                              # Root layout (html, body, providers)
│   ├── page.tsx                                # / home — renders BarcodeScanner
│   ├── error.tsx                               # Global error boundary
│   ├── not-found.tsx
│   └── globals.css
│
├── src/
│   ├── components/
│   │   ├── ui/                                 # Generic primitives (no domain knowledge)
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── index.ts                        # Barrel export
│   │   ├── features/                           # Domain-aware components
│   │   │   └── barcode/
│   │   │       └── BarcodeScanner.tsx          # Camera + queue + history UI
│   │   └── layouts/
│   │       ├── Navbar.tsx
│   │       └── Footer.tsx
│   │
│   ├── services/                               # ← ALL API CALLS TO BACKEND
│   │   ├── api.ts                              # Axios instance (baseURL, interceptors)
│   │   └── barcode.service.ts                  # submitBarcodes(), getHistory()
│   │
│   ├── hooks/                                  # Custom React hooks
│   │   ├── useBarcodeScanner.ts                # Scanner state + camera logic
│   │   └── useLocalStorage.ts
│   │
│   ├── store/                                  # Zustand global client state (if needed)
│   │   └── ui.store.ts                         # Theme, toasts
│   │
│   ├── types/                                  # TypeScript types (mirror backend models)
│   │   ├── barcode.types.ts                    # ScanRecord, SubmitPayload, SubmitResponse
│   │   └── api.types.ts                        # ApiError, PaginatedResponse<T>
│   │
│   └── lib/                                    # Shared utilities
│       ├── utils.ts                            # cn(), formatDate()
│       └── constants.ts                        # ROUTES, APP_NAME
│
├── public/                                     # Static assets
│
├── .env.local                                  # NEXT_PUBLIC_API_URL=http://localhost:8000
├── .env.example
├── next.config.ts                              # CORS headers, image domains
├── tailwind.config.ts
├── tsconfig.json
└── package.json

```
