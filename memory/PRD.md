# Finance Buddy — PRD

## Original Problem Statement
Build a mobile-first web app that pixel-matches the "Finance Buddy" design, stores all data offline in browser localStorage (truly offline, no backend needed), and includes Settings with Import/Export JSON. Create an Android wrapper so it can be built into an APK via Android Studio.

Subsequent iterations:
- Entirely Black & White UI theme.
- B&W PDF generation (no currency glyphs) with PDF merge capability.
- Removal of all toast popups (silent UI).
- Rent/Income tracking section.

## Architecture
- Frontend: React 19 SPA (`/app/frontend`) using HashRouter for `file://` Android compatibility.
- State: `localStorage` JSON tree (`/app/frontend/src/lib/store.js`).
- PDF: `jspdf`, `jspdf-autotable`, `pdf-lib` (`/app/frontend/src/lib/pdf.js`).
- Android: WebView wrapper (`/app/android`) — frontend build copied into `android/app/src/main/assets`.
- Backend: FastAPI template at `/app/backend` (unused; kept to satisfy platform layout).

## Implemented (Feb 2026)
- Offline-first PWA, 6 nav tabs (Investments, Income, Loans, Tasks, Reminders, Calc).
- B&W theme via `filter: grayscale(1)`.
- B&W PDF report generation with 13pt body + auto-wrap; PDF merging in Backup tab.
- Custom `PageTopBar` with Web Share API + PDF download.
- Rent/Income tracking page.
- `Dialog` 3-section flex layout to keep buttons visible above mobile keyboard.
- Android assets pipeline (`scripts/build-android-assets.sh`).
- Selective code-review fixes (Feb 9, 2026):
  - `useMemo` for store context value.
  - `useMemo`/`useCallback` for outlet context in `Layout.js`.
  - All previously-empty `catch` blocks now log via `console.warn` (no UI popups, per "silent UI" requirement).
- Deployment health check passed (Feb 9, 2026).

## Hard Constraints (DO NOT VIOLATE)
- NO toast popups anywhere — silent UI is a product requirement.
- NO localStorage encryption (breaks JSON import/export, no real security gain).
- NO backend API calls — strictly localStorage.
- NO color in the UI — `grayscale(1)` filter on body.
- PDFs must remain B&W; amounts formatted **without** currency symbols (jspdf font glyph limitation).

## Backlog
### P1
- Refactor high-complexity functions in `src/lib/pdf.js` (currently deferred — high regression risk vs low ROI).

### P2
- Optional: split larger page components if maintenance becomes painful.

## Testing
- Smoke screenshot verified post-fix; lint clean on all touched files.
- App password (data reset): `123456`.

## Files of Reference
- `/app/frontend/src/lib/store.js`
- `/app/frontend/src/lib/pdf.js`
- `/app/frontend/src/components/Layout.js`
- `/app/frontend/src/components/PageTopBar.js`
- `/app/frontend/craco.config.js`
- `/app/scripts/build-android-assets.sh`
- `/app/ANDROID_BUILD.md`
