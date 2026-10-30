# Shared staff and public layouts

Implemented locally by Developer A on 2026-10-29 under the user's one-time shared frontend ownership exception. This is presentation and authenticated navigation, not implementation of HR, Finance, Reports, CMS, Users or Branches services. No deployment is claimed.

## Design inspected

Figma file `eG6p1KxmQeswE6qRA0pmxT`: inspected style guide `1:1127`, component library `1:1098`, staff shell `1:2`, collapsed `1:92`, mobile `1:174`, RTL `1:210`, profile `1:1086`; all five dashboards `1:300`, `1:390`, `1:478`, `1:572`, `1:664`; public home `1:754`, mobile `1:801`, RTL navbar `1:834`, mobile menu `1:850`, footer `1:867`, and About/Programs/Branches/Events/Get Involved/Contact `1:882`, `1:916`, `1:950`, `1:984`, `1:1018`, `1:1052`. Design context and screenshots were retrieved from Figma, rather than approximating from a filename.

Shared React components: FoundationBrand, LanguageSwitcher, MobileNavigation, StaffLayout, StaffSidebar, StaffHeader, StaffProfileMenu, PageHeader, DashboardCard, ChartContainer, DataTableShell, StatusBadge, PublicNavbar and PublicFooter. Styles are scoped in `apps/frontend/src/styles/layouts.css`; existing local licensed Inter/Noto fonts are reused. EN/UR strings live in the existing translation resources.

## Role navigation and integration

| Session role     | Dashboard            | Sidebar after Dashboard                                                            |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------- |
| SUPER_ADMIN      | `/staff/super-admin` | Staff Accounts, Branches, Branch Lead Assignments, Audit Logs                      |
| HR_LEAD          | `/staff/hr`          | Applications, Members, Transfers, HR Activity                                      |
| BRANCH_LEAD      | `/staff/branch`      | Branch Members, Teams, Transfer Requests, Collections, Remittances, Weekly Reports |
| FINANCE_REVIEWER | `/staff/finance`     | Weekly Reports, Financial Adjustments, Remittances, Financial Overview, Exports    |
| CONTENT_EDITOR   | `/staff/content`     | Programs, Events, Public Pages, Drafts & Publishing                                |

`role-navigation.ts` contains the single menu/dashboard configuration. Each role has its own four metrics, four panel headings and relevant quick links from the corresponding frame. Values are unavailable em dashes and decorative panel placeholders explicitly labelled unavailable. There are no invented statistics, rows, sample identities or financial amounts. Branch identity comes from the validated session assignment, not the sample branch in Figma. The header/profile use the actual authenticated name and translated role.

`/staff` and the legacy `/dashboard` resolve through real auth guards to the user's dashboard. Role roots enforce their actual role; unsupported module slugs are denied. `/staff/account` displays the real identity; `/staff/security` embeds the existing functioning password change. Sign out uses the existing confirmation/revocation flow. Frontend guards are navigation controls: future business endpoints must enforce server permissions/branch scoping themselves.

Developer B: replace the explicit `StaffModulePage` unavailable state with approved feature routes under the existing role shell; consume central request/TanStack Query and validated backend contracts. Keep business services out of layout components. Replace dashboard placeholders only when authorized aggregate/projection APIs exist. Keep shared role configuration and translations consistent. No financial/CMS service, schema or production auth policy was changed.

## Public and responsive behavior

Seven separate public routes: `/`, `/about`, `/programs`, `/branches`, `/events`, `/get-involved`, `/contact`. They share a public navbar/footer independent of staff chrome, seven real navigation links, volunteer CTA and no public login/signup control. Home and inner page templates follow the supplied frames. CMS content, contact details and application submission remain explicitly unavailable/placeholders; no simulated submission is offered.

Sidebar is fixed at logical inline start, full `100dvh` with `100vh` fallback, 260px expanded or 84px collapsed. Main offset follows its width. Sidebar navigation scrolls independently at short viewport heights; collapse preference is a non-secret session preference. Mobile uses a native modal dialog with focus containment, Escape, backdrop/close controls and navigation close. Public navigation uses the same accessible drawer primitive. Logical CSS properties mirror staff/public layout in Urdu; email values remain LTR. Widths 1440, 1024, 768, 390 and 320 were checked for horizontal overflow.

## Visual comparison and intentional differences

Local-only PNG references are in `docs/evidence/layouts/reference`; browser captures are in `docs/evidence/layouts/browser/layout-implementation`. All evidence PNGs are gitignored, never uploaded. Figma screenshot exports are scaled previews, while browser captures use original frame viewport dimensions. Comparisons are visual checks, not a pixel-perfect or automated image-diff acceptance claim.

Compared the expanded dashboard, role variants, collapsed sidebar, profile, RTL, public templates and mobile drawer captures against retrieved frames. Corrected desktop card placement to y249, panel padding/height, public menu spacing, and mobile metric spacing. Preserved the source colors, local font family, 260/84px sidebar, 78px staff header, card/panel structure and responsive hierarchy.

Intentional differences: actual user name/role and explicit unavailable labels add information absent from some source frames. Existing account-security/sign-out access stays available. Mobile retains all four program links whereas the source preview shows two. Inner public content remains in normal document flow because the source footer overlaps its third content slot. Compact page footers and the detailed Contact footer reuse the two supplied footer variants; compact footers also expose functional navigation. Urdu wraps according to translated content. Browser glyph rasterization can differ from Figma. These layouts do not establish production content or business readiness.

## Verification

`npm run test:e2e`: PASS 3 public shell tests plus 13 authenticated/layout tests (5 existing authentication regressions and 8 new layout tests). Uses a disposable PostgreSQL database with synthetic accounts for all five roles, never the user's local administrator. The guarded `e2e/runtime-server.ts` raises throttling only in the disposable test runtime so repeated real-session navigation checks do not consume production rate limits; production limiter settings are unchanged.

Browser checks cover real role menus/session identity, each dashboard, unavailable module navigation and cross-role denial; fixed sidebar height/position, 84px collapse/offset, independent sidebar scroll, profile Escape/focus, RTL placement, responsive widths, mobile drawer open/Escape/focus/navigation close; seven public pages, header/footer, no login/signup, mobile public links and Urdu. Existing auth tests cover mandatory change, password change, logout/revocation, expiry, validation, loading guards and error states. New screenshots contain synthetic identities only.

Final typecheck, lint, build and line-ending-aware formatting passed. The complete 13-test auth/layout rerun passed after one intermittent blank-page public-navigation failure; the isolated public test also passed unchanged. Cause of that intermittent run failure remains unestablished. Layout translation parity passed for 137 nonempty keys in each language. Screenshot tests use reduced-motion preference to avoid recording sidebar transitions halfway through. Detailed commands/results are recorded in the single development handoff ledger. Existing unit/integration backend coverage from A-02 is historical; this frontend change does not claim a fresh backend unit/integration run. No commit, push, PR, remote CI, deployment or business acceptance performed.
