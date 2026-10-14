# Photo attribution CSS cascade correction

Review of the preceding scrolled screenshot found author/license still inherited the enlarged24px theory font despite the intended13px caption rule. Increased selector scope to the content photo dialog, so it wins the existing lesson paragraph rule without changing theory size.

Source Electron reading test now asserts actual13px computed font and20.8px line height under24px theory/more-spacing preference, alongside source scrolling, Close hit testing,480px containment, Escape/focus return. Test/build/typecheck/lint passed. Final screenshot visually reviewed and retained. Earlier compact-caption wording was implementation intent, not proof of the displayed size; this report supplies that missing verification.

Source-only; immutable installer unchanged. Full stylesheet cleanup/accessibility certification remains outside this scoped check.
