## Quick orientation for AI contributors

This repository is a React + TypeScript UI component library (library entry: `src/index.tsx`) published as **`ebig-library`** on npm. It is built with Vite for library bundling and produces ESM/CJS outputs with TypeScript declarations.

### Key files

| File | Purpose |
|---|---|
| `src/module/EbigProvider.tsx` | Root provider (`EbigProvider`). Sets up routing, toasts, i18n, design tokens. Wraps `BrowserRouter` internally — consumers must NOT add another one. |
| `src/controller/config.tsx` | `ConfigData` singleton, token-refresh flow, cookie helpers, `BaseDA` (all HTTP calls). |
| `src/controller/data.tsx` | `DataController`, `SettingDataController`, `AccountController` — all require `ConfigData.pid` and `ConfigData.url` to be set first. |
| `src/controller/setting.tsx` | `TableController` (settings CRUD), `EbigController` (project-level queries — keep `ebig/` API paths unchanged), `IntegrationController`. |
| `src/language/i18n.tsx` | Default en/vi i18n bundles; dynamic bundles loaded by `EbigProvider` at runtime. |
| `vite.config.ts` | Library build: entry `src/index.tsx`, formats `["es","cjs"]`, CSS emitted as `style.css`, externals include `react`, `react-dom`, `react-router-dom`, `ckeditor5`. |
| `src/index.tsx` | Single source of truth for public API surface — add/remove exports here. |

### Branding & naming conventions

- Package: **`ebig-library`** (npm)
- Root provider: `EbigProvider` (default export) / `useEbigContext()` hook
- Icon component: `Ebigicon` — fetches SVGs from `https://cdn.ebig.co/icon-library/<path>.svg`, cached via Cache API
- Rich-text editor component: `EbigEditor` / `EbigEditorForm`
- Project-controller: `EbigController` (API routes stay as `ebig/getById`, `ebig/getListSimple` — **do not change these**)
- CSS class prefix for icon module: `ebig-icon`; for editor module: `ebig-editor`
- Style CDN: `https://cdn.ebig.co/library/style/` (loaded by `initializeProject`)

### Critical patterns

- **Provider contract**: `EbigProvider` accepts `pid`, `url`, `fileUrl`, `imgUrlId`. Call `initializeProject(url, {pid})` before any controller. `useEbigContext()` throws outside the provider.
- **API auth**:  expires. `ConfigData.onInvalidToken` is called on 401.
- **Design tokens**: `appendDesignTokens()` in `EbigProvider.tsx` injects `<style class="designTokens">` into `<head>` at runtime. Token `Value` fields may be JSON strings — parsed with `JSON.parse`.
- **File uploads**: `BaseDA.uploadFiles` batches into chunks of 12 files / 200 MB max per batch. Changing this requires updating `BaseDA` in `config.tsx`.

### Build & lint commands

```bash
npm run build   # tsc && vite build → produces dist/
npm run lint    # ESLint over .ts/.tsx
```

No `dev` script exists — use `npx vite` for local development (confirm with maintainers).

### Adding a new component

1. Create `src/component/<name>/<name>.tsx` (+ optional `<name>.module.css`).
2. Export it by name from `src/index.tsx`.
3. Update `README.md` if it's a public API change.

### Checklist before committing

- `src/index.tsx` exports are stable and updated.
- New deps that consumers shouldn't bundle are added to `rollupOptions.external` in `vite.config.ts`.
- `npm run build && npm run lint` both pass with zero errors.
