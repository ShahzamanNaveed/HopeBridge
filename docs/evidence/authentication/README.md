# Authentication design comparison

Evidence PNGs are local-only and excluded by `.gitignore` at the user's request. They are not included in Git commits/pushes. Text inventories/comparison metadata remain reviewable; screenshot links below work locally and will not resolve from GitHub without separately supplied images. Product SVG icons and licensed fonts remain source assets and are not ignored.

Source: the user-supplied **HopeBridge — Staff Authentication UI Design Set.fig**. [Frame inventory](frames.json) records source/canvas SHA-256 hashes, actual node IDs, dimensions and screenshot paths. There are 26 original frames: 25 screen/state frames and one component/style guide.

The local file was decoded using its embedded Kiwi schema and deflate/Zstandard chunks. Reference PNGs were rendered at original dimensions from the original exported shape and glyph paths, including Urdu glyph positions. They are local reconstructions of the supplied export, **not Figma server screenshots**. The connector rejected the export's local-only origin key and the desktop app did not expose an import window. No substitute template, illustration or branding was used.

Real Chromium screenshots were captured by the executed authentication E2E suite against Express and disposable PostgreSQL. Network gates only delayed real requests for loading screenshots; incorrect credentials/expiry/password changes/logout used real database state. The network-error variant deliberately aborts a request. No mock authentication backend is used by the product or complete browser flow. Synthetic email values and masked test inputs explain some textual screenshot differences; no real administrator credential is present.

See the [comparison overview](comparison-overview.png), [per-frame original/browser paths](frames.json), and [RGB difference measurements](comparison.json). All 25 pairs have matching viewport dimensions. Pixel statistics are informational, not an invented passing threshold or a pixel-perfect claim.

## Frame-to-component mapping

| Frames | Source state                                                  | React implementation / route                                                                                |
| ------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 01–03  | Desktop / mobile / Urdu login                                 | `StaffLoginPage`, `AuthShell`, `AuthField`; `/staff/login`                                                  |
| 04–07  | Required fields / wrong credentials / network error / loading | Same login form with actual validation/mutation state                                                       |
| 08–10  | Desktop / mobile / Urdu mandatory replacement                 | `FirstLoginPage`, `PasswordForm`; `/staff/first-login`                                                      |
| 11–15  | Required / mismatch / weak / updating / success               | Same mandatory form and real password-change state; success exposes the workspace continuation link         |
| 16     | Temporary credential expires during restricted session        | `FirstLoginTemporaryExpired`, `AuthShell`; protected-session expiry state                                   |
| 17     | Account password change and success notification              | `ChangePasswordPage`, `PasswordForm`; `/staff/security`                                                     |
| 18     | 403                                                           | `AuthStatusPage` denied; `/staff/access-denied`                                                             |
| 19     | Session expired                                               | `AuthStatusPage` expired; `/staff/session-expired`                                                          |
| 20     | Temporary credential expired guidance                         | `AuthStatusPage`; `/staff/temporary-password-expired`                                                       |
| 21     | Account unavailable guidance                                  | `AuthStatusPage`; `/staff/account-unavailable`                                                              |
| 22     | Credentials changed guidance                                  | `AuthStatusPage`; `/staff/credentials-changed`                                                              |
| 23     | Session check                                                 | `AuthenticationLoading`; initial/per-navigation check, no protected children                                |
| 24     | Logout confirmation                                           | `LogoutPage`; `/staff/logout`                                                                               |
| 25     | Signed out                                                    | `AuthStatusPage`; `/staff/signed-out`                                                                       |
| 26     | Component/style guide                                         | Scoped `auth.css` tokens, local fonts, original exported glyphs and controls; not a separate product screen |

Desktop frames use 1440×900, mobile frames 390×844. Status/confirmation/loading frames use their exact 900×720, 900×620, 900×650, 720×540 and 720×700 source dimensions. Browser tests additionally verify 320/390/768/1440 widths and Urdu horizontal overflow. The account card's source y=265 and password input width=650 are also asserted in the browser.

## Corrections made after comparison

- Matched the 45%/55% split, form widths/offsets, green/background/border palette, 10px controls, brand position, card radii, callouts and support text.
- Disabled Inter's browser optical sizing: its default narrowed the 39px hero by roughly 27px. The resulting measured first-line width is within a fraction of a pixel of the exported glyph baseline width.
- Exported the actual star, eye, status, spinner and logout glyph outlines as local SVGs to avoid OS fallback-symbol differences. Product code does not use a whole-screen image.
- Corrected account card padding/breadcrumb margins, mobile subtitle wrapping, validation error slots, success notification position and Urdu label/input spacing.
- Retained actual accessible labels, password toggle buttons, keyboard focus, error associations, loading/live statuses and fluid narrow layouts.

## Deliberate differences and limits

1. The approved 15-character password policy is included in guidance and validation, replacing the source's nonspecific strength wording. This can add a line inside the existing guidance box.
2. Frame 16's supplied 720px split has a 430px form starting at x=307, extending beyond its right edge and overlapping the 324px hero. The implementation uses the established condensed layout at that width to keep expiry guidance and sign-out usable. This frame is intentionally not an exact positional match.
3. English/Urdu switching is additionally available on status/account screens. The Urdu hero preserves the original English branding/copy, while forms, messages, controls and accessible labels are localized. Inputs retain LTR entry direction and reserve usable space for the visibility button.
4. Live font rasterization/antialiasing and one-pixel border/text-baseline differences remain between exported glyph paths and browser fonts. The local Inter release and installed Noto Nastaliq Urdu distribution match the named families; exact original font binary versions were not embedded in the `.fig`.
5. Error text may expand vertically when needed for Urdu/readability instead of reproducing overlapping source text boxes. The first-login success button continues to the real workspace after session rotation.

No exact/pixel-perfect acceptance or native Figma render equivalence is claimed. The complete authentication behavior and supplied layout have concrete local browser evidence; B design/consumer review remains pending.
