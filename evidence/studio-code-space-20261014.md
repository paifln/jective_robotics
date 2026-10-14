# Narrow Studio code space

Source verification on the current Windows host; not a new packaged installer verification.

The focused Studio density test initially failed: at 800×700 the code editor exposed only 130px after opening a four-file project. A first 270px layout minimum still exposed only 180px because the code heading/file controls consume part of the layout. Both failed observations are retained in this report; the threshold was not reduced.

The final narrow-window layout minimum is 320px. The existing test now passes the >=220px visible code requirement at 800×700 in English, Russian and Kazakh, checks no horizontal document overflow at 1366/1093/911/800/480px widths, and retains four commands plus the board-run control and keyboard focus checks. Light/dark command foreground contrast is checked against the rendered opaque background (>=4.5), replacing an obsolete exact palette assertion.

`npm run build`: exit0. `npm run typecheck`: exit0 after test helper change. Focused Playwright test: 1 passed, 5.2s, exit0. Screenshots `test-results/studio-density/code-800-light.png` and `code-800-dark.png`; light screenshot visually reviewed. No physical board, upload, full UI acceptance, installer lifecycle or Windows 10 verification is claimed. Existing private package artifacts were not regenerated for this source change.
