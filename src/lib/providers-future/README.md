# Future Providers (Phase 2 / Phase 3)

These interfaces are the **integration seams** LeadSync OS is architected
around. They are intentionally **declared but not implemented** in Phase 1.

| Interface            | Phase | Concrete target(s)            | Purpose                                   |
| -------------------- | ----- | ----------------------------- | ----------------------------------------- |
| `LeadProvider`       | 2     | Apollo API                    | Source new leads from external search     |
| `EnrichmentProvider` | 2     | Apollo / FullEnrich           | Auto-enrich email, phone, title, size     |
| `AIProvider`         | 2/3   | OpenAI API, Claude API        | Draft outreach, summarise, assist scoring |
| `OutreachProvider`   | 3     | n8n Webhooks                  | Send sequences + track opens/clicks/replies |
| `CRMProvider`        | 2/3   | Supabase                      | Remote system-of-record, realtime sync    |

## How to activate one (example: enrichment)

1. `npm i <sdk>` for the vendor.
2. Create `src/lib/providers/apollo-enrichment-provider.ts` implementing
   `EnrichmentProvider`.
3. Register it: `registerProvider("enrichment", new ApolloEnrichmentProvider())`.
4. Flip the flag: `FEATURE_ENRICHMENT=true` (see `app-config.ts`).

No repository, store, page or component needs to change — they already consume
the capability through `getEnrichmentProvider()` and the feature flag.

## Why two persistence seams?

- `StorageProvider` (in `src/lib/storage`) = **local persistence** (LocalStorage
  now, Supabase tables later).
- `CRMProvider` = **multi-device sync / realtime** layered on top.

Supabase can implement both, but keeping them separate means you can adopt
Supabase for storage without committing to realtime sync, or vice-versa.
