# Studio buttons, persistence and stacking

Actual source Electron Studio journey PASS: open current student settings, rename the block project, use Save project, assert real Unicode file name/source/Blockly content, reject oversized save with unchanged committed bytes, use Open project and recover the same name/generated preview. An external metadata edit with unchanged revision then causes the ordinary Save button to show localized recovery text; external bytes and current learner name/code remain unchanged. Native file destinations use explicit dialog fixtures. No save/open IPC handler overrides.

Visual inspection revealed Blockly's toolbox rendered above the fixed application header after scrolling. Studio editors now form an isolated stacking context at z-index 0. A header hit-test after scroll and a manually inspected final screenshot prove it is above the toolbox. Source localized keyboard-navigation regression also PASS. Typecheck/lint/build PASS.

Only CSS production source changed in this turn; persistence scenario updated for current student navigation while preserving size/conflict/file assertions. No new package made for this CSS change; current-source-file-conflict-20261013 is the preceding immutable EXE. No installer/Windows10/physical/compiler acceptance claim.
