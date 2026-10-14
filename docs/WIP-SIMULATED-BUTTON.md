# Scenario button input

Robot scenarios now accept optional `inputs: {button: boolean}`. Omitted input means released, preserving old scene behavior. The robot button sensor reads this explicit model value. Invalid numeric inputs and unknown input fields are rejected by the scene schema.

The simulator exposes a localized checkbox in English, Russian and Kazakh. Changing it stops and terminates the previous worker, invalidates pending responses, and clears the previous trace. Reset/run starts a fresh model with the selected input. Scenario exports preserve the selected value and retain `origin: simulation`; it is not a physical button observation. The input is static during a run, not a timed button event stream.

Domain tests cover pressed/released/default states, JSON round trips and schema rejection. Electron tests exercise input changes, cleared state and export, plus the existing L07 worker scenario. Type checking, lint and all 59 unit/integration tests passed.

L09 still needs its authored lesson and complete decision-table exercise. This model capability does not count as another lesson. It remains a source change after the published 0.3.0 artifacts.
