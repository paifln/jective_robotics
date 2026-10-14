# Pixel simulator and components dock 0.8.0

The robot world now uses a nearest-neighbour pixel canvas: a tracked robot with front-facing eyes, brick walls, tiled grass, asphalt routes and a checked finish zone. The circular finish zone and wall bounds follow the actual simulator geometry. Rendering does not change the physics, sensor model or learner program.

Game checks show program completion, collisions anywhere in the retained run history, and whether the robot currently occupies the finish zone. A completed program outside the finish fails the finish check. These generic game checks do not automatically award lesson completion. Errors and cancellation do not produce a successful code check.

Studio has a compact components dock under the editor. Board, motor and sensor icons show the selected profile, assigned GPIO roles and the opened serial port. Motor and button pin checks reuse the profile validator and detect shared GPIO conflicts across component families. Selecting a sensor keeps the motor assignments; changing the motor interface clears only the previous motor interface's roles. Buttons lead directly to connection configuration and the device monitor; port enumeration is read-only until the user explicitly opens a selected port. An open serial port is not evidence of the board identity or electrically connected motors and sensors. Physical component detection requires a supported board firmware and has not been implemented; the UI explicitly marks physical verification as unknown.

This version also packages the current L18–L23 lessons and their recorded dashboards, inspection worksheet and simulated motor experiments. There are 23 authored lessons out of the 60 requested in the master document. The full master scope remains incomplete.

Screenshots and actual Electron interaction evidence are in evidence/pixel-game. Hardware tests are NOT RUN. Existing 0.7.0 release evidence remains unchanged.
