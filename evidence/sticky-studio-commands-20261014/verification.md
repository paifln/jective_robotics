# Studio command visibility while reading results

Studio command toolbar is sticky within its scroll area, with opaque theme page background and scoped stacking above editors. When compact Studio scrolls to results/indicator controls, Save/Compile/Run on board remain at the top. Existing content stays in the scroll area, no panel removed.

Build/typecheck/lint and two source Electron tests passed. Compact800x700 smoke asserts Save button bounds between y68 and180 after result scrolling and actual center hit testing; editor height at least180 and result/experiment accessibility remain checked. Desktop both themes, menu/editor expansion, localized tooltip bounds and existing conversion/indicator checks pass. Screenshot visually reviewed.

Source-only CSS change. Latest immutable persistence-polish package and its real compiler proof remain unchanged; no new installer or physical verification.
