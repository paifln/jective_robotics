# Photo dialog Close after scrolling

Extended source reading regression to scroll to the enlarged motor photo's source paragraph at480x700, assert Close image remains within viewport and center hit testing reaches the actual button. Existing accessible name, attribution, horizontal containment, Escape and focus-return checks still pass. One Electron test passed, typecheck/lint checked afterward. This adds evidence for the preceding sticky header implementation; no production source change in this turn.

Scope is one photo dialog, not all windows or complete accessibility/release acceptance.
