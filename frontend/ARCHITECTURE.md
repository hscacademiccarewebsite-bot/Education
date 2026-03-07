# Frontend Architecture (Industry Standard Baseline)

## Structure

```text
frontend/
  app/                      # Next.js app router pages/routes
  components/               # Reusable UI components (legacy-compatible)
  lib/                      # Legacy compatibility layer (re-exports + existing features)
  src/
    app/
      providers/            # App-level providers composition
      store/                # Redux store composition (root reducer + setup)
    shared/
      api/                  # Base API, tags, header auth preparation
      lib/
        errors/             # Global error normalization utilities
```

## Data Flow

1. UI route/page dispatches RTK Query hook.
2. Feature API slice uses shared `baseApi` from `src/shared/api/baseApi`.
3. `prepareAuthHeaders` injects Firebase-backed token from Redux auth state.
4. Response is cached by RTK Query tags.
5. Shared invalidation triggers consistent refresh across pages.

## Standards Applied

1. Single base API owner: `src/shared/api/baseApi.js`.
2. Single store owner: `src/app/store/index.js`.
3. Shared tag types: `src/shared/api/tagTypes.js`.
4. Shared API error parser: `src/shared/lib/errors/normalizeApiError.js`.
5. Backward compatibility kept through `lib/` re-exports to avoid breaking routes.

## Migration Rule (Going Forward)

1. New code goes under `src/`.
2. Existing `lib/` modules are kept as adapters until complete migration.
3. Prefer feature-local hooks/components + shared utilities over page-level ad-hoc logic.

