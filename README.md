# LeadSync OS

An internal, AI-ready **sales operating system** for an automation agency — a
full CRM with leads, a drag-and-drop pipeline, analytics, lead scoring and a
follow-up system. Built to run today on the browser, architected so Phase 2/3
integrations (Supabase, OpenAI/Claude, Apollo, n8n) plug in **without a rewrite**.

## Phase 1 stack

- **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS v4**
- **shadcn/ui** primitives (Radix) · **Recharts** · **dnd-kit**
- **LocalStorage** persistence behind a repository pattern
- **CSV import** (Apollo-export aware, with column mapping)
- Dark-mode-first, Linear/Attio/Stripe/Vercel-inspired UI

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000  (redirects to /dashboard)
```

On first run the app seeds a realistic Dubai real-estate dataset. Other scripts:

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Features

| Area            | What's included                                                                 |
| --------------- | ------------------------------------------------------------------------------- |
| **Dashboard**   | 8 KPIs, lead-growth chart, pipeline funnel, activity feed, follow-up alerts     |
| **Leads**       | 15-column table · search · filters · sorting · pagination · bulk actions · CSV  |
| **Lead detail** | Profile, company/contact info, activity timeline, notes, tasks, score breakdown |
| **Pipeline**    | Drag-and-drop Kanban across 9 stages                                            |
| **Analytics**   | Sources, status distribution, conversion funnel, response/win rates, growth     |
| **Settings**    | Agency, goals, brand, currency, export/import/clear data, integrations panel    |

## Architecture

The whole app is built around swappable seams so later phases are config changes,
not rewrites.

```
src/
├─ app/                      # routes (route group "(app)" = sidebar shell)
├─ components/
│  ├─ ui/                    # shadcn primitives
│  ├─ layout/ charts/ dashboard/ leads/ lead-detail/ pipeline/ shared/
│  └─ providers/             # theme + store hydration gate
├─ store/                    # zustand store (reactive mirror of repositories)
├─ data/                     # first-run seed data
└─ lib/
   ├─ types/                 # all domain interfaces
   ├─ storage/               # StorageProvider | LocalStorageProvider | SupabaseProvider (stub)
   ├─ repositories/          # Lead/Activity/Note/Task/Settings repos (depend only on StorageProvider)
   ├─ scoring/ follow-up/    # lead-scoring + follow-up engines (pure)
   ├─ analytics/ csv/        # dashboard/analytics math + CSV import/export
   ├─ config/                # APP_CONFIG: backend + integration feature flags
   └─ providers-future/      # Phase 2/3 interfaces (declared, NOT implemented)
```

### Repository pattern (LocalStorage → Supabase)

Repositories depend only on the `StorageProvider` interface. `getStorageProvider()`
returns `LocalStorageProvider` today; flipping `NEXT_PUBLIC_STORAGE_BACKEND=supabase`
returns `SupabaseProvider` instead — no repository, store, hook or component changes.
Every method is async so the swap is non-breaking.

### Future providers (Phase 2 / 3)

`src/lib/providers-future/` declares the integration seams the UI is built
against (behind `APP_CONFIG.features` flags):

| Interface            | Target            | Purpose                                  |
| -------------------- | ----------------- | ---------------------------------------- |
| `LeadProvider`       | Apollo            | Source leads from external search        |
| `EnrichmentProvider` | Apollo / FullEnrich | Auto-enrich email, phone, title, size  |
| `AIProvider`         | OpenAI / Claude   | Draft outreach, summarise, assist scoring |
| `OutreachProvider`   | n8n Webhooks      | Send sequences + open/click/reply events |
| `CRMProvider`        | Supabase          | Remote sync / realtime                    |

To activate one: implement the interface, `registerProvider(...)`, flip the flag.

## Lead scoring

Transparent rule engine (`src/lib/scoring`) — Founder +20, Co-Founder +15,
Real Estate +15, Dubai +15, company size 10–100 +10, valid email +10,
LinkedIn +5 (plus phone/website), clamped to 0–100, with a per-lead breakdown.
