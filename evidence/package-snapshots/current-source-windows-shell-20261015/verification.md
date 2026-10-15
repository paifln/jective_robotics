# Windows desktop snapshot — 15 October 2026

Private unsigned build, version0.8.18. Not installed or published. The existing release installer was not overwritten. Current development host: Windows_NT 10.0.26300; Windows10 acceptance NOT RUN.

## Artifact identity

- EXE SHA-256: `4b9fe643e07b068ba145da01e5f0d383da63bb60008fb4863029fe0cdd264a35`.
- ASAR SHA-256: `0ae026761484492b1b916d247da26b4f163ea00d19ca823abc260289de1e3ed7`.
- Installer: 221962030 bytes; SHA-256 `cd03dea3871facd9fcf68d1493c714a358b9e68b0204e50c6c2c833365c5bdba`.
- Local path: `.verification/current-source-windows-shell-20261015/JECTIVE Robotics Studio Setup 0.8.18.exe`.
- Authenticode inspection reports NotSigned. No signing identity was supplied. NSIS branding configuration includes JECTIVE icon/header/sidebar assets; installer screens and install/update/uninstall lifecycle were not exercised.

## Verified scope

Actual unchanged production EXE: workspace IPC startup, duplicate-instance handling, binary security fuses and equality of all 276 built files PASS. Intentional one-byte ASAR mutation was rejected with an integrity diagnostic; original archive restored and hash checked.

Production UI through temporary loopback Chromium diagnostics, with isolated profile and no main inspector or handler overrides: native maximize/restore, branded close control; recorded audio decode/pause and24px reading setting; thematic ADC visual; managed learner credential encrypted on disk and student configuration denied; two requests to a local gateway fixture; long-chat scrolling at1200×800 and800×700; visual scene adjustment with line retained and no JSON editor; RU/KK accessible names; ordinary navigation above Blockly;55-project pagination/search/older-project read. PASS. No renderer HTTP requests observed during the measured flow. No live OpenAI request or physical hardware action.

Two earlier UI attempts are retained locally: first connected before the studio page appeared; second left the nonmodal chat open over a scene control. The final fixture waits for the page and minimizes chat through its real button before using that covered area. No force-click or production UI change was used to bypass it. This is not a claim that an open floating chat never covers any workspace control; its verified clearance protects Studio command buttons.

Raw local reports: package-verification.json, ui-smoke.json, first-ui-smoke.json, second-ui-smoke.json (generated JSON excluded from Git publication). Separate actual compiler/restart journey now PASS for one deliberately invalid and one corrected minimal Arduino program. See learner-windows-shell-compiler-20261015-1dbe3777/verification.md for exact operation IDs and limits. These results do not establish release readiness, Windows10 compatibility, installation safety or suitability of the future physical kit.
