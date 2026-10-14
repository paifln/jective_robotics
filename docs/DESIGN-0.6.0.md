# Jective interface refresh

Requested outcome: a clear, calm interface inspired by the simplicity of Apple and the approachable building workflow of LEGO, with a white Jective logo on a blue launch screen.

The application now opens with a local SVG rendering of the supplied logo on #211dff. The launch screen is present in the initial HTML, before the editor bundle executes. It fades after workspace initialization and a short brand introduction; it does not report invented progress. Reduced-motion settings disable animation. The native window has the same background to avoid a white startup flash.

The default workspace focuses on blocks. A single control switches between Blocks, Blocks + code and Code. Blocks are grouped into Start, Outputs, Timing, Logic, Math, Variables, Sensors and Functions, including localized category names. A grid, zoom controls and larger rounded block shapes support editing. The main action opens the robot simulator; real compilation remains a separate action. Stop/cancel/export actions appear when applicable. Board details, verification details and workspace tools use disclosure controls.

Navigation stays on the left and displays only the chosen language. The default for a new workspace is light; explicitly saved preferences survive upgrades. Panels, input fields, focus rings and typography share one visual system. Lessons have starter/reference actions at the top, and the lesson list scrolls independently. Simulation has readable status, time, distance validity and position cards beside the world. Detailed JSON remains available through a disclosure.

The logo is recreated as SVG geometry from the supplied image, including its J mark and wordmark. The window and installer icons are rendered locally from the same J mark. No remote fonts, images or services are required. Header and launch layouts use separate vector arrangements of the same brand geometry.

Verification includes actual Electron navigation, startup color/logo presentation, editor switching, a 1000-pixel window without horizontal document overflow, visible lesson loading, simulation, theme persistence and language switching. Editor generation checks now inspect the complete source attached to the Monaco element because Monaco only renders visible lines; matching text in its viewport cannot prove the complete source. Compiler and save/reopen tests independently check the resulting code and files.

Screenshots are retained under evidence/design. This refresh does not complete the original master specification: 17 of 60 lessons are authored, translations still require educator review, and clean Windows deployment and physical hardware acceptance remain outstanding.
